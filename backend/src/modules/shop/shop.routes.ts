import { Router } from 'express';
import * as shopController from './shop.controller.js';

const router = Router();

router.post('/', shopController.createShop);
router.get('/metrics', shopController.getMetrics);
router.get('/', shopController.getShops);
router.patch('/:id/expiry', shopController.extendExpiry);
router.patch('/:id/status', shopController.updateStatus);
router.post('/:id/revoke-key', shopController.revokeKey);
router.post('/:id/unlock-device', shopController.unlockDevice);

export default router;
