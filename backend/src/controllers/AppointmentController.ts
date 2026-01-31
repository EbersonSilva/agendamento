import { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { addMinutes } from "date-fns";


export const AppointmentController = {
  // LISTAR AGENDAMENTOS (Visão da Dona)
   async index(req: Request, res: Response) {
    try {
      const appointments = await prisma.appointment.findMany({
        where: {
          status: 'scheduled'
        },
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

      const searchDate = new Date(`${date}T00:00:00`); // evita shift de fuso horário
      const startOfDay = new Date(searchDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(searchDate);
      endOfDay.setHours(23, 59, 59, 999);

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
      let cursor = new Date(startOfDay);
      cursor.setHours(openingTime, 0, 0, 0);
      const endCursor = new Date(startOfDay);
      endCursor.setHours(closingTime, 0, 0, 0);

      while (cursor < endCursor) {
        const h = String(cursor.getHours()).padStart(2, "0");
        const m = String(cursor.getMinutes()).padStart(2, "0");
        allTimes.push(`${h}:${m}`);
        cursor = addMinutes(cursor, slotMinutes);
      }

      // Filtra os horários livres
      const now = new Date();
      const isToday = startOfDay.toDateString() === now.toDateString();

      const availableTimes = allTimes.filter(time => {
        const [h, m] = time.split(':').map(Number);
        const slotStart = new Date(startOfDay);
        slotStart.setHours(h, m, 0, 0);
        const slotEnd = addMinutes(slotStart, slotMinutes);

        if (isToday && slotStart <= now) {
          return false;
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
      // 1. BUSCA CONFIGURAÇÕES DO ESTÚDIO
      const config = await prisma.studioConfig.findFirst() || {
        openingTime: 8,
        closingTime: 18,
        closedDays: [0]
      };

      // Parse da data local sem conversão de fuso horário
      const [datePart, timePart] = String(startTime).split('T');
      const [year, month, dayOfMonth] = datePart.split('-').map(Number);
      const [hourPart, minutePart, secondPart = '0'] = timePart.split(':');
      const start = new Date(
        year,
        month - 1,
        dayOfMonth,
        Number(hourPart),
        Number(minutePart),
        Number(secondPart)
      );
      const hour = start.getHours();
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

      // 5. TRATAMENTO DO CLIENTE (Onde estava dando erro no 'let')
      let client;

      client = await prisma.user.findUnique({
        where: { phone: phone }
      });

      if (!client) {
        client = await prisma.user.create({
          data: {
            name: clientName,
            phone: phone,
            email: `${phone.replace(/\D/g, '')}@estudio.com`, // Email técnico para o @unique
            passwordHash: "",
            isAdmin: false
          }
        });
      }

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

  // LISTAR HORÁRIOS DISPONÍVEIS (Passo 2 do Fluxo da Cliente)
  // async listAvailableTimes(req: Request, res: Response) {
  //   const { date } = req.query; // Ex: 2026-01-31

  //   const searchDate = new Date(date as string);
  //   const startOfDay = new Date(searchDate.setHours(0, 0, 0, 0));
  //   const endOfDay = new Date(searchDate.setHours(23, 59, 59, 999));

  //   // 1. Busca agendamentos do dia que não estão cancelados
  //   const appointments = await prisma.appointment.findMany({
  //     where: {
  //       startTime: { gte: startOfDay, lte: endOfDay },
  //       status: { not: 'cancelled' }
  //     }
  //   });

  //   // 2. Define a grade de horários (Ex: 08:00 às 18:00)
  //   const allTimes = ["08:00", "09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00"];

  //   // 3. Filtra apenas os que não coincidem com o início de um agendamento existente
  //   const availableTimes = allTimes.filter(time => {
  //     const isOccupied = appointments.some(app => {
  //       const appTime = new Date(app.startTime).toLocaleTimeString('pt-BR', {
  //         hour: '2-digit',
  //         minute: '2-digit'
  //       });
  //       return appTime === time;
  //     });
  //     return !isOccupied;
  //   });

  //   return res.json(availableTimes);
  // },

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