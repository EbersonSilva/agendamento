import { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";

export const MetricsController = {
  async getMetrics(req: Request, res: Response) {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      // Total de agendamentos
      const totalAppointments = await prisma.appointment.count();
      
      // Agendamentos confirmados
      const confirmedAppointments = await prisma.appointment.count({
        where: { status: { equals: 'confirmed', mode: 'insensitive' } }
      });

      // Agendamentos cancelados
      const canceledAppointments = await prisma.appointment.count({
        where: { status: { equals: 'canceled', mode: 'insensitive' } }
      });

      // Agendamentos pendentes
      const pendingAppointments = await prisma.appointment.count({
        where: { status: { equals: 'pending', mode: 'insensitive' } }
      });

      // Agendamentos do mês atual
      const appointmentsThisMonth = await prisma.appointment.count({
        where: {
          startTime: { gte: startOfMonth }
        }
      });

      // Agendamentos da semana atual
      const appointmentsThisWeek = await prisma.appointment.count({
        where: {
          startTime: { gte: startOfWeek }
        }
      });

      // Serviços mais populares
      const popularServices = await prisma.appointment.groupBy({
        by: ['serviceId'],
        _count: { serviceId: true },
        orderBy: { _count: { serviceId: 'desc' } },
        take: 5
      });

      // Buscar nomes dos serviços
      const servicesWithNames = await Promise.all(
        popularServices.map(async (item) => {
          const service = await prisma.service.findUnique({
            where: { id: item.serviceId }
          });
          return {
            serviceName: service?.name || 'Desconhecido',
            count: item._count.serviceId
          };
        })
      );

      // Agendamentos por status
      const appointmentsByStatus = await prisma.appointment.groupBy({
        by: ['status'],
        _count: { status: true }
      });

      // Horários mais populares (agrupados por hora)
      const appointments = await prisma.appointment.findMany({
        select: { startTime: true }
      });

      const hourCounts: Record<number, number> = {};
      appointments.forEach(app => {
        const hour = new Date(app.startTime).getHours();
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      });

      const popularHours = Object.entries(hourCounts)
        .map(([hour, count]) => ({ hour: parseInt(hour), count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Taxa de cancelamento
      const cancellationRate = totalAppointments > 0 
        ? ((canceledAppointments / totalAppointments) * 100).toFixed(1)
        : '0';

      // Total de clientes únicos (baseado em telefones únicos)
      const uniqueClients = await prisma.user.count({
        where: { isAdmin: false }
      });

      return res.json({
        summary: {
          total: totalAppointments,
          confirmed: confirmedAppointments,
          canceled: canceledAppointments,
          pending: pendingAppointments,
          thisMonth: appointmentsThisMonth,
          thisWeek: appointmentsThisWeek,
          uniqueClients,
          cancellationRate: parseFloat(cancellationRate)
        },
        popularServices: servicesWithNames,
        appointmentsByStatus,
        popularHours
      });
    } catch (error) {
      console.error("Erro ao buscar métricas:", error);
      return res.status(500).json({ error: "Erro ao buscar métricas" });
    }
  }
};
