import { Router } from 'express';
import * as assignmentController from './assignment.controller.js';

const router = Router();

// POST /api/tenant/assignments
// Production floor scan endpoint: authenticates via shop context (tenant auth) + worker PIN in body
router.post('/', assignmentController.assignItem);

export default router;
