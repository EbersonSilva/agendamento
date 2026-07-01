import { google } from "googleapis";
import { prisma } from "../lib/prisma.js";
const getOAuthClient = () => {
    return new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, process.env.GOOGLE_REDIRECT_URI);
};
export const GoogleAuthController = {
    async redirectUrl(req, res) {
        try {
            const oauth2Client = getOAuthClient();
            const scopes = [
                "https://www.googleapis.com/auth/calendar",
                "https://www.googleapis.com/auth/calendar.events"
            ];
            const url = oauth2Client.generateAuthUrl({
                access_type: "offline",
                prompt: "consent",
                scope: scopes,
            });
            return res.json({ url });
        }
        catch (error) {
            console.error("[GoogleAuthController.redirectUrl]", error);
            return res.status(500).json({ error: "Erro ao gerar URL de autorização." });
        }
    },
    async callback(req, res) {
        try {
            const { code } = req.query;
            if (!code) {
                return res.status(400).send("Código de autorização não fornecido.");
            }
            const oauth2Client = getOAuthClient();
            const { tokens } = await oauth2Client.getToken(code);
            if (!tokens.access_token || !tokens.refresh_token) {
                return res.status(400).send("Falha ao obter tokens da Google. Certifique-se de autorizar o acesso off-line.");
            }
            // Limpa configuração anterior e salva a nova
            await prisma.googleConfig.deleteMany();
            await prisma.googleConfig.create({
                data: {
                    accessToken: tokens.access_token,
                    refreshToken: tokens.refresh_token,
                    expiryDate: new Date(tokens.expiry_date || Date.now() + 3600 * 1000),
                },
            });
            const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
            return res.redirect(`${frontendUrl}/admin/configuracoes?googleCalendar=connected`);
        }
        catch (error) {
            console.error("[GoogleAuthController.callback]", error);
            const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
            return res.redirect(`${frontendUrl}/admin/configuracoes?googleCalendar=error`);
        }
    },
    async status(req, res) {
        try {
            const config = await prisma.googleConfig.findFirst();
            return res.json({ connected: !!config });
        }
        catch (error) {
            console.error("[GoogleAuthController.status]", error);
            return res.status(500).json({ error: "Erro ao verificar status da integração." });
        }
    },
    async disconnect(req, res) {
        try {
            await prisma.googleConfig.deleteMany();
            return res.json({ message: "Desconectado do Google Calendar com sucesso." });
        }
        catch (error) {
            console.error("[GoogleAuthController.disconnect]", error);
            return res.status(500).json({ error: "Erro ao desconectar integração." });
        }
    },
};
