import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError.js';
import { StaffRole } from '../types/rawnaq.types.js';

export const authorizeRole = (...allowedRoles: StaffRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // SuperAdmin bypasses this if we want, but this is tenant routes so req.staffRole is checked
    if (!req.staffRole) {
      return next(new AppError(403, 'Forbidden: Role not assigned'));
    }

    if (!allowedRoles.includes(req.staffRole)) {
      return next(new AppError(403, `Forbidden: Requires one of [${allowedRoles.join(', ')}] role`));
    }

    next();
  };
};
