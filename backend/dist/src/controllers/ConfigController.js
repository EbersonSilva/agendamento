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
        const { openingTime, closingTime, closedDays, ownerWhatsApp } = req.body;
        if (ownerWhatsApp !== undefined) {
            const normalizedOwnerWhatsApp = String(ownerWhatsApp).replace(/\D/g, "");
            if (!normalizedOwnerWhatsApp) {
                return res.status(400).json({ error: "WhatsApp da dona é obrigatório." });
            }
            if (normalizedOwnerWhatsApp.length !== 10 && normalizedOwnerWhatsApp.length !== 11) {
                return res.status(400).json({ error: "Informe DDD + número (10 ou 11 dígitos)." });
            }
        }
        const config = await prisma.studioConfig.update({
            where: { id: 1 }, // Supondo que há apenas uma configuração com ID 1
            data: {
                openingTime,
                closingTime,
                closedDays,
                ownerWhatsApp: ownerWhatsApp === undefined ? undefined : String(ownerWhatsApp).replace(/\D/g, "")
            }
        });
        return res.json(config);
    }
};
