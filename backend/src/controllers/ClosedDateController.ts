import { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';

function parseTimeToMinutes(value: unknown): number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const raw = String(value);
  const match = raw.match(/^([01]\d|2[0-3]):([0-5]\d)$/);
  if (!match) {
    return Number.NaN;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  return hours * 60 + minutes;
}

export const ClosedDateController = {
  // Listar todas as datas de fechamento
  async index(req: Request, res: Response) {
    try {
      const closedDates = await prisma.closedDate.findMany({
        orderBy: [
          { date: 'asc' },
          { startTimeMinutes: 'asc' }
        ]
      });
      return res.json(closedDates);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Erro ao buscar datas de fechamento" });
    }
  },

  // Criar uma nova data de fechamento
  async create(req: Request, res: Response) {
    const { date, reason, startTime, endTime } = req.body;

    if (!date) {
      return res.status(400).json({ error: "Data é obrigatória" });
    }

    try {
      // Converte a string de data para objeto Date no timezone local
      const [year, month, day] = date.split('-').map(Number);
      const closedDate = new Date(year, month - 1, day);

      const startTimeMinutes = parseTimeToMinutes(startTime);
      const endTimeMinutes = parseTimeToMinutes(endTime);

      if (Number.isNaN(startTimeMinutes) || Number.isNaN(endTimeMinutes)) {
        return res.status(400).json({ error: 'Horário inválido. Use o formato HH:mm' });
      }

      const isFullDay = startTimeMinutes === null && endTimeMinutes === null;

      if (!isFullDay) {
        if (startTimeMinutes === null || endTimeMinutes === null) {
          return res.status(400).json({ error: 'Informe horário inicial e final para fechamento parcial' });
        }

        if (startTimeMinutes >= endTimeMinutes) {
          return res.status(400).json({ error: 'Horário final deve ser maior que o horário inicial' });
        }
      }

      const existing = await prisma.closedDate.findMany({
        where: {
          date: closedDate
        }
      });

      if (isFullDay && existing.length > 0) {
        return res.status(409).json({ error: 'Já existe fechamento cadastrado para esta data' });
      }

      if (!isFullDay) {
        const hasFullDay = existing.some(item => item.startTimeMinutes === null || item.endTimeMinutes === null);
        if (hasFullDay) {
          return res.status(409).json({ error: 'Esta data já está fechada o dia todo' });
        }

        const hasOverlap = existing.some(item => {
          if (item.startTimeMinutes === null || item.endTimeMinutes === null) {
            return true;
          }
          return startTimeMinutes! < item.endTimeMinutes && endTimeMinutes! > item.startTimeMinutes;
        });

        if (hasOverlap) {
          return res.status(409).json({ error: 'Já existe um fechamento em conflito com este horário' });
        }
      }

      const newClosedDate = await prisma.closedDate.create({
        data: {
          date: closedDate,
          reason: reason || null,
          startTimeMinutes,
          endTimeMinutes
        }
      });

      return res.status(201).json(newClosedDate);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Erro ao criar data de fechamento" });
    }
  },

  // Deletar uma data de fechamento
  async delete(req: Request, res: Response) {
    const { id } = req.params;

    try {
      await prisma.closedDate.delete({
        where: { id: Number(id) }
      });

      return res.status(200).json({ message: "Data de fechamento removida com sucesso" });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Erro ao remover data de fechamento" });
    }
  }
};
