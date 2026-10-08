import { Router } from 'express';
import { ReportController } from '../controllers/reportController';
import { authenticate, managerOrAdmin } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/dashboard', ReportController.getDashboard);
router.get('/sales', managerOrAdmin, ReportController.getSalesReport);
router.get('/gstr1', managerOrAdmin, ReportController.getGSTR1);
router.get('/inventory-valuation', managerOrAdmin, ReportController.getInventoryValuation);
router.get('/daily-closing', ReportController.getDailyClosing);
router.post('/daily-closing', ReportController.submitDailyClosing);

// Expenses
router.get('/expenses', ReportController.getExpenses);
router.post('/expenses', ReportController.createExpense);

export default router;
