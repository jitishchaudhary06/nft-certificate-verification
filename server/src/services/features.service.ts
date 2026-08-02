import {
  ApprovalStatus,
  CertificateStatus,
  CertificateTemplate,
  RoleName,
  TransactionStatus,
  TransactionType,
} from '@prisma/client';
import path from 'path';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { JwtPayload } from '../types';
import { logActivity } from './activity.service';
import { getPagination, paginatedMeta } from '../utils/response';
import { mintCertificate } from './certificate.service';
import { generateCertificatePdf, generateQrCode } from './pdf.service';
import { emailTemplates } from './email.service';
import { enqueueEmail } from '../jobs/email.queue';
import { env } from '../config/env';
import { UPLOADS_ROOT } from '../middleware/upload';

const assertAccess = (actor: JwtPayload, universityId: string) => {
  if (actor.role === RoleName.SUPER_ADMIN) return;
  if (actor.role === RoleName.UNIVERSITY_ADMIN && actor.universityId === universityId) return;
  throw new AppError('Access denied', 403);
};

export const submitForApproval = async (id: string, actor: JwtPayload) => {
  const certificate = await prisma.certificate.findUnique({ where: { id } });
  if (!certificate) throw new AppError('Certificate not found', 404);
  assertAccess(actor, certificate.universityId);

  if (certificate.status === CertificateStatus.MINTED) {
    throw new AppError('Already minted certificates cannot be submitted for approval', 400);
  }

  const updated = await prisma.certificate.update({
    where: { id },
    data: {
      approvalStatus: ApprovalStatus.PENDING,
      status: CertificateStatus.PENDING_APPROVAL,
      rejectionReason: null,
    },
    include: { student: true, university: true },
  });

  await logActivity({
    userId: actor.userId,
    action: 'CERTIFICATE_SUBMITTED_FOR_APPROVAL',
    entity: 'Certificate',
    entityId: id,
  });

  return updated;
};

export const approveCertificate = async (id: string, actor: JwtPayload) => {
  const certificate = await prisma.certificate.findUnique({ where: { id } });
  if (!certificate) throw new AppError('Certificate not found', 404);
  assertAccess(actor, certificate.universityId);

  const updated = await prisma.certificate.update({
    where: { id },
    data: {
      approvalStatus: ApprovalStatus.APPROVED,
      approvedAt: new Date(),
      approvedById: actor.userId,
      status:
        certificate.status === CertificateStatus.PENDING_APPROVAL
          ? CertificateStatus.GENERATED
          : certificate.status,
      rejectionReason: null,
    },
    include: { student: true, university: true },
  });

  await logActivity({
    userId: actor.userId,
    action: 'CERTIFICATE_APPROVED',
    entity: 'Certificate',
    entityId: id,
  });

  return updated;
};

export const rejectCertificate = async (id: string, reason: string, actor: JwtPayload) => {
  const certificate = await prisma.certificate.findUnique({ where: { id } });
  if (!certificate) throw new AppError('Certificate not found', 404);
  assertAccess(actor, certificate.universityId);

  const updated = await prisma.certificate.update({
    where: { id },
    data: {
      approvalStatus: ApprovalStatus.REJECTED,
      rejectionReason: reason,
      status: CertificateStatus.PENDING_APPROVAL,
    },
    include: { student: true, university: true },
  });

  await logActivity({
    userId: actor.userId,
    action: 'CERTIFICATE_REJECTED',
    entity: 'Certificate',
    entityId: id,
    details: { reason },
  });

  return updated;
};

