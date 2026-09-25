import { Request, Response, NextFunction } from 'express';
import { superAdminLoginSchema } from './adminAuth.validators.js';
import * as adminAuthService from './adminAuth.service.js';

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { body } = superAdminLoginSchema.parse({ body: req.body });
    
    const token = await adminAuthService.loginSuperAdmin(body.email, body.password);
    
    res.status(200).json({
      status: 'success',
      data: {
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};
