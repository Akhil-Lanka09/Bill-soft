import { Router } from 'express';
import { ProductController } from '../controllers/productController';
import { authenticate, adminOnly, managerOrAdmin } from '../middleware/auth';

const router = Router();

// Public/POS product routes (authenticated)
router.use(authenticate);

router.get('/search', ProductController.searchProducts);
router.get('/categories', ProductController.getCategories);
router.post('/categories', managerOrAdmin, ProductController.createCategory);
router.get('/inventory-summary', ProductController.getInventorySummary);

router.get('/', ProductController.getProducts);
router.post('/', managerOrAdmin, ProductController.createProduct);

router.get('/:id', ProductController.getProductById);
router.put('/:id', managerOrAdmin, ProductController.updateProduct);
router.delete('/:id', adminOnly, ProductController.archiveProduct);
router.post('/:id/restore', adminOnly, ProductController.restoreProduct);

router.post('/:id/adjust-stock', managerOrAdmin, ProductController.adjustStock);
router.post('/:id/reconcile-stock', managerOrAdmin, ProductController.reconcileStock);
router.get('/:id/stock-history', ProductController.getStockHistory);

export default router;
