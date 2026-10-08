import { Router } from 'express';
import { BillingController } from '../controllers/billingController';
import { authenticate, managerOrAdmin } from '../middleware/auth';

const router = Router();

router.use(authenticate);

// Cart & Calculation
router.post('/calculate', BillingController.calculateSummary);

// Held Bills (Park cart)
router.post('/hold', BillingController.holdBill);
router.get('/held', BillingController.getHeldBills);
router.delete('/held/:id', BillingController.deleteHeldBill);

// Bills CRUD
router.post('/', BillingController.createBill);
router.get('/', BillingController.getBills);
router.get('/:id', BillingController.getBillById);
router.get('/:id/receipt', BillingController.getThermalReceipt);

// Cancellations & Returns
router.post('/:id/cancel', managerOrAdmin, BillingController.cancelBill);
router.post('/:id/return', BillingController.processReturn);

export default router;
