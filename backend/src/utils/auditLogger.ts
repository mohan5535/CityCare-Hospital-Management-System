import { Request } from 'express';
import { AuditLog } from '../models/AuditLog';

export interface AuditParams {
  req?: Request;
  actorId?: string;
  actorRole: string;
  actorEmail?: string;
  action: string;
  targetResource: string;
  targetId?: string;
  details?: any;
}

export const logAudit = async (params: AuditParams): Promise<void> => {
  try {
    const ip =
      params.req?.headers['x-forwarded-for']?.toString() ||
      params.req?.socket?.remoteAddress ||
      'internal';
    const userAgent = params.req?.headers['user-agent'] || 'system';

    await AuditLog.create({
      actor: params.actorId,
      actorEmail: params.actorEmail,
      actorRole: params.actorRole,
      action: params.action,
      targetResource: params.targetResource,
      targetId: params.targetId,
      ipAddress: ip,
      userAgent: userAgent,
      details: params.details,
    });
  } catch (error) {
    // Non-blocking for primary transaction, but logged
    console.error('[AuditLog Error] Failed to write audit entry:', error);
  }
};

