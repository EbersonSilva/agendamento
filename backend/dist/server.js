// Este arquivo é o ponto de entrada do servidor Express. Ele configura o middleware, as rotas e inicia o servidor na porta especificada.
import express from "express";
import cors from "cors";
import "dotenv/config";
import { router } from "./src/routes/index.js";
const app = express();
const PORT = Number(process.env.PORT) || 3333;
app.use(cors()); // Habilita CORS para permitir requisições de diferentes origens (útil para o frontend)
app.use(express.json()); // Habilita o parsing de JSON no corpo das requisições
// Endpoint de saude — acesse /health no navegador para verificar se o backend esta online
app.get('/health', (_req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        port: PORT,
        env: process.env.NODE_ENV || 'development',
        db: process.env.DATABASE_URL ? 'configurado' : 'NAO CONFIGURADO',
    });
});
app.use(router); // Usa as rotas definidas no arquivo de rotas
// Inicia o servidor na porta configurada pelo ambiente ou usa 3333 localmente
app.listen(PORT, () => {
    console.log(`Servidor do estudio rodando na porta ${PORT}`);
});
