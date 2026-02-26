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
        const { openingTime, closingTime, closedDays, ownerWhatsApp } = req.body;
        
        // Valida WhatsApp somente se for enviado
        if (ownerWhatsApp !== undefined && ownerWhatsApp !== null && ownerWhatsApp !== '') {
            const normalizedOwnerWhatsApp = String(ownerWhatsApp).replace(/\D/g, "");
            if (normalizedOwnerWhatsApp.length !== 10 && normalizedOwnerWhatsApp.length !== 11) {
                return res.status(400).json({ error: "Informe DDD + número (10 ou 11 dígitos)." });
            }
        }
        
        const updateData: Record<string, unknown> = {};
        if (openingTime !== undefined) updateData.openingTime = openingTime;
        if (closingTime !== undefined) updateData.closingTime = closingTime;
        if (closedDays !== undefined) updateData.closedDays = closedDays;
        if (ownerWhatsApp !== undefined && ownerWhatsApp !== null && ownerWhatsApp !== '') {
            updateData.ownerWhatsApp = String(ownerWhatsApp).replace(/\D/g, "");
        }
        
        const existingConfig = await prisma.studioConfig.findFirst();
        if (!existingConfig) {
            const createdConfig = await prisma.studioConfig.create({
                data: updateData
            });
            return res.json(createdConfig);
        }

        const config = await prisma.studioConfig.update({
            where: { id: existingConfig.id },
            data: updateData
        });
        return res.json(config);
    }
}