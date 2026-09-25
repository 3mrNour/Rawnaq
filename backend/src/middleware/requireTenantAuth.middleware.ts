import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from '../utils/AppError.js';
import { StaffRole } from '../types/rawnaq.types.js';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      staffId?: string;
      shopId?: string;
      staffRole?: StaffRole;
    }
  }
}

interface TenantJwtPayload {
  sub: string;
  shopId: string;
  role: StaffRole;
}

export const requireTenantAuth = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError(401, 'Unauthorized: Missing or malformed token');
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET;
    
    if (!secret) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }

    let decoded: TenantJwtPayload;
    try {
      decoded = jwt.verify(token, secret) as TenantJwtPayload;
    } catch (err) {
      throw new AppError(401, 'Unauthorized: Invalid or expired token');
    }

    if (!decoded.shopId || !decoded.role) {
      throw new AppError(401, 'Unauthorized: Invalid token payload');
    }

    // Attach verified claims to the request
    req.staffId = decoded.sub;
    req.shopId = decoded.shopId;
    req.staffRole = decoded.role;

    next();
  } catch (error) {
    next(error);
  }
};
