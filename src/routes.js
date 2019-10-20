import { Router } from 'express';
import multer from 'multer';
import multerConfig from './config/multer';

import UserController from './app/controllers/UserController';
import SessionController from './app/controllers/SessionController';
import FileController from './app/controllers/FileController';
import ProviderController from './app/controllers/ProviderController';
import AppointmentsController from './app/controllers/AppointmentsController';
import ScheduleController from './app/controllers/ScheduleController';
import NotificationController from './app/controllers/NotificationController';
import AvailableController from './app/controllers/AvailableController';

import authMiddleware from './app/middlewares/auth';

const routes = new Router();
const upload = multer(multerConfig);

routes.post('/users', UserController.store);
routes.post('/sessions', SessionController.store);

// A PARTIR DAQUI TODAS AS ROTAS SÃO AUTENTICADAS, ANTES NÃO SÃO
routes.use(authMiddleware);

// USERS
routes.put('/users', UserController.update);

// PROVIDERS
routes.get('/providers', ProviderController.index);
routes.get('/providers/:providerId/available', AvailableController.index);

// FILES
routes.post('/files', upload.single('file'), FileController.store);

// APPOINTMENTS
routes.get('/appointments', AppointmentsController.index);
routes.post('/appointments', AppointmentsController.store);
routes.delete('/appointments/:id', AppointmentsController.delete);

// NOTIFICAÇÕES
routes.get('/notifications', NotificationController.index);
routes.put('/notifications/:id', NotificationController.update);

// SCHEDULE
routes.get('/schedule', ScheduleController.index);

export default routes;
