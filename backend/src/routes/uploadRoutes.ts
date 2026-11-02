import { Router } from 'express';
import { uploadFile } from '../controllers/uploadController';
import { authenticate } from '../middlewares/auth';

const router = Router();

// Authenticated upload endpoint for profile photos, degrees, license certs
router.post('/', authenticate, uploadFile);

export default router;

