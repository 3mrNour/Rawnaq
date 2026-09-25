import { Router } from 'express';
import * as adminAuthController from './adminAuth.controller.js';

const router = Router();

router.post('/login', adminAuthController.login);

export default router;
