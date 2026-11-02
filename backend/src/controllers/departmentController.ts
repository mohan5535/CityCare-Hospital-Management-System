import { Request, Response } from 'express';
import { Department } from '../models/Department';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../middlewares/auth';
import { logAudit } from '../utils/auditLogger';

export const getDepartments = async (req: Request, res: Response): Promise<any> => {
  try {
    const departments = await Department.find({ isActive: true }).sort({ name: 1 });
    return sendSuccess(res, departments, 'Departments retrieved successfully');
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to fetch departments', 500);
  }
};

export const createDepartment = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { name, slug, description, icon } = req.body;
    const finalSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    const existing = await Department.findOne({
      $or: [{ name }, { slug: finalSlug }],
    });

    if (existing) {
      return sendError(res, 'Department with this name or slug already exists', 400);
    }

    const dept = await Department.create({
      name,
      slug: finalSlug,
      description,
      icon: icon || 'HeartPulse',
    });

    await logAudit({
      req,
      actorId: req.user?._id.toString(),
      actorEmail: req.user?.email,
      actorRole: req.user?.role || 'ADMIN',
      action: 'DEPARTMENT_CREATED',
      targetResource: 'Department',
      targetId: dept._id.toString(),
      details: { name: dept.name },
    });

    return sendSuccess(res, dept, 'Department created successfully', 201);
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to create department', 500);
  }
};

export const updateDepartment = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const dept = await Department.findByIdAndUpdate(id, req.body, { new: true });
    if (!dept) {
      return sendError(res, 'Department not found', 404);
    }
    return sendSuccess(res, dept, 'Department updated successfully');
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to update department', 500);
  }
};

