import path from 'path';
import {
  ApprovalStatus,
  CertificateStatus,
  CertificateTemplate,
  RoleName,
  TransactionStatus,
  TransactionType,
} from '@prisma/client';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { generateCertificateNumber } from '../utils/crypto';
import { getPagination, paginatedMeta } from '../utils/response';
import { JwtPayload } from '../types';
import { logActivity } from './activity.service';
import { generateCertificatePdf, generateQrCode } from './pdf.service';
import {
  buildCertificateMetadata,
  uploadFileToIpfs,
  uploadJsonToIpfs,
} from './ipfs.service';
import {
  getExplorerUrl,
  mintCertificateOnChain,
  revokeCertificateOnChain,
} from './blockchain.service';
import { emailTemplates } from './email.service';
import { enqueueEmail } from '../jobs/email.queue';
import { env } from '../config/env';
import { UPLOADS_ROOT } from '../middleware/upload';

const assertAccess = (actor: JwtPayload, universityId: string) => {
  if (actor.role === RoleName.SUPER_ADMIN) return;
  if (actor.role === RoleName.UNIVERSITY_ADMIN && actor.universityId === universityId) return;
  throw new AppError('Access denied', 403);
};

export const createCertificate = async (
  data: {
    studentId: string;
    title: string;
    course: string;
    grade?: string | null;
    issueDate?: Date;
    description?: string | null;
    universityId?: string;
    template?: CertificateTemplate;
    expiresAt?: Date | null;
    requiresApproval?: boolean;
  },
  actor: JwtPayload,
  uploadedPdfPath?: string
) => {
  const student = await prisma.student.findUnique({
    where: { id: data.studentId },
    include: { university: true },
  });
  if (!student) throw new AppError('Student not found', 404);

  const universityId = data.universityId || student.universityId;
  assertAccess(actor, universityId);

  const certificateNumber = generateCertificateNumber();
  const template = data.template || CertificateTemplate.CLASSIC;
  const requiresApproval = Boolean(data.requiresApproval);

  let certificate = await prisma.certificate.create({
    data: {
      certificateNumber,
      title: data.title,
      course: data.course,
      grade: data.grade,
      issueDate: data.issueDate || new Date(),
      description: data.description,
      studentId: student.id,
      universityId,
      template,
      expiresAt: data.expiresAt || null,
      approvalStatus: requiresApproval ? ApprovalStatus.PENDING : ApprovalStatus.APPROVED,
      status: requiresApproval
        ? CertificateStatus.PENDING_APPROVAL
        : uploadedPdfPath
          ? CertificateStatus.GENERATED
          : CertificateStatus.DRAFT,
      pdfUrl: uploadedPdfPath
        ? `/uploads/certificates/${path.basename(uploadedPdfPath)}`
        : null,
      approvedAt: requiresApproval ? null : new Date(),
      approvedById: requiresApproval ? null : actor.userId,
    },
    include: { student: true, university: true },
  });

  const qr = await generateQrCode(certificate.id);
  certificate = await prisma.certificate.update({
    where: { id: certificate.id },
    data: { qrCodeUrl: qr.url },
    include: { student: true, university: true },
  });

  if (!uploadedPdfPath) {
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
        template: certificate.template,
        expiresAt: certificate.expiresAt,
      },
      qr.filePath
    );

    certificate = await prisma.certificate.update({
      where: { id: certificate.id },
      data: {
        pdfUrl: pdf.url,
        status: requiresApproval
          ? CertificateStatus.PENDING_APPROVAL
          : CertificateStatus.GENERATED,
      },
      include: { student: true, university: true },
    });
  }

  await logActivity({
    userId: actor.userId,
    action: 'CERTIFICATE_CREATED',
    entity: 'Certificate',
    entityId: certificate.id,
  });

  return certificate;
};

