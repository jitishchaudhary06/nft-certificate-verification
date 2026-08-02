import { NextFunction, Response } from 'express';
import { AuthRequest } from '../types';
import * as studentService from '../services/student.service';
import { sendSuccess } from '../utils/response';
import { param } from '../utils/params';

export const create = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await studentService.createStudent(req.body, req.user!);
    sendSuccess(res, result, 'Student created', 201);
  } catch (err) {
    next(err);
  }
};

export const update = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await studentService.updateStudent(param(req, 'id'), req.body, req.user!);
    sendSuccess(res, result, 'Student updated');
  } catch (err) {
    next(err);
  }
};

export const remove = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await studentService.deleteStudent(param(req, 'id'), req.user!);
    sendSuccess(res, result, result.message);
  } catch (err) {
    next(err);
  }
};

export const list = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await studentService.listStudents(req.query as never, req.user!);
    sendSuccess(res, result, 'Students fetched');
  } catch (err) {
    next(err);
  }
};

export const getOne = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await studentService.getStudent(param(req, 'id'), req.user!);
    sendSuccess(res, result, 'Student fetched');
  } catch (err) {
    next(err);
  }
};

export const importCsv = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, message: 'CSV file required' });
      return;
    }
    const result = await studentService.importCsv(
      req.file.path,
      req.user!,
      req.body.universityId
    );
    sendSuccess(res, result, 'CSV imported');
  } catch (err) {
    next(err);
  }
};

export const exportCsv = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const csv = await studentService.exportCsv(
      req.user!,
      req.query.universityId as string | undefined
    );
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=students.csv');
    res.send(csv);
  } catch (err) {
    next(err);
  }
};
