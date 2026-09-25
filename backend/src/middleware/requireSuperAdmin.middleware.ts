import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from '../utils/AppError.js';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      superAdminId?: string;
    }
  }
}

interface JwtPayload {
  sub: string;
  role: string;
}

export const requireSuperAdmin = (req: Request, res: Response, next: NextFunction) => {
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

    let decoded: JwtPayload;
    try {
      decoded = jwt.verify(token, secret) as JwtPayload;
    } catch (err) {
      throw new AppError(401, 'Unauthorized: Invalid or expired token');
    }

    if (decoded.role !== 'superadmin') {
      return res.status(403).json({
        code: 'FORBIDDEN_ROLE',
        message: 'Forbidden: SuperAdmin role required',
      });
    }

    req.superAdminId = decoded.sub;
    next();
  } catch (error) {
    next(error);
  }
};
