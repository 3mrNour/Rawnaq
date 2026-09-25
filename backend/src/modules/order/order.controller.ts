import { Request, Response, NextFunction } from 'express';
import { OrderService } from './order.service.js';
import { createOrderSchema, getOrdersSchema, updateOrderStatusSchema } from './order.validators.js';

export const createOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { body } = createOrderSchema.parse({ body: req.body });

    const newOrder = await OrderService.createOrder(req.shopId!, body);

    res.status(201).json({
      status: 'success',
      data: newOrder,
    });
  } catch (err) {
    next(err);
  }
};

export const getOrders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { query } = getOrdersSchema.parse({ query: req.query });

    const result = await OrderService.getOrders(req.shopId!, query);

    res.status(200).json({
      status: 'success',
      data: result.orders,
      pagination: result.pagination,
    });
  } catch (err) {
    next(err);
  }
};

export const updateOrderStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { params, body } = updateOrderStatusSchema.parse({ params: req.params, body: req.body });

    const updatedOrder = await OrderService.updateStatus(req.shopId!, params.id, body.status);

    res.status(200).json({
      status: 'success',
      data: updatedOrder,
    });
  } catch (err) {
    next(err);
  }
};
