import { Router } from 'express';
import * as tenantAuthController from './tenantAuth.controller.js';

const router = Router();

router.post('/login', tenantAuthController.login);

export default router;
