import { prisma } from '../lib/prisma.js';
export const ClosedDateController = {
    // Listar todas as datas de fechamento
    async index(req, res) {
        try {
            const closedDates = await prisma.closedDate.findMany({
                orderBy: { date: 'asc' }
            });
            return res.json(closedDates);
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ error: "Erro ao buscar datas de fechamento" });
        }
    },
    // Criar uma nova data de fechamento
    async create(req, res) {
        const { date, reason } = req.body;
        if (!date) {
            return res.status(400).json({ error: "Data é obrigatória" });
        }
        try {
            // Converte a string de data para objeto Date
            const closedDate = new Date(date);
            // Verifica se já existe fechamento para essa data
            const existing = await prisma.closedDate.findFirst({
                where: {
                    date: closedDate
                }
            });
            if (existing) {
                return res.status(409).json({ error: "Já existe um fechamento para esta data" });
            }
            const newClosedDate = await prisma.closedDate.create({
                data: {
                    date: closedDate,
                    reason: reason || null
                }
            });
            return res.status(201).json(newClosedDate);
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ error: "Erro ao criar data de fechamento" });
        }
    },
    // Deletar uma data de fechamento
    async delete(req, res) {
        const { id } = req.params;
        try {
            await prisma.closedDate.delete({
                where: { id: Number(id) }
            });
            return res.status(200).json({ message: "Data de fechamento removida com sucesso" });
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ error: "Erro ao remover data de fechamento" });
        }
    }
};
