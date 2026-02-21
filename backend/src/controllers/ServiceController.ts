import { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';

export const ServiceController ={
    async index (req: Request, res: Response) {
        try {
            const services = await prisma.service.findMany({
                orderBy: { // Ordena por nome em ordem crescente
                    name: 'asc'
                }
            });
            return res.status(200).json(services);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: "Erro ao buscar serviços" });
        }
    },

    async create (req: Request, res: Response) {
        const { name, price, duration } = req.body;

        try {
            const newService = await prisma.service.create({
                data: {
                    name,
                    price: parseFloat(price),
                    durationMinutes: parseInt(duration)
                }
            });
            return res.status(201).json(newService)
        } catch (error) {
            return res.status(400).json({ error: "Erro ao criar serviço" });
        }
    },

    async update (req: Request, res: Response) {
        const { id } = req.params;
        const {name, price, duration} = req.body;

        try{
            const updatedService = await prisma.service.update({
                where: { id: Number(id) },
                data: {
                    name,
                    price: price ? parseFloat(price) : undefined,
                    durationMinutes: duration ? parseInt(duration) : undefined
                }
            });
            return res.status(200).json(updatedService);
        } catch (error) {
            return res.status(400).json({ error: "Erro ao atualizar serviço" });
        }
    },

    // async destroy (req: Request, res: Response) {
    //     const { id } = req.params;
    //     console.log('🗑️ Requisição de exclusão recebida para ID:', id);

    //     try{
    //         const service = await prisma.service.update({
    //             where: { id: Number(id) },
    //             data: {
    //                 active: false
    //             }
    //         });
            
    //         if (!service) {
    //             console.log('❌ Serviço não encontrado:', id);
    //             return res.status(404).json({ error: "Serviço não encontrado" });
    //         }

    //         await prisma.service.delete({
    //             where: { id: Number(id) }
    //         });
    //         console.log('✅ Serviço excluído com sucesso:', id);
    //         return res.status(204).send();
    //     } catch (error) {
    //         console.error('❌ Erro ao desativar serviço:', error);
    //         return res.status(400).json({ error: "Erro ao desativar serviço" });
    //     }
    // }

    async disable(req: Request, res: Response) {
        const { id } = req.params;
        try {
            const updatedService = await prisma.service.update({
                where: { id: Number(id) },
                data: { active: false }
            });
            return res.status(200).json(updatedService);
        } catch (error) {
            return res.status(400).json({ error: "Erro ao desativar serviço" });
        }
    },

    async activate(req: Request, res: Response) {
        const { id } = req.params;
        try {
            const updatedService = await prisma.service.update({
                where: { id: Number(id) },
                data: { active: true }
            });
            return res.status(200).json(updatedService);
        } catch (error) {
            return res.status(400).json({ error: "Erro ao ativar serviço" });
        }
    }
}
