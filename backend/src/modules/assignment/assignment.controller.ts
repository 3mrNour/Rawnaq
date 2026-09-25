import { Request, Response, NextFunction } from 'express';
import { AssignmentService } from '../../services/assignment.service.js';
import { AppError } from '../../utils/AppError.js';
import { z } from 'zod';

const assignItemSchema = z.object({
  itemId: z.string().min(1, 'itemId is required'),
  pinCode: z.string().min(1, 'pinCode is required'),
});

export const assignItem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.shopId) {
      throw new AppError(401, 'Unauthorized: Shop context missing');
    }

    const validation = assignItemSchema.safeParse(req.body);
    if (!validation.success) {
      throw new AppError(400, validation.error.errors[0].message);
    }

    const { itemId, pinCode } = validation.data;

    const result = await AssignmentService.assignItemToWorker({
      shopId: req.shopId,
      itemId,
      pinCode,
    });

    res.status(200).json({
      status: 'success',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
