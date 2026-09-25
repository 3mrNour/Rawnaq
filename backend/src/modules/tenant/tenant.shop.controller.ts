import { Request, Response, NextFunction } from 'express';
import { Shop } from '../shop/shop.model.js';
import { AppError } from '../../utils/AppError.js';
import { z } from 'zod';

export const getShopMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const shop = await Shop.findById(req.shopId).lean();
    if (!shop) {
      throw new AppError(404, 'Shop not found');
    }

    // Mask license key: RWNQ-****-****-****
    let maskedLicense = shop.licenseKey;
    if (maskedLicense && maskedLicense.startsWith('RWNQ-')) {
      const parts = maskedLicense.split('-');
      if (parts.length > 1) {
        maskedLicense = `RWNQ-${parts.slice(1).map(() => '****').join('-')}`;
      }
    }

    res.status(200).json({
      status: 'success',
      data: {
        ...shop,
        licenseKey: maskedLicense
      }
    });
  } catch (error) {
    next(error);
  }
};

export const updateShopMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      body: z.object({
        dailyCapacityLimit: z.number().int().positive().optional(),
      })
    });

    const parsed = schema.parse({ body: req.body });
    const { dailyCapacityLimit } = parsed.body;

    const shop = await Shop.findById(req.shopId);
    if (!shop) {
      throw new AppError(404, 'Shop not found');
    }

    if (dailyCapacityLimit !== undefined) {
      shop.dailyCapacityLimit = dailyCapacityLimit;
    }

    await shop.save();

    res.status(200).json({ status: 'success', data: shop });
  } catch (error) {
    next(error);
  }
};
