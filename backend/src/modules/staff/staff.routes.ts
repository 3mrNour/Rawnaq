import { Router } from 'express';
import * as staffController from './staff.controller.js';
import { authorizeRole } from '../../middleware/authorizeRole.middleware.js';

const router = Router();

// GET is accessible by anyone authenticated (owner or cashier)
router.get('/', staffController.getStaffList);

// POST, PATCH, DELETE and earnings reports are strictly owner-only
router.post('/', authorizeRole('owner'), staffController.createStaff);
router.patch('/:id', authorizeRole('owner'), staffController.updateStaff);
router.delete('/:id', authorizeRole('owner'), staffController.deleteStaff);
router.get('/:id/earnings', authorizeRole('owner'), staffController.getStaffEarnings);

export default router;
