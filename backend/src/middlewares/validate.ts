import { Request, Response, NextFunction } from 'express';
import { ZodTypeAny, ZodError } from 'zod';
import { sendError } from '../utils/response';

export const validate = (schema: ZodTypeAny) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error: any) {
      if (error instanceof ZodError || error?.name === 'ZodError') {
        const issues = (error as any).issues || (error as any).errors || [];
        const errors = issues.map((err: any) => ({
          field: Array.isArray(err.path) ? err.path.join('.') : '',
          message: err.message,
        }));
        return sendError(res, 'Validation failed', 400, errors);
      }
      return sendError(res, 'Internal validation error', 500);
    }
  };
};
