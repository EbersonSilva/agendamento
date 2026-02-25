import { prisma } from '../lib/prisma.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
export const AuthController = {
    async store(req, res) {
        const { phone, password } = req.body;
        try {
            // 1. Busca apenas usuários ADMINISTRADORES com aquele telefone
            const user = await prisma.user.findFirst({
                where: {
                    phone,
                    isAdmin: true
                }
            });
            // 2. Validação: Administrador existe?
            if (!user) {
                return res.status(401).json({ error: "Administrador não encontrado ou credenciais inválidas." });
            }
            // 3. Validação: Senha existe?
            if (!user.passwordHash) {
                return res.status(401).json({ error: "Administrador não possui senha definida." });
            }
            // 4. Validação: A senha está correta?
            // Comparando a senha enviada com o hash salvo no banco
            const passwordMatch = await bcrypt.compare(password, user.passwordHash);
            if (!passwordMatch) {
                return res.status(401).json({ error: "Senha incorreta." });
            }
            // 5. Geração do Token JWT (o "crachá" de acesso)
            // O segredo ('SUA_CHAVE_SECRETA') deve ser igual ao do seu Middleware
            const token = jwt.sign({ id: user.id, isAdmin: user.isAdmin }, process.env.JWT_SECRET || 'secret_key_estudio', { expiresIn: '7d' } // Dona não precisa logar todo dia
            );
            // 6. Retorno dos dados (sem a senha, por segurança)
            return res.json({
                user: {
                    id: user.id,
                    name: user.name,
                    phone: user.phone
                },
                token
            });
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ error: "Erro interno no servidor." });
        }
    }
};
