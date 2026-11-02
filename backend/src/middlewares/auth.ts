import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { User, IUser, UserRole } from '../models/User';
import { sendError } from '../utils/response';

export interface AuthRequest extends Request {
  user?: IUser;
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    let token: string | undefined;

    if (req.headers.authorization) {
      const authHeader = req.headers.authorization.trim();
      // Case-insensitive strip of Bearer prefix (even if repeated)
      token = authHeader.replace(/^Bearer\s+/i, '').replace(/^Bearer\s+/i, '').trim();
    }

    if (!token || token === 'null' || token === 'undefined' || token.trim() === '') {
      return sendError(res, 'Authentication required. No token provided.', 401);
    }

    if (token.startsWith('"') && token.endsWith('"')) {
      token = token.slice(1, -1).trim();
    }

    const decoded = jwt.verify(token, config.JWT_SECRET) as {
      id: string;
      email?: string;
      role: UserRole;
    };

    let user = await User.findById(decoded.id);
    if (!user && decoded.email) {
      // Resilience against database reseeds while token remains active
      user = await User.findOne({ email: decoded.email.toLowerCase() });
    }

    if (!user) {
      return sendError(res, 'User belonging to this token no longer exists.', 401);
    }

    if (user.status === 'SUSPENDED') {
      return sendError(res, 'Your account has been suspended. Please contact administration.', 403);
    }

    req.user = user;
    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      return sendError(res, 'Authentication token has expired. Please log in again.', 401);
    }
    return sendError(res, 'Invalid authentication token.', 401);
  }
};

export const authorize = (...roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): any => {
    if (!req.user) {
      return sendError(res, 'Authentication required.', 401);
    }

    if (!roles.includes(req.user.role)) {
      return sendError(
        res,
        `Access denied. Required role: [${roles.join(', ')}]. Your role: ${req.user.role}`,
        403
      );
    }

    next();
  };
};

