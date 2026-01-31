import { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';

export const ServiceController ={
    async index (req: Request, res: Response) {
        try {
            const services = await prisma.service.findMany();
            return res.status(200).json(services);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: "Erro ao buscar serviços" });
        }
    }

}