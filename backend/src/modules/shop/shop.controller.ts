import { Request, Response, NextFunction } from 'express';
import * as shopService from './shop.service.js';
import * as validators from './shop.validators.js';
import { SubscriptionStatus } from '../../types/rawnaq.types.js';

export const createShop = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = validators.createShopSchema.parse({ body: req.body });
    const { name, dailyCapacityLimit, expiryDate, priceList } = parsed.body;
    
    const shop = await shopService.createShop(
      name,
      dailyCapacityLimit,
      new Date(expiryDate),
      priceList || []
    );

    res.status(201).json({ status: 'success', data: shop });
  } catch (error) {
    next(error);
  }
};

export const getShops = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const search = req.query.search as string;
    const status = req.query.status as SubscriptionStatus;

    const shops = await shopService.getShops(search, status);
    res.status(200).json({ status: 'success', data: shops });
  } catch (error) {
    next(error);
  }
};

export const getMetrics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const metrics = await shopService.getMetrics();
    res.status(200).json({ status: 'success', data: metrics });
  } catch (error) {
    next(error);
  }
};

export const updateStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { params, body } = validators.setStatusSchema.parse({
      params: req.params,
      body: req.body,
    });

    const shop = await shopService.updateStatus(params.id, body.status);
    res.status(200).json({ status: 'success', data: shop });
  } catch (error) {
    next(error);
  }
};

export const extendExpiry = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { params, body } = validators.extendExpirySchema.parse({
      params: req.params,
      body: req.body,
    });

    const shop = await shopService.extendExpiry(params.id, new Date(body.newExpiryDate));
    res.status(200).json({ status: 'success', data: shop });
  } catch (error) {
    next(error);
  }
};

export const revokeKey = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { params } = validators.shopIdParamSchema.parse({ params: req.params });

    const shop = await shopService.revokeKey(params.id);
    res.status(200).json({ status: 'success', data: shop });
  } catch (error) {
    next(error);
  }
};

export const unlockDevice = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { params } = validators.shopIdParamSchema.parse({ params: req.params });

    const shop = await shopService.unlockDevice(params.id);
    res.status(200).json({ status: 'success', data: shop });
  } catch (error) {
    next(error);
  }
};
