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

      const start = new Date(startTime);
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
            status: 'cancelled'
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
        data: { status: "cancelled" }
      });

      return res.status(200).json({ message: "Agendamento cancelado com sucesso!" });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Erro ao cancelar agendamento" });
    }
  }
};