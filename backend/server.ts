import express from "express";
import cors from "cors";
import { router } from "./src/routes/index.js"; 

const app = express();

app.use(cors());
app.use(express.json());
app.use(router);


const PORT = 3333;
app.listen(PORT, () => {
  console.log(`🚀 Servidor do estúdio rodando em http://localhost:${PORT}`);
});