export const regeneratePdf = async (id: string, actor: JwtPayload) => {
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
      template: certificate.template,
      expiresAt: certificate.expiresAt,
    },
    qr.filePath
  );

  return prisma.certificate.update({
    where: { id },
    data: {
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

export const uploadToIpfs = async (id: string, actor: JwtPayload) => {
  const certificate = await prisma.certificate.findUnique({
    where: { id },
    include: { student: true, university: true },
  });
  if (!certificate) throw new AppError('Certificate not found', 404);
  assertAccess(actor, certificate.universityId);
  if (!certificate.pdfUrl) throw new AppError('Generate PDF before IPFS upload', 400);

  const pdfAbs = path.join(UPLOADS_ROOT, certificate.pdfUrl.replace('/uploads/', ''));
  const pdfIpfs = await uploadFileToIpfs(pdfAbs, `${certificate.certificateNumber}.pdf`);

  // Use PDF gateway URL as NFT image placeholder; production can render a PNG preview
  const metadata = buildCertificateMetadata({
    name: certificate.title,
    description:
      certificate.description ||
      `Certificate awarded to ${certificate.student.firstName} ${certificate.student.lastName}`,
    imageIpfsUrl: pdfIpfs.url,
    studentName: `${certificate.student.firstName} ${certificate.student.lastName}`,
    university: certificate.university.name,
    course: certificate.course,
    grade: certificate.grade,
    issueDate: certificate.issueDate,
    certificateNumber: certificate.certificateNumber,
  });

  const metaIpfs = await uploadJsonToIpfs(metadata, `${certificate.certificateNumber}-metadata`);

  const updated = await prisma.certificate.update({
    where: { id },
    data: {
      pdfIpfsHash: pdfIpfs.ipfsHash,
      metadataIpfsHash: metaIpfs.ipfsHash,
      metadataUrl: metaIpfs.url,
      nftImageUrl: pdfIpfs.url,
      status: CertificateStatus.UPLOADED_IPFS,
    },
    include: { student: true, university: true },
  });

  await logActivity({
    userId: actor.userId,
    action: 'CERTIFICATE_IPFS_UPLOADED',
    entity: 'Certificate',
    entityId: id,
  });

  return updated;
};

export const mintCertificate = async (
  certificateId: string,
  walletAddress: string,
  actor: JwtPayload
) => {
  let certificate = await prisma.certificate.findUnique({
    where: { id: certificateId },
    include: { student: true, university: true },
  });
  if (!certificate) throw new AppError('Certificate not found', 404);
  assertAccess(actor, certificate.universityId);

  if (certificate.status === CertificateStatus.MINTED) {
    throw new AppError('Certificate already minted', 400);
  }
  if (certificate.isRevoked) throw new AppError('Cannot mint a revoked certificate', 400);
  if (certificate.approvalStatus !== ApprovalStatus.APPROVED) {
    throw new AppError('Certificate must be approved before minting', 400);
  }
  if (certificate.expiresAt && certificate.expiresAt.getTime() < Date.now()) {
    await prisma.certificate.update({
      where: { id: certificate.id },
      data: { status: CertificateStatus.EXPIRED },
    });
    throw new AppError('Certificate has expired. Renew it before minting', 400);
  }

  if (!certificate.metadataUrl) {
    certificate = await uploadToIpfs(certificateId, actor);
  }

  const mintResult = await mintCertificateOnChain({
    to: walletAddress,
    tokenURI: certificate.metadataUrl!,
    studentName: `${certificate.student.firstName} ${certificate.student.lastName}`,
    university: certificate.university.name,
    course: certificate.course,
    grade: certificate.grade || '',
    certificateNumber: certificate.certificateNumber,
  });

  await prisma.transaction.create({
    data: {
      txHash: mintResult.txHash,
      type: TransactionType.MINT,
      status: TransactionStatus.CONFIRMED,
      fromAddress: null,
      toAddress: walletAddress.toLowerCase(),
      tokenId: mintResult.tokenId,
      blockNumber: BigInt(mintResult.blockNumber || 0),
      network: env.blockchain.chainId === 137 ? 'polygon' : 'polygon-amoy',
      certificateId: certificate.id,
      metadata: { mocked: mintResult.mocked, chainId: env.blockchain.chainId },
    },
  });

  const qr = await generateQrCode(certificate.id, mintResult.tokenId);

  const updated = await prisma.certificate.update({
    where: { id: certificate.id },
    data: {
      tokenId: mintResult.tokenId,
      contractAddress: mintResult.contractAddress,
      transactionHash: mintResult.txHash,
      walletAddress: walletAddress.toLowerCase(),
      status: CertificateStatus.MINTED,
      qrCodeUrl: qr.url,
    },
    include: { student: true, university: true, transactions: true },
  });

  const verifyLink = `${env.clientUrl}/verify/${mintResult.tokenId}`;
  const template = emailTemplates.certificateIssued(
    `${updated.student.firstName} ${updated.student.lastName}`,
    updated.course,
    verifyLink
  );
  await enqueueEmail({ to: updated.student.email, ...template });

  await logActivity({
    userId: actor.userId,
    action: 'CERTIFICATE_MINTED',
    entity: 'Certificate',
    entityId: certificate.id,
    details: { tokenId: mintResult.tokenId, txHash: mintResult.txHash },
  });

  return {
    ...updated,
    explorerUrl: getExplorerUrl(mintResult.txHash),
  };
};

export const revokeCertificate = async (id: string, reason: string, actor: JwtPayload) => {
  const certificate = await prisma.certificate.findUnique({ where: { id } });
  if (!certificate) throw new AppError('Certificate not found', 404);
  assertAccess(actor, certificate.universityId);

  if (certificate.tokenId) {
    const result = await revokeCertificateOnChain(certificate.tokenId, reason);
    await prisma.transaction.create({
      data: {
        txHash: result.txHash,
        type: TransactionType.REVOKE,
        status: TransactionStatus.CONFIRMED,
        tokenId: certificate.tokenId,
        certificateId: id,
        metadata: { reason, mocked: result.mocked },
      },
    });
  }

  const updated = await prisma.certificate.update({
    where: { id },
    data: {
      isRevoked: true,
      revokedAt: new Date(),
      revokeReason: reason,
      status: CertificateStatus.REVOKED,
    },
    include: { student: true, university: true },
  });

  const revokeMail = emailTemplates.certificateRevoked(
    `${updated.student.firstName} ${updated.student.lastName}`,
    updated.course,
    reason
  );
  await enqueueEmail({ to: updated.student.email, ...revokeMail });

  await logActivity({
    userId: actor.userId,
    action: 'CERTIFICATE_REVOKED',
    entity: 'Certificate',
    entityId: id,
    details: { reason },
  });

  return updated;
};

export const emailCertificate = async (id: string, actor: JwtPayload) => {
  const certificate = await prisma.certificate.findUnique({
    where: { id },
    include: { student: true },
  });
  if (!certificate) throw new AppError('Certificate not found', 404);
  assertAccess(actor, certificate.universityId);

  const verifyLink = certificate.tokenId
    ? `${env.clientUrl}/verify/${certificate.tokenId}`
    : `${env.clientUrl}/verify/certificate/${certificate.id}`;

  const template = emailTemplates.certificateIssued(
    `${certificate.student.firstName} ${certificate.student.lastName}`,
    certificate.course,
    verifyLink
  );

  const attachments = certificate.pdfUrl
    ? [
        {
          filename: `${certificate.certificateNumber}.pdf`,
          path: path.join(UPLOADS_ROOT, certificate.pdfUrl.replace('/uploads/', '')),
        },
      ]
    : undefined;

  await enqueueEmail({ to: certificate.student.email, ...template, attachments });
  return { message: 'Certificate email queued' };
};

export const listCertificates = async (
  query: {
    page?: string;
    limit?: string;
    search?: string;
    status?: string;
    universityId?: string;
  },
  actor: JwtPayload
) => {
  const { page, limit, skip } = getPagination(query.page, query.limit);

  const universityFilter =
    actor.role === RoleName.SUPER_ADMIN
      ? query.universityId
        ? { universityId: query.universityId }
        : {}
      : actor.role === RoleName.STUDENT
        ? {}
        : { universityId: actor.universityId || undefined };

  const studentFilter =
    actor.role === RoleName.STUDENT
      ? { student: { userId: actor.userId } }
      : {};

  const searchFilter = query.search
    ? {
        OR: [
          { certificateNumber: { contains: query.search, mode: 'insensitive' as const } },
          { title: { contains: query.search, mode: 'insensitive' as const } },
          { course: { contains: query.search, mode: 'insensitive' as const } },
          { student: { firstName: { contains: query.search, mode: 'insensitive' as const } } },
          { student: { lastName: { contains: query.search, mode: 'insensitive' as const } } },
        ],
      }
    : {};

  const statusFilter = query.status
    ? { status: query.status as CertificateStatus }
    : {};

  const where = { ...universityFilter, ...studentFilter, ...searchFilter, ...statusFilter };

  const [data, total] = await Promise.all([
    prisma.certificate.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        student: { select: { id: true, firstName: true, lastName: true, email: true, studentId: true } },
        university: { select: { id: true, name: true, code: true } },
      },
    }),
    prisma.certificate.count({ where }),
  ]);

  return { data, meta: paginatedMeta(total, page, limit) };
};

