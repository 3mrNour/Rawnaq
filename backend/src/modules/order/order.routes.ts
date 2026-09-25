import { Router } from 'express';
import { createOrder, getOrders, updateOrderStatus } from './order.controller.js';
import { checkCapacity } from '../../middleware/checkCapacity.middleware.js';

const router = Router();

router.post('/', checkCapacity, createOrder);
router.get('/', getOrders);
router.patch('/:id/status', updateOrderStatus);

export default router;
