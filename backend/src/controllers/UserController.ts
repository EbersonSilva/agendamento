import { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';

export const UserController ={
    async index (req: Request, res: Response) {
        try {
            const users = await prisma.user.findMany();
            return res.status(200).json(users);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: "Erro ao buscar usuários" });
        }
    }

}