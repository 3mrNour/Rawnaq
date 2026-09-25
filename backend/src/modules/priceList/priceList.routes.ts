import { Router } from 'express';
import * as priceListController from './priceList.controller.js';
import { authorizeRole } from '../../middleware/authorizeRole.middleware.js';

const router = Router();

// GET accessible by any authenticated tenant staff
router.get('/', priceListController.getPriceList);

// POST, PATCH, DELETE strictly owner-only
router.post('/', authorizeRole('owner'), priceListController.addPriceListItem);
router.patch('/:itemId', authorizeRole('owner'), priceListController.updatePriceListItem);
router.delete('/:itemId', authorizeRole('owner'), priceListController.removePriceListItem);

export default router;
