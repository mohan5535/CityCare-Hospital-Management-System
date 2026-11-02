import { Router } from 'express';
import { register, login, me, updateMe } from '../controllers/authController';
import { validate } from '../middlewares/validate';
import { registerSchema, loginSchema, updateProfileSchema } from '../validators/authValidators';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.get('/me', authenticate, me);
router.put('/me', authenticate, validate(updateProfileSchema), updateMe);

export default router;

