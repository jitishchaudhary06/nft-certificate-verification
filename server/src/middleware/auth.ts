import { NextFunction, Response } from 'express';
import { RoleName } from '@prisma/client';
import { AuthRequest } from '../types';
import { verifyAccessToken } from '../utils/crypto';
import { sendError } from '../utils/response';

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction): void => {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      sendError(res, 'Authentication required', 401);
      return;
    }
    const token = header.split(' ')[1];
    req.user = verifyAccessToken(token);
    next();
  } catch {
    sendError(res, 'Invalid or expired token', 401);
  }
};

export const authorize =
  (...roles: RoleName[]) =>
  (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }
    if (!roles.includes(req.user.role)) {
      sendError(res, 'Insufficient permissions', 403);
      return;
    }
    next();
  };

export const optionalAuth = (req: AuthRequest, _res: Response, next: NextFunction): void => {
  try {
    const header = req.headers.authorization;
    if (header?.startsWith('Bearer ')) {
      req.user = verifyAccessToken(header.split(' ')[1]);
    }
  } catch {
    // ignore invalid optional tokens
  }
  next();
};
