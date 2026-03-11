import { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { addMinutes } from "date-fns";
import { sendAppointmentNotification } from "../lib/mailer.js";

function hasClosedRangeConflict(
  startMinutes: number,
  endMinutes: number,
  ranges: Array<{ startTimeMinutes: number | null; endTimeMinutes: number | null }>
) {
  return ranges.some(range => {
    if (range.startTimeMinutes === null || range.endTimeMinutes === null) {
      return true;
    }

    return startMinutes < range.endTimeMinutes && endMinutes > range.startTimeMinutes;
  });
}


export const AppointmentController = {
  // LISTAR AGENDAMENTOS (Visão da Dona)
   async index(req: Request, res: Response) {
    try {
      const { status, date, includePast } = req.query;

      const where: Record<string, unknown> = {};

      const statusValue = Array.isArray(status) ? status[0] : status;
      if (statusValue) {
        const normalizedStatus = String(statusValue).toLowerCase();
        if (normalizedStatus === 'scheduled') {
          where.OR = [
            { status: { equals: 'scheduled', mode: 'insensitive' } },
            { status: { equals: 'confirmed', mode: 'insensitive' } }
          ];
        } else if (normalizedStatus !== 'all') {
          // Se status não for 'all', filtra pelo status específico
          where.status = { equals: String(statusValue), mode: 'insensitive' };
        }
        // Se for 'all', não adiciona filtro de status (retorna todos)
      } else {
        where.status = { equals: 'pending', mode: 'insensitive' };
      }

      if (date) {
        const dateValue = Array.isArray(date) ? date[0] : date;
        const searchDate = new Date(`${dateValue}T00:00:00`);
        const startOfDay = new Date(searchDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(searchDate);
        endOfDay.setHours(23, 59, 59, 999);
        where.startTime = { gte: startOfDay, lte: endOfDay };
      } else {
        // Sem data, so aplica filtro de "futuros" quando nao ha filtro explicito de status.
        // Isso evita esconder historico em telas administrativas com status definido.
        const includePastValue = Array.isArray(includePast) ? includePast[0] : includePast;
        const shouldIncludePast = String(includePastValue || '').toLowerCase() === 'true';
        const hasExplicitStatus = Boolean(statusValue) && String(statusValue).toLowerCase() !== 'all';

        if (!shouldIncludePast && !hasExplicitStatus) {
          where.endTime = { gte: new Date() };
        }
      }

      const appointments = await prisma.appointment.findMany({
        where,
        orderBy: {
          startTime: 'asc'
        }
      });

      const clientIds = [...new Set(appointments.map(app => app.clientId))];
      const serviceIds = [...new Set(appointments.map(app => app.serviceId))];

      const [clients, services] = await Promise.all([
        prisma.user.findMany({
          where: { id: { in: clientIds } }
        }),
        prisma.service.findMany({
          where: { id: { in: serviceIds } }
        })
      ]);

      const clientMap = new Map(clients.map(client => [client.id, client]));
      const serviceMap = new Map(services.map(service => [service.id, service]));

      // Filtra registros inconsistentes para evitar quebrar o endpoint em produção.
      const response = appointments
        .map(appointment => {
          const client = clientMap.get(appointment.clientId);
          const service = serviceMap.get(appointment.serviceId);

          if (!client || !service) {
            return null;
          }

          return {
            ...appointment,
            client,
            service,
          };
        })
        .filter((appointment): appointment is NonNullable<typeof appointment> => appointment !== null);

      return res.json(response);
    } catch (error) {
      console.error("[AppointmentController.index]", error);
      const details = error instanceof Error ? error.message : String(error);
      res.status(500).json({
        error: "Erro ao buscar agendamentos.",
        details,
      });
    }
  },

  // O NOVO MÉTODO (Precisa ser static para funcionar no seu router)
   async listAvailableTimes(req: Request, res: Response) {
    try {
      const { date, serviceId } = req.query; // Recebe ex: 2026-01-31

      if (!date) {
        return res.status(400).json({ error: "Data é obrigatória" });
      }

      console.log(`[listAvailableTimes] Iniciando busca para data: ${date}, serviceId: ${serviceId}`);

      // Busca agendamentos daquele dia considerando horario do Brasil
      const dayStart = new Date(`${date}T00:00:00-03:00`);
      const dayEnd = new Date(`${date}T23:59:59.999-03:00`);

      const appointments = await prisma.appointment.findMany({
        where: {
          startTime: { gte: dayStart, lte: dayEnd },
          NOT: { status: 'canceled' }
        }
      });

      console.log(`[listAvailableTimes] Agendamentos encontrados para ${date}: ${appointments.length}`);

      // Busca ranges de fechamento para o dia específico (usando apenas a data, sem hora)
      const closedRanges = await prisma.closedDate.findMany({
        where: {
          date: new Date(`${date}T00:00:00-03:00`)
        }
      });

      console.log(`[listAvailableTimes] Ranges fechados encontrados para ${date}: ${closedRanges.length}`, closedRanges);

      // Verifica se há fechamento de dia INTEIRO (ambos nulos)
      const hasFullDayClosure = closedRanges.some(
        range => range.startTimeMinutes === null && range.endTimeMinutes === null
      );

      if (hasFullDayClosure) {
        console.log(`[listAvailableTimes] Dia ${date} está completamente fechado`);
        return res.json([]);
      }

      // Busca configurações do estúdio
      const config = await prisma.studioConfig.findFirst();
      const openingTime = config?.openingTime ?? 8;
      const closingTime = config?.closingTime ?? 18;

      let slotMinutes = 60;
      if (serviceId) {
        const service = await prisma.service.findUnique({
          where: { id: Number(serviceId) }
        });
        if (!service) {
          return res.status(404).json({ error: "Serviço não encontrado" });
        }
        slotMinutes = service.durationMinutes;
      }

      // Gera lista de horários simples (Ex: 08:00, 09:00...22:00)
      // Se slotMinutes = 120, gera: 08:00, 10:00, 12:00, etc
      const allTimes: string[] = [];
      const startMinutes = openingTime * 60;
      const endMinutes = closingTime * 60;
      for (let m = startMinutes; m < endMinutes; m += slotMinutes) {
        const h = Math.floor(m / 60);
        const min = m % 60;
        const hStr = String(h).padStart(2, "0");
        const minStr = String(min).padStart(2, "0");
        allTimes.push(`${hStr}:${minStr}`);
      }

      // Verifica qual é "hoje" considerando America/Sao_Paulo
      const now = new Date();
      const nowParts = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Sao_Paulo',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }).formatToParts(now);
      const partMap: Record<string, string> = {};
      nowParts.forEach(part => {
        if (part.type !== 'literal') {
          partMap[part.type] = part.value;
        }
      });

      const todayStr = `${partMap.year}-${partMap.month}-${partMap.day}`;
      const isToday = String(date) === todayStr;
      const currentHour = Number(partMap.hour);
      const currentMinute = Number(partMap.minute);

      // Filtra horários disponíveis
      const availableTimes = allTimes.filter(time => {
        const [h, m] = time.split(':').map(Number);
        const slotStartMinutes = h * 60 + m;
        const slotEndMinutes = slotStartMinutes + slotMinutes;

        // Se for hoje, filtra horários que ja passaram
        if (isToday) {
          if (h < currentHour || (h === currentHour && m <= currentMinute)) {
            return false;
          }
        }

        if (hasClosedRangeConflict(slotStartMinutes, slotEndMinutes, closedRanges)) {
          return false;
        }

        // Verifica se existe agendamento conflitante nesse horário
        const slotStart = new Date(`${date}T${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:00-03:00`);
        const slotEnd = addMinutes(slotStart, slotMinutes);

        return !appointments.some(app => {
          const appStart = new Date(app.startTime);
          const appEnd = new Date(app.endTime);
          return appStart < slotEnd && appEnd > slotStart;
        });
      });

      console.log(`[listAvailableTimes] Data: ${date}, Serviço: ${serviceId}, Horários disponíveis: ${availableTimes.length}, Todos os horários: ${allTimes.length}`, {
        hasFullDayClosure,
        closedRangesCount: closedRanges.length,
        appointmentsCount: appointments.length,
        openingTime,
        closingTime,
        isToday,
        timeZone: 'America/Sao_Paulo'
      });

      return res.json(availableTimes);
    } catch (error) {
      console.error("Erro em listAvailableTimes:", error);
      return res.status(500).json({ error: "Erro ao buscar horários" });
    }
  },

  // CRIAR AGENDAMENTO (Fluxo de 3 passos da Cliente)
  async create(req: Request, res: Response) {
    const { clientName, phone, serviceId, startTime } = req.body;

    try {
      const normalizedPhone = String(phone || '').replace(/\D/g, '');
      if (!normalizedPhone || (normalizedPhone.length !== 10 && normalizedPhone.length !== 11)) {
        return res.status(400).json({
          error: "Telefone inválido. Informe DDD + número (10 ou 11 dígitos)."
        });
      }

      // 1. BUSCA CONFIGURAÇÕES DO ESTÚDIO
      const config = await prisma.studioConfig.findFirst() || {
        openingTime: 8,
        closingTime: 18,
        closedDays: [0]
      };

      // Parse da data considerando timezone do Brasil (UTC-3)
      // Cria o horário local do Brasil e ajusta para UTC antes de salvar
      const [datePart, timePart] = String(startTime).split('T');
      const [year, month, dayOfMonth] = datePart.split('-').map(Number);
      const [hourPart, minutePart, secondPart = '0'] = timePart.split(':');
      
      // Cria a data em horário local e força interpretação como Brasil
      const localTimeStr = `${year}-${String(month).padStart(2, '0')}-${String(dayOfMonth).padStart(2, '0')}T${String(hourPart).padStart(2, '0')}:${String(minutePart).padStart(2, '0')}:${String(secondPart).padStart(2, '0')}-03:00`;
      const start = new Date(localTimeStr);
      const hour = Number(hourPart);
      const minute = Number(minutePart);
      const day = start.getDay();

      // 2. VALIDAÇÕES DE HORÁRIO
      if (config.closedDays.includes(day)) {
        return res.status(400).json({ error: "O estúdio está fechado neste dia." });
      }

      if (hour < config.openingTime || hour >= config.closingTime) {
        return res.status(400).json({
          error: `Horário fora do expediente (${config.openingTime}:00 às ${config.closingTime}:00).`
        });
      }

      // 3. BUSCA O SERVIÇO E CALCULA O TÉRMINO
      const service = await prisma.service.findUnique({
        where: { id: Number(serviceId) }
      });

      if (!service) return res.status(404).json({ error: "Serviço não encontrado" });

      const startMinutes = hour * 60 + minute;
      const endMinutes = startMinutes + service.durationMinutes;

      if (endMinutes > config.closingTime * 60) {
        return res.status(400).json({
          error: `O serviço ultrapassa o expediente (${config.openingTime}:00 às ${config.closingTime}:00).`
        });
      }

      const dayStart = new Date(`${datePart}T00:00:00-03:00`);
      const dayEnd = new Date(`${datePart}T23:59:59.999-03:00`);

      const closedRanges = await prisma.closedDate.findMany({
        where: {
          date: {
            gte: dayStart,
            lte: dayEnd
          }
        }
      });

      const hasBlockedRange = hasClosedRangeConflict(startMinutes, endMinutes, closedRanges);
      if (hasBlockedRange) {
        return res.status(400).json({
          error: "Este horário está bloqueado por fechamento excepcional. Escolha outro horário."
        });
      }

      const end = addMinutes(start, service.durationMinutes);

      // 4. VERIFICA CONFLITOS DE HORÁRIO
      const conflict = await prisma.appointment.findFirst({
        where: {
          // 1. Filtra tudo que NÃO está cancelado (Pendente ou Confirmado bloqueiam o horário)
          NOT: {
            status: 'canceled'
          },
          // 2. Verifica a colisão de horário (Isso é um AND automático com o NOT acima)
          startTime: { lt: end },
          endTime: { gt: start },
        }
      });

      if (conflict) {
        return res.status(400).json({
          error: "Este horário já está ocupado. Por favor, escolha outro."
        });
      }

      // 5. TRATAMENTO DO CLIENTE - Sempre cria um novo cliente
      const client = await prisma.user.create({
        data: {
          name: clientName,
          phone: normalizedPhone,
          passwordHash: "",
          isAdmin: false
        }
      });

      // 6. CRIAÇÃO DO AGENDAMENTO VINCULADO AO CLIENTE
      const appointment = await prisma.appointment.create({
        data: {
          clientId: client.id,
          serviceId: Number(serviceId),
          startTime: start,
          endTime: end,
          status: 'pending'
        },
      });

      // 7. ENVIA EMAIL DE NOTIFICAÇÃO PARA A DONA (silencioso — falha não bloqueia resposta)
      try {
        const cfg = await prisma.studioConfig.findFirst();
        if (cfg?.ownerEmail) {
          await sendAppointmentNotification({
            ownerEmail: cfg.ownerEmail,
            clientName,
            clientPhone: normalizedPhone,
            serviceName: service.name,
            startTime: start,
            isManual: false,
          });
        }
      } catch (emailErr) {
        console.error('Aviso: falha ao enviar email de notificação:', emailErr);
      }

      return res.status(201).json(appointment);

    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Erro ao processar agendamento" });
    }
  },

  // CRIAR AGENDAMENTO MANUAL (Apenas para Admin — sem restrição de grade de horários)
  async createManual(req: Request, res: Response) {
    const { clientName, phone, serviceId, startTime, notes, forceOverlap } = req.body;

    try {
      const normalizedPhone = String(phone || '').replace(/\D/g, '');
      if (!normalizedPhone || (normalizedPhone.length !== 10 && normalizedPhone.length !== 11)) {
        return res.status(400).json({
          error: "Telefone inválido. Informe DDD + número (10 ou 11 dígitos)."
        });
      }

      if (!startTime || !serviceId) {
        return res.status(400).json({ error: "Data/hora e serviço são obrigatórios." });
      }

      // Suporte a ISO com ou sem timezone. Se não vier offset, assume -03:00.
      const raw = String(startTime);
      const hasTimezone = /([+-]\d{2}:\d{2}|Z)$/.test(raw);
      const hasSeconds = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?$/.test(raw);
      const localTimeStr = hasTimezone
        ? raw
        : hasSeconds
          ? `${raw}-03:00`
          : `${raw}:00-03:00`;
      const start = new Date(localTimeStr);

      if (isNaN(start.getTime())) {
        return res.status(400).json({ error: "Data/hora inválida." });
      }

      // Busca o serviço
      const service = await prisma.service.findUnique({
        where: { id: Number(serviceId) }
      });
      if (!service) return res.status(404).json({ error: "Serviço não encontrado." });

      const end = addMinutes(start, service.durationMinutes);

      // Verifica conflito (pode ser ignorado com forceOverlap = true)
      if (!forceOverlap) {
        const conflict = await prisma.appointment.findFirst({
          where: {
            NOT: { status: 'canceled' },
            startTime: { lt: end },
            endTime: { gt: start },
          }
        });
        if (conflict) {
          return res.status(409).json({
            error: "Já existe um agendamento nesse horário. Deseja forçar o encaixe mesmo assim?"
          });
        }
      }

      // Cria o cliente
      const client = await prisma.user.create({
        data: {
          name: clientName,
          phone: normalizedPhone,
          passwordHash: "",
          isAdmin: false
        }
      });

      // Cria o agendamento como manual e já confirmado
      const appointment = await prisma.appointment.create({
        data: {
          clientId: client.id,
          serviceId: Number(serviceId),
          startTime: start,
          endTime: end,
          status: 'confirmed',
          isManualSlot: true,
          notes: notes || null
        },
        include: { client: true, service: true }
      });

      // ENVIA EMAIL DE NOTIFICAÇÃO PARA A DONA (silencioso)
      try {
        const cfg = await prisma.studioConfig.findFirst();
        if (cfg?.ownerEmail) {
          await sendAppointmentNotification({
            ownerEmail: cfg.ownerEmail,
            clientName,
            clientPhone: normalizedPhone,
            serviceName: service.name,
            startTime: start,
            isManual: true,
          });
        }
      } catch (emailErr) {
        console.error('Aviso: falha ao enviar email de notificação:', emailErr);
      }

      return res.status(201).json(appointment);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Erro ao criar agendamento manual." });
    }
  },

  // ATUALIZAR STATUS DO AGENDAMENTO (CONFIRMAR/REJEITAR via WhatsApp)
  async updateStatus(req: Request, res: Response) {
    const { id } = req.params;
    const { newStatus } = req.body; // "confirmed" ou "rejected"

    try {
      const updated = await prisma.appointment.update({
        where: { id: Number(id) },
        data: { status: newStatus }
      });

      // Se o status for "confirmed", aqui você dispararia a lógica do WhatsApp
      return res.json(updated);
    } catch (error) {
      return res.status(500).json({ error: "Erro ao atualizar status" });
    }
  },

  // CANCELAMENTO LÓGICO
  async cancel(req: Request, res: Response) {
    const { id } = req.params;
    try {
      const appointment = await prisma.appointment.findUnique({
        where: { id: Number(id) }
      });

      if (!appointment) {
        return res.status(404).json({ error: "Agendamento não encontrado" });
      }

      await prisma.appointment.update({
        where: { id: Number(id) },
        data: { status: "canceled" }
      });

      return res.status(200).json({ message: "Agendamento cancelado com sucesso!" });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Erro ao cancelar agendamento" });
    }
  }

  
};