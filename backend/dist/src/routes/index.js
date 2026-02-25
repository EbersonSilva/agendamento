import { Router } from "express";
import { AppointmentController } from "../controllers/AppointmentController.js";
import { ServiceController } from "../controllers/ServiceController.js";
import { UserController } from "../controllers/UserController.js";
import { ConfigController } from "../controllers/ConfigController.js";
import { ClosedDateController } from "../controllers/ClosedDateController.js";
import { MetricsController } from "../controllers/MetricsController.js";
import { AuthController } from "../controllers/AuthController.js";
import { verifyToken, verifyAdmin } from "../middleware/auth.js";
export const router = Router();
// ROTAS DE AUTENTICAÇÃO
router.post('/login', AuthController.store); // Login do admin
// ROTAS DE AGENDAMENTOS
router.get('/appointments', AppointmentController.index); // Lista todos os agendamentos
router.get('/appointments/available', AppointmentController.listAvailableTimes); // Lista horários disponíveis para agendamento
router.post('/appointments', AppointmentController.create); // Cria um novo agendamento
router.put('/appointments/:id', verifyToken, verifyAdmin, AppointmentController.updateStatus); // Atualiza status de um agendamento (protegido)
router.put('/appointments/:id/cancel', AppointmentController.cancel); // Cancela um agendamento existente
// ROTAS DE SERVIÇOS
router.get('/services', ServiceController.index); // Lista todos os serviços
router.post('/services', verifyToken, verifyAdmin, ServiceController.create); // Cria um novo serviço (protegido)
router.put('/services/:id', verifyToken, verifyAdmin, ServiceController.update); // Atualiza um serviço existente (protegido)
router.patch('/services/:id/disable', verifyToken, verifyAdmin, ServiceController.disable); // Inativa um serviço existente (protegido)
router.patch('/services/:id/activate', verifyToken, verifyAdmin, ServiceController.activate); // Reativa um serviço inativo (protegido)
// ROTAS DE USUARIOS
router.post('/users/admin', verifyToken, verifyAdmin, UserController.createAdmin); // Cria usuário admin (protegido)
router.get('/users', verifyToken, verifyAdmin, UserController.index); // Lista usuários (protegido)
router.put('/users/change-password', verifyToken, UserController.changePassword); // Trocar senha (protegido)
// ROTAS DE CONFIGURAÇÃO
router.get('/config', ConfigController.get); // Obtém as configurações atuais
router.put('/config', verifyToken, verifyAdmin, ConfigController.update); // Atualiza as configurações atuais (protegido)
// ROTAS DE FECHAMENTOS EXCEPCIONAIS
router.get('/closed-dates', ClosedDateController.index); // Lista datas de fechamento
router.post('/closed-dates', verifyToken, verifyAdmin, ClosedDateController.create); // Adiciona data de fechamento (protegido)
router.delete('/closed-dates/:id', verifyToken, verifyAdmin, ClosedDateController.delete); // Remove data de fechamento (protegido)
// ROTAS DE MÉTRICAS
router.get('/metrics', verifyToken, verifyAdmin, MetricsController.getMetrics); // Obtém métricas do sistema (protegido)
