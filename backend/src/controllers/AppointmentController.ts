import { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { addMinutes } from "date-fns";


export const AppointmentController = {
  // LISTAR AGENDAMENTOS (Visão da Dona)
   async index(req: Request, res: Response) {
    try {
      const { status, date } = req.query;

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
      }

      const appointments = await prisma.appointment.findMany({
        where,
        include: {
          client: true,
          service: true
        },
        orderBy: {
          startTime: 'asc'
        }
      });
      return res.json(appointments);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erro ao buscar agendamentos." });
    }
  },

  // O NOVO MÉTODO (Precisa ser static para funcionar no seu router)
   async listAvailableTimes(req: Request, res: Response) {
    try {
      const { date, serviceId } = req.query; // Recebe ex: 2026-01-31

      if (!date) {
        return res.status(400).json({ error: "Data é obrigatória" });
      }

      // Cria data no timezone do Brasil (UTC-3)
      const searchDate = new Date(`${date}T00:00:00-03:00`);
      const startOfDay = new Date(searchDate);
      startOfDay.setUTCHours(3, 0, 0, 0); // 00:00 BRT = 03:00 UTC
      const endOfDay = new Date(searchDate);
      endOfDay.setUTCHours(26, 59, 59, 999); // 23:59 BRT = 02:59 UTC do dia seguinte

      // Busca o que já está ocupado ou pendente
      const appointments = await prisma.appointment.findMany({
        where: {
          startTime: { gte: startOfDay, lte: endOfDay },
          NOT: { status: 'canceled' } // Garante que horários cancelados fiquem livres
        }
      });

      // Busca configurações do estúdio para montar a grade dinâmica
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

      const allTimes: string[] = [];
      // Gera horários de forma simples, sem conversões confusas
      for (let hour = openingTime; hour < closingTime; hour++) {
        for (let minute = 0; minute < 60; minute += slotMinutes) {
          const h = String(hour).padStart(2, "0");
          const m = String(minute).padStart(2, "0");
          allTimes.push(`${h}:${m}`);
        }
      }

      // Filtra os horários livres considerando timezone do Brasil
      const nowUTC = new Date();
      // Aplica offset de -3 horas (BRT = UTC-3)
      const brtOffset = -3 * 60 * 60 * 1000;
      const nowBRT = new Date(nowUTC.getTime() + brtOffset);
      
      // Data de hoje em BRT em string para comparação
      const year = nowBRT.getUTCFullYear();
      const month = String(nowBRT.getUTCMonth() + 1).padStart(2, '0');
      const day = String(nowBRT.getUTCDate()).padStart(2, '0');
      const todayStr = `${year}-${month}-${day}`;
      
      const isToday = date === todayStr;
      const currentHour = nowBRT.getUTCHours();
      const currentMinute = nowBRT.getUTCMinutes();

      console.log(`DEBUG: Hora BRT agora: ${currentHour}:${String(currentMinute).padStart(2,'0')}, Data: ${todayStr}, Comparando com: ${date}`);

      const availableTimes = allTimes.filter(time => {
        const [h, m] = time.split(':').map(Number);
        const slotStart = new Date(`${date}T${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:00-03:00`);
        const slotEnd = addMinutes(slotStart, slotMinutes);

        // Se for hoje, não mostra horários que já passaram
        if (isToday) {
          if (h < currentHour || (h === currentHour && m <= currentMinute)) {
            console.log(`DEBUG: Filtrando ${h}:${m} (passou)`);
            return false;
          }
        }

        return !appointments.some(app => {
          const appStart = new Date(app.startTime);
          const appEnd = new Date(app.endTime);
          return appStart < slotEnd && appEnd > slotStart;
        });
      });

      return res.json(availableTimes);
    } catch (error) {
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

      return res.status(201).json(appointment);

    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Erro ao processar agendamento" });
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