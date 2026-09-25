import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { errorHandler } from './middleware/errorHandler.js';
import healthRoutes from './modules/health/health.routes.js';
import shopRoutes from './modules/shop/shop.routes.js';
import adminAuthRoutes from './modules/adminAuth/adminAuth.routes.js';
import { requireSuperAdmin } from './middleware/requireSuperAdmin.middleware.js';
import tenantAuthRoutes from './modules/tenantAuth/tenantAuth.routes.js';
import tenantRoutes from './modules/tenant/tenant.routes.js';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use('/api', healthRoutes); // Use /api/health

// Unprotected Admin Auth Routes
app.use('/api/admin/auth', adminAuthRoutes);

// Protected Admin Routes
app.use('/api/admin', requireSuperAdmin);
app.use('/api/admin/shops', shopRoutes);

// Tenant Auth
app.use('/api/tenant/auth', tenantAuthRoutes);

// Protected Tenant Routes
app.use('/api/tenant', tenantRoutes);

// Global Error Handler
app.use(errorHandler);

export default app;
