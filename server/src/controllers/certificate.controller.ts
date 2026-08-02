import { NextFunction, Response } from 'express';
import { AuthRequest } from '../types';
import * as certificateService from '../services/certificate.service';
import { sendSuccess } from '../utils/response';
import { param } from '../utils/params';

export const create = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await certificateService.createCertificate(
      req.body,
      req.user!,
      req.file?.path
    );
    sendSuccess(res, result, 'Certificate created', 201);
  } catch (err) {
    next(err);
  }
};

export const list = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await certificateService.listCertificates(req.query as never, req.user!);
    sendSuccess(res, result, 'Certificates fetched');
  } catch (err) {
    next(err);
  }
};

export const getOne = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await certificateService.getCertificate(param(req, 'id'), req.user);
    sendSuccess(res, result, 'Certificate fetched');
  } catch (err) {
    next(err);
  }
};

export const remove = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await certificateService.deleteCertificate(param(req, 'id'), req.user!);
    sendSuccess(res, result, result.message);
  } catch (err) {
    next(err);
  }
};

export const regeneratePdf = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await certificateService.regeneratePdf(param(req, 'id'), req.user!);
    sendSuccess(res, result, 'PDF generated');
  } catch (err) {
    next(err);
  }
};

export const uploadIpfs = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await certificateService.uploadToIpfs(param(req, 'id'), req.user!);
    sendSuccess(res, result, 'Uploaded to IPFS');
  } catch (err) {
    next(err);
  }
};

export const mint = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await certificateService.mintCertificate(
      req.body.certificateId,
      req.body.walletAddress,
      req.user!
    );
    sendSuccess(res, result, 'NFT minted successfully');
  } catch (err) {
    next(err);
  }
};

export const revoke = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await certificateService.revokeCertificate(
      param(req, 'id'),
      req.body.reason,
      req.user!
    );
    sendSuccess(res, result, 'Certificate revoked');
  } catch (err) {
    next(err);
  }
};

export const emailCert = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await certificateService.emailCertificate(param(req, 'id'), req.user!);
    sendSuccess(res, result, result.message);
  } catch (err) {
    next(err);
  }
};
