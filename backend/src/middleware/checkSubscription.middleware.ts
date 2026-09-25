import { Request, Response, NextFunction } from 'express';
import { Shop } from '../modules/shop/shop.model.js';

// Extend Express Request to include shopId
declare global {
// eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      shopId?: string;
    }
  }
}

export const checkSubscription = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const shopId = req.shopId;

    if (!shopId) {
      // If no shopId is provided, it means tenant auth didn't set it.
      // This is either a configuration error or unauthorized access.
      return res.status(401).json({
        code: 'UNAUTHORIZED',
        message: 'No shop ID context found for this request.',
      });
    }

    const shop = await Shop.findById(shopId);

    if (!shop) {
      return res.status(403).json({
        code: 'SUBSCRIPTION_INACTIVE',
        message: 'Shop not found.',
      });
    }

    if (shop.subscriptionStatus !== 'active' || new Date(shop.expiryDate) < new Date()) {
      return res.status(403).json({
        code: 'SUBSCRIPTION_INACTIVE',
        message: 'Subscription is inactive or expired.',
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};
