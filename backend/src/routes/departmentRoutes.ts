import { Router } from 'express';
import { getDepartments, createDepartment, updateDepartment } from '../controllers/departmentController';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();

router.get('/', getDepartments);
router.post('/', authenticate, authorize('SUPER_ADMIN', 'HOSPITAL_ADMIN'), createDepartment);
router.put('/:id', authenticate, authorize('SUPER_ADMIN', 'HOSPITAL_ADMIN'), updateDepartment);

export default router;