export const getCertificate = async (id: string, actor?: JwtPayload) => {
  const certificate = await prisma.certificate.findUnique({
    where: { id },
    include: {
      student: true,
      university: true,
      transactions: { orderBy: { createdAt: 'desc' } },
    },
  });
  if (!certificate) throw new AppError('Certificate not found', 404);

  if (actor && actor.role === RoleName.UNIVERSITY_ADMIN) {
    assertAccess(actor, certificate.universityId);
  }

  return {
    ...certificate,
    explorerUrl: certificate.transactionHash
      ? getExplorerUrl(certificate.transactionHash)
      : null,
  };
};

export const deleteCertificate = async (id: string, actor: JwtPayload) => {
  const certificate = await prisma.certificate.findUnique({ where: { id } });
  if (!certificate) throw new AppError('Certificate not found', 404);
  assertAccess(actor, certificate.universityId);

  if (certificate.status === CertificateStatus.MINTED && !certificate.isRevoked) {
    throw new AppError('Revoke minted certificate before deleting', 400);
  }

  await prisma.certificate.delete({ where: { id } });
  await logActivity({
    userId: actor.userId,
    action: 'CERTIFICATE_DELETED',
    entity: 'Certificate',
    entityId: id,
  });

  return { message: 'Certificate deleted' };
};
