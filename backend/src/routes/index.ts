import { Router } from "express";
import { AppointmentController } from "../controllers/AppointmentController.js";
import { ServiceController } from "../controllers/ServiceController.js";
import { UserController } from "../controllers/UserController.js";

export const router = Router();

// ROTAS DE AGENDAMENTOS
router.get('/appointments', AppointmentController.index);
router.post('/appointments', AppointmentController.create);
router.put('/appointments/:id', AppointmentController.cancel);

// ROTAS DE SERVIÇOS
router.get('/services', ServiceController.index);

// ROTAS DE USUARIOS
router.get('/users', UserController.index);