import { NextFunction, Response } from 'express';
import { AuthRequest } from '../types';
import * as universityService from '../services/university.service';
import { sendSuccess } from '../utils/response';
import { param } from '../utils/params';

export const create = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await universityService.createUniversity(
      req.body,
      req.file?.path,
      req.user?.userId
    );
    sendSuccess(res, result, 'University created', 201);
  } catch (err) {
    next(err);
  }
};

export const update = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await universityService.updateUniversity(
      param(req, 'id'),
      req.body,
      req.file?.path,
      req.user?.userId
    );
    sendSuccess(res, result, 'University updated');
  } catch (err) {
    next(err);
  }
};

export const remove = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await universityService.deleteUniversity(param(req, 'id'), req.user?.userId);
    sendSuccess(res, result, result.message);
  } catch (err) {
    next(err);
  }
};

export const list = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await universityService.listUniversities(req.query as never);
    sendSuccess(res, result, 'Universities fetched');
  } catch (err) {
    next(err);
  }
};

export const getOne = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await universityService.getUniversity(param(req, 'id'));
    sendSuccess(res, result, 'University fetched');
  } catch (err) {
    next(err);
  }
};

export const assignAdmin = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await universityService.assignAdmin(
      param(req, 'id'),
      req.body,
      req.user?.userId
    );
    sendSuccess(res, result, 'Admin assigned');
  } catch (err) {
    next(err);
  }
};
