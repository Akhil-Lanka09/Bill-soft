import { Router } from 'express';
import { SettingsController } from '../controllers/settingsController';
import { authenticate, adminOnly } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', SettingsController.getSettings);
router.put('/', adminOnly, SettingsController.updateSettings);
router.post('/override-pin/verify', SettingsController.verifyOverridePin);
router.post('/override-pin/change', adminOnly, SettingsController.updateOverridePin);

export default router;
