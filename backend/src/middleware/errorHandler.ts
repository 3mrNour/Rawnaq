import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/AppError.js';

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof ZodError) {
    return res.status(400).json({
      status: 'error',
      statusCode: 400,
      message: 'Validation Error',
      errors: err.errors,
    });
  }

  // Handle Mongoose duplicate key error
  if ((err as any).code === 11000) {
    return res.status(409).json({
      status: 'error',
      statusCode: 409,
      message: 'Duplicate key error',
      details: (err as any).keyValue,
    });
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: 'error',
      statusCode: err.statusCode,
      message: err.message,
      ...(err.code && { code: err.code }),
    });
  }

  console.error('Unhandled Error:', err);
  return res.status(500).json({
    status: 'error',
    statusCode: 500,
    message: 'Internal Server Error',
  });
};
