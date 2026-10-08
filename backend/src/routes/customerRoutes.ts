import { Router } from 'express';
import { CustomerController } from '../controllers/customerController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', CustomerController.getCustomers);
router.post('/', CustomerController.createCustomer);
router.get('/:id', CustomerController.getCustomerById);
router.put('/:id', CustomerController.updateCustomer);
router.get('/:id/ledger', CustomerController.getCustomerLedger);
router.post('/:id/payments', CustomerController.recordPayment);

export default router;
