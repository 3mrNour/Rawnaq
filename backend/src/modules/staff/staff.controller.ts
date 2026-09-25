import { Request, Response, NextFunction } from 'express';
import * as staffService from './staff.service.js';
import * as validators from './staff.validators.js';
import { EarningsService } from '../../services/earnings.service.js';

export const getStaffList = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const staff = await staffService.listStaff(req.shopId!);
    res.status(200).json({
      status: 'success',
      data: staff,
    });
  } catch (error) {
    next(error);
  }
};

export const createStaff = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { body } = validators.createStaffSchema.parse({ body: req.body });
    const staff = await staffService.createStaff(req.shopId!, body);
    
    res.status(201).json({
      status: 'success',
      data: staff,
    });
  } catch (error) {
    next(error);
  }
};

export const updateStaff = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { params, body } = validators.updateStaffSchema.parse({ 
      params: req.params, 
      body: req.body 
    });

    const staff = await staffService.updateStaff(
      req.shopId!, 
      params.id, 
      body, 
      req.staffRole!
    );
    
    res.status(200).json({
      status: 'success',
      data: staff,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteStaff = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { params } = validators.staffIdParamSchema.parse({ params: req.params });
    await staffService.deleteStaff(req.shopId!, params.id);
    
    res.status(200).json({
      status: 'success',
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

export const getStaffEarnings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { params } = validators.staffIdParamSchema.parse({ params: req.params });
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;

    const earnings = await EarningsService.getWorkerEarnings(req.shopId!, params.id, {
      startDate,
      endDate,
    });

    res.status(200).json({
      status: 'success',
      data: earnings,
    });
  } catch (error) {
    next(error);
  }
};

