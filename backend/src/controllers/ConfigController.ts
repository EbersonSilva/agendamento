import { Request, Response } from "express";    
import { prisma } from "../lib/prisma.js";

export const ConfigController = {
    // MÉTODO PARA BUSCAR CONFIGURAÇÕES DO ESTÚDIO
    async get(req: Request, res: Response) {
        let config = await prisma.studioConfig.findFirst();
        if (!config) {
            // Se não existir configuração, cria uma padrão
            config = await prisma.studioConfig.create({
                data: {}
            });
        }
        return res.json(config);

    },


    // MÉTODO PARA ATUALIZAR CONFIGURAÇÕES DO ESTÚDIO
    async update(req: Request, res: Response) {
        const { openingTime, closingTime, closedDays } = req.body;
        const config = await prisma.studioConfig.update({
            where: { id: 1 }, // Supondo que há apenas uma configuração com ID 1
            data: {
                openingTime,
                closingTime,
                closedDays
            }
        });
        return res.json(config);
    }
}