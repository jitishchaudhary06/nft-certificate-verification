import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { getPagination, paginatedMeta } from '../utils/response';
import { logActivity } from './activity.service';
import { AuthProvider, RoleName } from '@prisma/client';
import { hashPassword, generateToken } from '../utils/crypto';
import { emailTemplates } from './email.service';
import { enqueueEmail } from '../jobs/email.queue';
import { env } from '../config/env';
import path from 'path';

export const createUniversity = async (
  data: {
    name: string;
    code: string;
    email?: string | null;
    website?: string | null;
    address?: string | null;
  },
  logoPath?: string,
  actorId?: string
) => {
  const university = await prisma.university.create({
    data: {
      name: data.name,
      code: data.code.toUpperCase(),
      email: data.email,
      website: data.website,
      address: data.address,
      logoUrl: logoPath ? `/uploads/logos/${path.basename(logoPath)}` : null,
    },
  });

  await logActivity({
    userId: actorId,
    action: 'UNIVERSITY_CREATED',
    entity: 'University',
    entityId: university.id,
  });

  return university;
};

export const updateUniversity = async (
  id: string,
  data: Partial<{
    name: string;
    code: string;
    email: string | null;
    website: string | null;
    address: string | null;
    isActive: boolean;
  }>,
  logoPath?: string,
  actorId?: string
) => {
  const existing = await prisma.university.findUnique({ where: { id } });
  if (!existing) throw new AppError('University not found', 404);

  const university = await prisma.university.update({
    where: { id },
    data: {
      ...data,
      code: data.code ? data.code.toUpperCase() : undefined,
      logoUrl: logoPath ? `/uploads/logos/${path.basename(logoPath)}` : undefined,
    },
  });

  await logActivity({
    userId: actorId,
    action: 'UNIVERSITY_UPDATED',
    entity: 'University',
    entityId: id,
  });

  return university;
};

export const deleteUniversity = async (id: string, actorId?: string) => {
  const existing = await prisma.university.findUnique({ where: { id } });
  if (!existing) throw new AppError('University not found', 404);

  await prisma.university.delete({ where: { id } });
  await logActivity({
    userId: actorId,
    action: 'UNIVERSITY_DELETED',
    entity: 'University',
    entityId: id,
  });

  return { message: 'University deleted' };
};

export const listUniversities = async (query: {
  page?: string;
  limit?: string;
  search?: string;
}) => {
  const { page, limit, skip } = getPagination(query.page, query.limit);
  const where = query.search
    ? {
        OR: [
          { name: { contains: query.search, mode: 'insensitive' as const } },
          { code: { contains: query.search, mode: 'insensitive' as const } },
        ],
      }
    : {};

  const [data, total] = await Promise.all([
    prisma.university.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { students: true, certificates: true, admins: true } },
      },
    }),
    prisma.university.count({ where }),
  ]);

  return { data, meta: paginatedMeta(total, page, limit) };
};

export const getUniversity = async (id: string) => {
  const university = await prisma.university.findUnique({
    where: { id },
    include: {
      admins: { select: { id: true, name: true, email: true } },
      _count: { select: { students: true, certificates: true } },
    },
  });
  if (!university) throw new AppError('University not found', 404);
  return university;
};

export const assignAdmin = async (
  universityId: string,
  data: { email: string; name: string; password?: string },
  actorId?: string
) => {
  const university = await prisma.university.findUnique({ where: { id: universityId } });
  if (!university) throw new AppError('University not found', 404);

  const role = await prisma.role.findUniqueOrThrow({ where: { name: RoleName.UNIVERSITY_ADMIN } });
  let user = await prisma.user.findUnique({ where: { email: data.email.toLowerCase() } });

  if (user) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        roleId: role.id,
        universityId,
        name: data.name,
      },
    });
  } else {
    const password = data.password || generateToken().slice(0, 12) + 'Aa1!';
    const emailVerifyToken = generateToken();
    user = await prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        name: data.name,
        passwordHash: await hashPassword(password),
        provider: AuthProvider.EMAIL,
        roleId: role.id,
        universityId,
        emailVerifyToken,
      },
    });

    const verifyLink = `${env.clientUrl}/verify-email?token=${emailVerifyToken}`;
    const template = emailTemplates.verifyEmail(user.name, verifyLink);
    await enqueueEmail({
      to: user.email,
      subject: `You are now admin of ${university.name}`,
      html: `${template.html}<p>Temporary password: <strong>${password}</strong></p>`,
    });
  }

  await logActivity({
    userId: actorId,
    action: 'UNIVERSITY_ADMIN_ASSIGNED',
    entity: 'University',
    entityId: universityId,
    details: { adminId: user.id },
  });

  return user;
};
