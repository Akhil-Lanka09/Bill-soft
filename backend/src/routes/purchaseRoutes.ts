import { Router } from 'express';
import { PurchaseController } from '../controllers/purchaseController';
import { authenticate, managerOrAdmin } from '../middleware/auth';

const router = Router();

router.use(authenticate);

// Suppliers
router.get('/suppliers', PurchaseController.getSuppliers);
router.post('/suppliers', managerOrAdmin, PurchaseController.createSupplier);
router.put('/suppliers/:id', managerOrAdmin, PurchaseController.updateSupplier);

// Purchases
router.get('/', PurchaseController.getPurchases);
router.post('/', managerOrAdmin, PurchaseController.createPurchase);
router.get('/:id', PurchaseController.getPurchaseById);

export default router;
