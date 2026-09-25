import { Request, Response, NextFunction } from 'express';
import { Shop } from '../modules/shop/shop.model.js';
import { countScheduledItems } from '../modules/order/order.service.js';

export const checkCapacity = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { deliveryDate, items } = req.body;

    if (!deliveryDate || !Array.isArray(items)) {
      // If the body doesn't have the shape of an order, just pass through or let validation catch it
      return next();
    }

    if (!req.shopId) {
      return res.status(401).json({ status: 'error', message: 'Unauthorized' });
    }

    const shop = await Shop.findById(req.shopId);
    if (!shop) {
      return res.status(404).json({ status: 'error', message: 'Shop not found' });
    }

    const incomingCount = items.length;
    const existingCount = await countScheduledItems(req.shopId, deliveryDate);

    if (existingCount + incomingCount > shop.dailyCapacityLimit) {
      return res.status(409).json({
        status: 'error',
        code: 'CAPACITY_EXCEEDED',
        date: deliveryDate
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};
