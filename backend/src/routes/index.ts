import { Router } from 'express';
import authRoutes from './authRoutes';
import productRoutes from './productRoutes';
import billingRoutes from './billingRoutes';
import customerRoutes from './customerRoutes';
import purchaseRoutes from './purchaseRoutes';
import reportRoutes from './reportRoutes';
import settingsRoutes from './settingsRoutes';
import userRoutes from './userRoutes';

const router = Router();

router.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'BN Reddy Nursery POS Backend', timestamp: new Date() });
});

router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/bills', billingRoutes);
router.use('/customers', customerRoutes);
router.use('/purchases', purchaseRoutes);
router.use('/reports', reportRoutes);
router.use('/settings', settingsRoutes);
router.use('/users', userRoutes);

export default router;
