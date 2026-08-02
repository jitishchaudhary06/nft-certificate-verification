import { NextFunction, Response } from 'express';
import { AuthRequest } from '../types';
import * as featuresService from '../services/features.service';
import { sendSuccess } from '../utils/response';
import { param } from '../utils/params';

export const submitApproval = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await featuresService.submitForApproval(param(req, 'id'), req.user!);
    sendSuccess(res, result, 'Submitted for approval');
  } catch (err) {
    next(err);
  }
};

export const approve = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await featuresService.approveCertificate(param(req, 'id'), req.user!);
    sendSuccess(res, result, 'Certificate approved');
  } catch (err) {
    next(err);
  }
};

export const reject = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await featuresService.rejectCertificate(
      param(req, 'id'),
      req.body.reason,
      req.user!
    );
    sendSuccess(res, result, 'Certificate rejected');
  } catch (err) {
    next(err);
  }
};

export const renew = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await featuresService.renewCertificate(
      param(req, 'id'),
      new Date(req.body.expiresAt),
      req.user!
    );
    sendSuccess(res, result, 'Certificate renewed');
  } catch (err) {
    next(err);
  }
};

export const bulkMint = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await featuresService.bulkMint(req.body.items, req.user!);
    sendSuccess(res, result, 'Bulk mint completed');
  } catch (err) {
    next(err);
  }
};

export const analytics = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await featuresService.getAnalytics({
      role: req.user!.role,
      universityId: req.user!.universityId,
    });
    sendSuccess(res, result, 'Analytics fetched');
  } catch (err) {
    next(err);
  }
};

export const activityLogs = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await featuresService.listActivityLogs(req.query as never, req.user!);
    sendSuccess(res, result, 'Activity logs fetched');
  } catch (err) {
    next(err);
  }
};

export const portfolio = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await featuresService.getPublicPortfolio(param(req, 'studentId'));
    sendSuccess(res, result, 'Portfolio fetched');
  } catch (err) {
    next(err);
  }
};

export const applyTemplate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await featuresService.regenerateWithTemplate(
      param(req, 'id'),
      req.body.template,
      req.user!
    );
    sendSuccess(res, result, 'Template applied');
  } catch (err) {
    next(err);
  }
};

export const networkInfo = async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { env } = await import('../config/env');
    sendSuccess(
      res,
      {
        chainId: env.blockchain.chainId,
        rpcUrl: env.blockchain.rpcUrl,
        explorerUrl: env.blockchain.explorerUrl,
        contractAddress: env.blockchain.contractAddress || null,
        networks: [
          { id: 80002, name: 'Polygon Amoy', explorer: 'https://amoy.polygonscan.com' },
          { id: 137, name: 'Polygon Mainnet', explorer: 'https://polygonscan.com' },
        ],
      },
      'Network config'
    );
  } catch (err) {
    next(err);
  }
};
