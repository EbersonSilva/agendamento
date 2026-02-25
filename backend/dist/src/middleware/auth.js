import jwt from 'jsonwebtoken';
export function verifyToken(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: "Token não fornecido." });
    }
    // Extrai o token do header (formato: "Bearer TOKEN")
    const token = authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: "Token inválido." });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key_estudio');
        // Adiciona o usuário ao objeto Request
        req.user = decoded;
        next();
    }
    catch (error) {
        return res.status(401).json({ error: "Token expirado ou inválido." });
    }
}
export function verifyAdmin(req, res, next) {
    if (!req.user?.isAdmin) {
        return res.status(403).json({ error: "Acesso negado. Apenas administradores." });
    }
    next();
}
