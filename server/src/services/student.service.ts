import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';
import fs from 'fs';
import { RoleName } from '@prisma/client';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { getPagination, paginatedMeta } from '../utils/response';
import { logActivity } from './activity.service';
import { JwtPayload } from '../types';

const resolveUniversityId = (actor: JwtPayload, universityId?: string) => {
  if (actor.role === RoleName.SUPER_ADMIN) {
    if (!universityId) throw new AppError('universityId is required', 400);
    return universityId;
  }
  if (!actor.universityId) throw new AppError('No university assigned to your account', 403);
  return actor.universityId;
};

export const createStudent = async (
  data: {
    studentId: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string | null;
    course?: string | null;
    department?: string | null;
    enrollmentYear?: number | null;
    graduationYear?: number | null;
    universityId?: string;
  },
  actor: JwtPayload
) => {
  const universityId = resolveUniversityId(actor, data.universityId);

  const student = await prisma.student.create({
    data: {
      studentId: data.studentId,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email.toLowerCase(),
      phone: data.phone,
      course: data.course,
      department: data.department,
      enrollmentYear: data.enrollmentYear,
      graduationYear: data.graduationYear,
      universityId,
    },
    include: { university: true },
  });

  await logActivity({
    userId: actor.userId,
    action: 'STUDENT_CREATED',
    entity: 'Student',
    entityId: student.id,
  });

  return student;
};

export const updateStudent = async (
  id: string,
  data: Partial<{
    studentId: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    course: string | null;
    department: string | null;
    enrollmentYear: number | null;
    graduationYear: number | null;
    isActive: boolean;
  }>,
  actor: JwtPayload
) => {
  const existing = await prisma.student.findUnique({ where: { id } });
  if (!existing) throw new AppError('Student not found', 404);

  if (
    actor.role === RoleName.UNIVERSITY_ADMIN &&
    existing.universityId !== actor.universityId
  ) {
    throw new AppError('Access denied', 403);
  }

  const student = await prisma.student.update({
    where: { id },
    data: {
      ...data,
      email: data.email ? data.email.toLowerCase() : undefined,
    },
    include: { university: true },
  });

  await logActivity({
    userId: actor.userId,
    action: 'STUDENT_UPDATED',
    entity: 'Student',
    entityId: id,
  });

  return student;
};

export const deleteStudent = async (id: string, actor: JwtPayload) => {
  const existing = await prisma.student.findUnique({ where: { id } });
  if (!existing) throw new AppError('Student not found', 404);

  if (
    actor.role === RoleName.UNIVERSITY_ADMIN &&
    existing.universityId !== actor.universityId
  ) {
    throw new AppError('Access denied', 403);
  }

  await prisma.student.delete({ where: { id } });
  await logActivity({
    userId: actor.userId,
    action: 'STUDENT_DELETED',
    entity: 'Student',
    entityId: id,
  });

  return { message: 'Student deleted' };
};

export const listStudents = async (
  query: { page?: string; limit?: string; search?: string; universityId?: string },
  actor: JwtPayload
) => {
  const { page, limit, skip } = getPagination(query.page, query.limit);

  const universityFilter =
    actor.role === RoleName.SUPER_ADMIN
      ? query.universityId
        ? { universityId: query.universityId }
        : {}
      : { universityId: actor.universityId || undefined };

  const searchFilter = query.search
    ? {
        OR: [
          { firstName: { contains: query.search, mode: 'insensitive' as const } },
          { lastName: { contains: query.search, mode: 'insensitive' as const } },
          { email: { contains: query.search, mode: 'insensitive' as const } },
          { studentId: { contains: query.search, mode: 'insensitive' as const } },
        ],
      }
    : {};

  const where = { ...universityFilter, ...searchFilter };

  const [data, total] = await Promise.all([
    prisma.student.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        university: { select: { id: true, name: true, code: true } },
        _count: { select: { certificates: true } },
      },
    }),
    prisma.student.count({ where }),
  ]);

  return { data, meta: paginatedMeta(total, page, limit) };
};

export const getStudent = async (id: string, actor: JwtPayload) => {
  const student = await prisma.student.findUnique({
    where: { id },
    include: {
      university: true,
      certificates: { orderBy: { createdAt: 'desc' } },
      user: { select: { id: true, email: true, wallet: true } },
    },
  });
  if (!student) throw new AppError('Student not found', 404);

  if (
    actor.role === RoleName.UNIVERSITY_ADMIN &&
    student.universityId !== actor.universityId
  ) {
    throw new AppError('Access denied', 403);
  }

  return student;
};

export const importCsv = async (filePath: string, actor: JwtPayload, universityId?: string) => {
  const uniId = resolveUniversityId(actor, universityId);
  const content = fs.readFileSync(filePath, 'utf-8');
  const records = parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as Array<Record<string, string>>;

  const results = { created: 0, failed: 0, errors: [] as string[] };

  for (const [index, row] of records.entries()) {
    try {
      if (!row.studentId || !row.firstName || !row.lastName || !row.email) {
        throw new Error('Missing required fields');
      }
      await prisma.student.create({
        data: {
          studentId: row.studentId,
          firstName: row.firstName,
          lastName: row.lastName,
          email: row.email.toLowerCase(),
          phone: row.phone || null,
          course: row.course || null,
          department: row.department || null,
          enrollmentYear: row.enrollmentYear ? parseInt(row.enrollmentYear, 10) : null,
          graduationYear: row.graduationYear ? parseInt(row.graduationYear, 10) : null,
          universityId: uniId,
        },
      });
      results.created++;
    } catch (err) {
      results.failed++;
      results.errors.push(`Row ${index + 2}: ${(err as Error).message}`);
    }
  }

  await logActivity({
    userId: actor.userId,
    action: 'STUDENTS_IMPORTED',
    entity: 'Student',
    details: results,
  });

  return results;
};

export const exportCsv = async (actor: JwtPayload, universityId?: string) => {
  const where =
    actor.role === RoleName.SUPER_ADMIN
      ? universityId
        ? { universityId }
        : {}
      : { universityId: actor.universityId || undefined };

  const students = await prisma.student.findMany({
    where,
    include: { university: true },
    orderBy: { createdAt: 'desc' },
  });

  return stringify(
    students.map((s) => ({
      studentId: s.studentId,
      firstName: s.firstName,
      lastName: s.lastName,
      email: s.email,
      phone: s.phone || '',
      course: s.course || '',
      department: s.department || '',
      enrollmentYear: s.enrollmentYear || '',
      graduationYear: s.graduationYear || '',
      university: s.university.name,
      universityCode: s.university.code,
    })),
    { header: true }
  );
};
