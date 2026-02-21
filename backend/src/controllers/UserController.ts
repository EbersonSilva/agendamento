import { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import bcrypt from 'bcryptjs';

export const UserController ={
    async index (req: Request, res: Response) {
        try {
            const users = await prisma.user.findMany();
            return res.status(200).json(users);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: "Erro ao buscar usuários" });
        }
    },
    async createAdmin(req: Request, res: Response) {
        const { name, phone, password } = req.body;

        if (!name || !phone || !password) {
            return res.status(400).json({ error: "Nome, telefone e senha são obrigatórios." });
        }

        try {
            // Verifica se já existe um ADMIN com este telefone
            const existingAdmin = await prisma.user.findFirst({
                where: { 
                    phone,
                    isAdmin: true 
                }
            });

            if (existingAdmin) {
                return res.status(409).json({ error: "Já existe um administrador com este telefone." });
            }

            const passwordHash = await bcrypt.hash(password, 10);

            const user = await prisma.user.create({
                data: {
                    name,
                    phone,
                    passwordHash,
                    isAdmin: true
                }
            });

            return res.status(201).json({
                id: user.id,
                name: user.name,
                phone: user.phone,
                isAdmin: user.isAdmin
            });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: "Erro ao criar usuário admin" });
        }
    },

    async changePassword(req: Request, res: Response) {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user?.id; // Vem do middleware de autenticação

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: "Senha atual e nova senha são obrigatórias." });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ error: "A nova senha deve ter no mínimo 6 caracteres." });
        }

        try {
            const user = await prisma.user.findUnique({
                where: { id: Number(userId) }
            });

            if (!user) {
                return res.status(404).json({ error: "Usuário não encontrado." });
            }

            // Verifica se a senha atual está correta
            const passwordMatch = await bcrypt.compare(currentPassword, user.passwordHash);

            if (!passwordMatch) {
                return res.status(401).json({ error: "Senha atual incorreta." });
            }

            // Cria o hash da nova senha
            const newPasswordHash = await bcrypt.hash(newPassword, 10);

            // Atualiza a senha no banco
            await prisma.user.update({
                where: { id: Number(userId) },
                data: { passwordHash: newPasswordHash }
            });

            return res.status(200).json({ message: "Senha alterada com sucesso!" });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: "Erro ao alterar senha" });
        }
    }

}