export const renewCertificate = async (
  id: string,
  expiresAt: Date,
  actor: JwtPayload
) => {
  const certificate = await prisma.certificate.findUnique({
    where: { id },
    include: { student: true, university: true },
  });
  if (!certificate) throw new AppError('Certificate not found', 404);
  assertAccess(actor, certificate.universityId);

  const updated = await prisma.certificate.update({
    where: { id },
    data: {
      expiresAt,
      status:
        certificate.status === CertificateStatus.EXPIRED
          ? certificate.tokenId
            ? CertificateStatus.MINTED
            : CertificateStatus.GENERATED
          : certificate.status,
    },
    include: { student: true, university: true },
  });

  await prisma.transaction.create({
    data: {
      txHash: `renew-${id}-${Date.now()}`,
      type: TransactionType.RENEW,
      status: TransactionStatus.CONFIRMED,
      certificateId: id,
      metadata: { expiresAt: expiresAt.toISOString() },
    },
  });

  await logActivity({
    userId: actor.userId,
    action: 'CERTIFICATE_RENEWED',
    entity: 'Certificate',
    entityId: id,
    details: { expiresAt: expiresAt.toISOString() },
  });

  return updated;
};

export const bulkMint = async (
  items: Array<{ certificateId: string; walletAddress: string }>,
  actor: JwtPayload
) => {
  const results: Array<{ certificateId: string; success: boolean; error?: string; data?: unknown }> =
    [];

  for (const item of items) {
    try {
      const data = await mintCertificate(item.certificateId, item.walletAddress, actor);
      results.push({ certificateId: item.certificateId, success: true, data });
    } catch (err) {
      results.push({
        certificateId: item.certificateId,
        success: false,
        error: err instanceof Error ? err.message : 'Mint failed',
      });
    }
  }

  await logActivity({
    userId: actor.userId,
    action: 'CERTIFICATES_BULK_MINTED',
    entity: 'Certificate',
    details: {
      total: items.length,
      succeeded: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
    },
  });

  return {
    total: items.length,
    succeeded: results.filter((r) => r.success).length,
    failed: results.filter((r) => !r.success).length,
    results,
  };
};

export const getAnalytics = async (actor: {
  role: RoleName;
  universityId?: string | null;
}) => {
  const universityFilter =
    actor.role === RoleName.UNIVERSITY_ADMIN && actor.universityId
      ? { universityId: actor.universityId }
      : {};

  await markExpiredCertificates();

  const [byStatus, pendingApprovals, expiringSoon, mintedLast30, issuedLast30] =
    await Promise.all([
      prisma.certificate.groupBy({
        by: ['status'],
        where: universityFilter,
        _count: { _all: true },
      }),
      prisma.certificate.count({
        where: { ...universityFilter, approvalStatus: ApprovalStatus.PENDING },
      }),
      prisma.certificate.count({
        where: {
          ...universityFilter,
          expiresAt: {
            gte: new Date(),
            lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      prisma.certificate.count({
        where: {
          ...universityFilter,
          status: CertificateStatus.MINTED,
          updatedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
      }),
      prisma.certificate.count({
        where: {
          ...universityFilter,
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
      }),
    ]);

  const networkName = env.blockchain.chainId === 137 ? 'Polygon Mainnet' : 'Polygon Amoy';

  return {
    byStatus: byStatus.map((row) => ({ status: row.status, count: row._count._all })),
    pendingApprovals,
    expiringSoon,
    mintedLast30,
    issuedLast30,
    network: {
      chainId: env.blockchain.chainId,
      name: networkName,
      explorerUrl: env.blockchain.explorerUrl,
      rpcUrl: env.blockchain.rpcUrl,
      contractAddress: env.blockchain.contractAddress || null,
      switchHint:
        'Set CHAIN_ID=137, POLYGON_AMOY_RPC_URL to a Polygon RPC, BLOCK_EXPLORER_URL, and CERTIFICATE_NFT_ADDRESS for mainnet.',
    },
  };
};

export const listActivityLogs = async (
  query: { page?: string; limit?: string; search?: string },
  actor: JwtPayload
) => {
  if (actor.role !== RoleName.SUPER_ADMIN && actor.role !== RoleName.UNIVERSITY_ADMIN) {
    throw new AppError('Access denied', 403);
  }

  const { page, limit, skip } = getPagination(query.page, query.limit);
  const where = query.search
    ? {
        OR: [
          { action: { contains: query.search, mode: 'insensitive' as const } },
          { entity: { contains: query.search, mode: 'insensitive' as const } },
        ],
      }
    : {};

  const [data, total] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { id: true, name: true, email: true, role: true } } },
    }),
    prisma.activityLog.count({ where }),
  ]);

  return { data, meta: paginatedMeta(total, page, limit) };
};

