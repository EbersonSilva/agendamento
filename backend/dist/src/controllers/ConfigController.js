import { prisma } from "../lib/prisma.js";
export const ConfigController = {
    // MÉTODO PARA BUSCAR CONFIGURAÇÕES DO ESTÚDIO
    async get(req, res) {
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
    async update(req, res) {
        const { openingTime, closingTime, closedDays, ownerWhatsApp, ownerEmail } = req.body;
        // Valida WhatsApp somente se for enviado
        if (ownerWhatsApp !== undefined && ownerWhatsApp !== null && ownerWhatsApp !== '') {
            const normalizedOwnerWhatsApp = String(ownerWhatsApp).replace(/\D/g, "");
            if (normalizedOwnerWhatsApp.length !== 10 && normalizedOwnerWhatsApp.length !== 11) {
                return res.status(400).json({ error: "Informe DDD + número (10 ou 11 dígitos)." });
            }
        }
        const updateData = {};
        if (openingTime !== undefined)
            updateData.openingTime = openingTime;
        if (closingTime !== undefined)
            updateData.closingTime = closingTime;
        if (closedDays !== undefined)
            updateData.closedDays = closedDays;
        if (ownerWhatsApp !== undefined && ownerWhatsApp !== null && ownerWhatsApp !== '') {
            updateData.ownerWhatsApp = String(ownerWhatsApp).replace(/\D/g, "");
        }
        if (ownerEmail !== undefined) {
            updateData.ownerEmail = ownerEmail === '' ? null : String(ownerEmail).trim();
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
};
