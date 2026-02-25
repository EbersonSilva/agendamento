// Este arquivo é o ponto de entrada do servidor Express. Ele configura o middleware, as rotas e inicia o servidor na porta especificada.
import express from "express";
import cors from "cors";
import "dotenv/config";
import { router } from "./src/routes/index.js";
const app = express();
app.use(cors()); // Habilita CORS para permitir requisições de diferentes origens (útil para o frontend)
app.use(express.json()); // Habilita o parsing de JSON no corpo das requisições
app.use(router); // Usa as rotas definidas no arquivo de rotas
// Inicia o servidor na porta 3333
const PORT = 3333;
app.listen(PORT, () => {
    console.log(`🚀 Servidor do estúdio rodando em http://localhost:${PORT}`);
});