export const getPublicPortfolio = async (studentId: string) => {
  const student = await prisma.student.findFirst({
    where: {
      OR: [{ id: studentId }, { studentId }],
    },
    include: {
      university: { select: { name: true, code: true, logoUrl: true } },
      certificates: {
        where: {
          OR: [
            { status: CertificateStatus.MINTED },
            { status: CertificateStatus.GENERATED },
            { status: CertificateStatus.UPLOADED_IPFS },
          ],
          isRevoked: false,
        },
        orderBy: { issueDate: 'desc' },
        include: { university: { select: { name: true } } },
      },
    },
  });

  if (!student) throw new AppError('Student portfolio not found', 404);

  return {
    student: {
      id: student.id,
      studentId: student.studentId,
      name: `${student.firstName} ${student.lastName}`,
      course: student.course,
      department: student.department,
      university: student.university,
    },
    certificates: student.certificates.map((c) => ({
      id: c.id,
      title: c.title,
      course: c.course,
      grade: c.grade,
      status: c.status,
      tokenId: c.tokenId,
      issueDate: c.issueDate,
      expiresAt: c.expiresAt,
      verifyUrl: c.tokenId
        ? `${env.clientUrl}/verify/${c.tokenId}`
        : `${env.clientUrl}/verify/certificate/${c.id}`,
      pdfUrl: c.pdfUrl,
      university: c.university.name,
    })),
  };
};

export const markExpiredCertificates = async () => {
  const result = await prisma.certificate.updateMany({
    where: {
      expiresAt: { lt: new Date() },
      status: { in: [CertificateStatus.MINTED, CertificateStatus.GENERATED, CertificateStatus.UPLOADED_IPFS] },
      isRevoked: false,
    },
    data: { status: CertificateStatus.EXPIRED },
  });
  return { expired: result.count };
};

export const regenerateWithTemplate = async (
  id: string,
  template: CertificateTemplate,
  actor: JwtPayload
) => {
  const certificate = await prisma.certificate.findUnique({
    where: { id },
    include: { student: true, university: true },
  });
  if (!certificate) throw new AppError('Certificate not found', 404);
  assertAccess(actor, certificate.universityId);

  const qr = await generateQrCode(certificate.id, certificate.tokenId);
  const logoAbs = certificate.university.logoUrl
    ? path.join(UPLOADS_ROOT, certificate.university.logoUrl.replace('/uploads/', ''))
    : null;

  const pdf = await generateCertificatePdf(
    {
      certificateNumber: certificate.certificateNumber,
      studentName: `${certificate.student.firstName} ${certificate.student.lastName}`,
      universityName: certificate.university.name,
      course: certificate.course,
      grade: certificate.grade,
      title: certificate.title,
      issueDate: certificate.issueDate,
      logoPath: logoAbs,
      tokenId: certificate.tokenId,
      template,
      expiresAt: certificate.expiresAt,
    },
    qr.filePath
  );

  return prisma.certificate.update({
    where: { id },
    data: {
      template,
      pdfUrl: pdf.url,
      qrCodeUrl: qr.url,
      status:
        certificate.status === CertificateStatus.DRAFT
          ? CertificateStatus.GENERATED
          : certificate.status,
    },
    include: { student: true, university: true },
  });
};

export const notifyRevocation = async (certificateId: string) => {
  const certificate = await prisma.certificate.findUnique({
    where: { id: certificateId },
    include: { student: true },
  });
  if (!certificate) return;

  const template = emailTemplates.certificateRevoked(
    `${certificate.student.firstName} ${certificate.student.lastName}`,
    certificate.course,
    certificate.revokeReason || 'Administrative action'
  );
  await enqueueEmail({ to: certificate.student.email, ...template });
};

export type { CertificateTemplate };
