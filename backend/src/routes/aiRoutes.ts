import { Router } from 'express';
import { triageSymptoms } from '../controllers/aiController';

const router = Router();

router.post('/triage', triageSymptoms);

export default router;

