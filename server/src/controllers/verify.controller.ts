import { NextFunction, Response } from 'express';
import { AuthRequest } from '../types';
import * as verifyService from '../services/verify.service';
import { sendSuccess } from '../utils/response';
import { param } from '../utils/params';

export const verifyToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await verifyService.verifyByTokenId(param(req, 'token'));
    sendSuccess(res, result, 'Verification result');
  } catch (err) {
    next(err);
  }
};

export const verifyCertificate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await verifyService.verifyByCertificateId(param(req, 'id'));
    sendSuccess(res, result, 'Verification result');
  } catch (err) {
    next(err);
  }
};

export const search = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await verifyService.employerSearch(req.query as never);
    sendSuccess(res, result, 'Search results');
  } catch (err) {
    next(err);
  }
};

export const studentNfts = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await verifyService.getStudentNfts(req.user!.userId);
    sendSuccess(res, result, 'NFTs fetched');
  } catch (err) {
    next(err);
  }
};

export const dashboard = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await verifyService.getDashboardStats({
      role: req.user!.role,
      universityId: req.user!.universityId,
    });
    sendSuccess(res, result, 'Dashboard stats');
  } catch (err) {
    next(err);
  }
};
