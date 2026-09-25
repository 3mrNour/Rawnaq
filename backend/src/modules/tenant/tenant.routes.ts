import { Router } from 'express';
import { requireTenantAuth } from '../../middleware/requireTenantAuth.middleware.js';
import { checkSubscription } from '../../middleware/checkSubscription.middleware.js';
import staffRoutes from '../staff/staff.routes.js';
import priceListRoutes from '../priceList/priceList.routes.js';
import orderRoutes from '../order/order.routes.js';
import assignmentRoutes from '../assignment/assignment.routes.js';
import { getShopMe, updateShopMe } from './tenant.shop.controller.js';
import { authorizeRole } from '../../middleware/authorizeRole.middleware.js';

const router = Router();

// Apply auth and subscription middlewares to all tenant routes
router.use(requireTenantAuth);
router.use(checkSubscription);

// Place tenant-specific route modules here
router.use('/staff', staffRoutes);
router.use('/price-list', priceListRoutes);
router.use('/orders', orderRoutes);
router.use('/assignments', assignmentRoutes);

// Shop self-management
router.get('/shop/me', getShopMe);
router.patch('/shop/me', authorizeRole('owner'), updateShopMe);

// Mock route for testing data isolation
router.get('/test-isolation', (req, res) => {
  res.status(200).json({
    status: 'success',
    data: {
      shopId: req.shopId,
      staffId: req.staffId,
      staffRole: req.staffRole,
    }
  });
});

export default router;
