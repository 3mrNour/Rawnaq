import { Request, Response, NextFunction } from 'express';
import { loginTenant } from './tenantAuth.service.js';
import { loginSchema } from './tenantAuth.validators.js';

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { body } = loginSchema.parse({ body: req.body });
    
    const { token, shop, staff } = await loginTenant(
      body.shopLicenseKeyOrSlug,
      body.email,
      body.password,
      body.deviceFingerprint
    );

    res.status(200).json({
      status: 'success',
      data: {
        token,
        shop: {
          id: shop._id,
          name: shop.name,
          licenseKey: shop.licenseKey,
          subscriptionStatus: shop.subscriptionStatus,
        },
        staff: {
          id: staff._id,
          name: staff.name,
          email: staff.email,
          role: staff.role,
        }
      }
    });
  } catch (error) {
    next(error);
  }
};
