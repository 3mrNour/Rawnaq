import { Request, Response, NextFunction } from 'express';
import * as priceListService from './priceList.service.js';
import * as validators from './priceList.validators.js';

export const getPriceList = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const list = await priceListService.listPriceListItems(req.shopId!);
    res.status(200).json({
      status: 'success',
      data: list,
    });
  } catch (error) {
    next(error);
  }
};

export const addPriceListItem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { body } = validators.addPriceListItemSchema.parse({ body: req.body });
    const item = await priceListService.addPriceListItem(req.shopId!, body as any);
    
    res.status(201).json({
      status: 'success',
      data: item,
    });
  } catch (error) {
    next(error);
  }
};

export const updatePriceListItem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { params, body } = validators.updatePriceListItemSchema.parse({ 
      params: req.params, 
      body: req.body 
    });

    const item = await priceListService.updatePriceListItem(req.shopId!, params.itemId, body);
    
    res.status(200).json({
      status: 'success',
      data: item,
    });
  } catch (error) {
    next(error);
  }
};

export const removePriceListItem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { params } = validators.itemIdParamSchema.parse({ params: req.params });
    await priceListService.removePriceListItem(req.shopId!, params.itemId);
    
    res.status(200).json({
      status: 'success',
      data: null,
    });
  } catch (error) {
    next(error);
  }
};
