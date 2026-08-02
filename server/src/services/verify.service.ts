import { CertificateStatus, RoleName } from '@prisma/client';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { getExplorerUrl, verifyOnChain } from './blockchain.service';
import { env } from '../config/env';

const formatCertificate = (certificate: Awaited<ReturnType<typeof prisma.certificate.findFirst>> & {
  student?: { firstName: string; lastName: string; email: string; studentId: string };
  university?: { name: string; code: string; logoUrl: string | null };
} | null) => {
  if (!certificate) return null;

  const expired =
    certificate.status === CertificateStatus.EXPIRED ||
    Boolean(
      (certificate as { expiresAt?: Date | null }).expiresAt &&
        (certificate as { expiresAt?: Date | null }).expiresAt!.getTime() < Date.now()
    );
  const verified =
    certificate.status === CertificateStatus.MINTED && !certificate.isRevoked && !expired;

  return {
    id: certificate.id,
    certificateNumber: certificate.certificateNumber,
    title: certificate.title,
    course: certificate.course,
    grade: certificate.grade,
    issueDate: certificate.issueDate,
    status: certificate.status,
    verified,
    verificationBadge: certificate.isRevoked
      ? 'Revoked ❌'
      : expired
        ? 'Expired ⏰'
        : verified
          ? 'Verified ✅'
          : certificate.status === CertificateStatus.PENDING_APPROVAL
            ? 'Pending approval'
            : 'Not Minted',
    studentName: certificate.student
      ? `${certificate.student.firstName} ${certificate.student.lastName}`
      : null,
    studentEmail: certificate.student?.email,
    studentId: certificate.student?.studentId,
    university: certificate.university?.name,
    universityCode: certificate.university?.code,
    universityLogo: certificate.university?.logoUrl,
    pdfUrl: certificate.pdfUrl,
    nftImageUrl: certificate.nftImageUrl,
    walletAddress: certificate.walletAddress,
    transactionHash: certificate.transactionHash,
    tokenId: certificate.tokenId,
    contractAddress: certificate.contractAddress,
    ipfsUrl: certificate.metadataUrl,
    pdfIpfsHash: certificate.pdfIpfsHash,
    metadataIpfsHash: certificate.metadataIpfsHash,
    qrCodeUrl: certificate.qrCodeUrl,
    explorerUrl: certificate.transactionHash
      ? getExplorerUrl(certificate.transactionHash)
      : null,
    issuer: certificate.university?.name,
    owner: certificate.walletAddress,
    mintDate: certificate.status === CertificateStatus.MINTED ? certificate.updatedAt : null,
    isRevoked: certificate.isRevoked,
    revokeReason: certificate.revokeReason,
    template: (certificate as { template?: string }).template || 'CLASSIC',
    approvalStatus: (certificate as { approvalStatus?: string }).approvalStatus || 'APPROVED',
    expiresAt: (certificate as { expiresAt?: Date | null }).expiresAt || null,
  };
};

export const verifyByTokenId = async (tokenId: string) => {
  const certificate = await prisma.certificate.findFirst({
    where: { tokenId },
    include: {
      student: { select: { firstName: true, lastName: true, email: true, studentId: true } },
      university: { select: { name: true, code: true, logoUrl: true } },
    },
  });

  if (!certificate) {
    // Try on-chain fallback
    const onChain = await verifyOnChain(tokenId);
    if (!onChain) throw new AppError('Certificate not found', 404);
    return {
      verified: onChain.isValid,
      verificationBadge: onChain.isValid ? 'Verified ✅' : 'Revoked ❌',
      source: 'blockchain',
      ...onChain,
      explorerUrl: `${env.blockchain.explorerUrl}/token/${env.blockchain.contractAddress}?a=${tokenId}`,
    };
  }

  return { ...formatCertificate(certificate), source: 'database' };
};

export const verifyByCertificateId = async (id: string) => {
  const certificate = await prisma.certificate.findUnique({
    where: { id },
    include: {
      student: { select: { firstName: true, lastName: true, email: true, studentId: true } },
      university: { select: { name: true, code: true, logoUrl: true } },
    },
  });
  if (!certificate) throw new AppError('Certificate not found', 404);
  return { ...formatCertificate(certificate), source: 'database' };
};

export const employerSearch = async (params: {
  q?: string;
  tokenId?: string;
  txHash?: string;
  walletAddress?: string;
  studentName?: string;
}) => {
  if (params.tokenId) return { data: [await verifyByTokenId(params.tokenId)] };
  if (params.txHash) {
    const certificate = await prisma.certificate.findFirst({
      where: { transactionHash: params.txHash },
      include: {
        student: { select: { firstName: true, lastName: true, email: true, studentId: true } },
        university: { select: { name: true, code: true, logoUrl: true } },
      },
    });
    if (!certificate) throw new AppError('No certificate found for this transaction', 404);
    return { data: [formatCertificate(certificate)] };
  }

  const hasCriteria = Boolean(params.walletAddress || params.studentName || params.q);
  if (!hasCriteria) {
    return { data: [] };
  }

  const where: Record<string, unknown> = {
    status: CertificateStatus.MINTED,
  };

  if (params.walletAddress) {
    where.walletAddress = params.walletAddress.toLowerCase();
  }

  if (params.studentName || params.q) {
    const term = params.studentName || params.q!;
    where.OR = [
      { student: { firstName: { contains: term, mode: 'insensitive' } } },
      { student: { lastName: { contains: term, mode: 'insensitive' } } },
      { certificateNumber: { contains: term, mode: 'insensitive' } },
      { tokenId: { contains: term, mode: 'insensitive' } },
      { transactionHash: { contains: term, mode: 'insensitive' } },
    ];
  }

  const certificates = await prisma.certificate.findMany({
    where,
    take: 20,
    orderBy: { updatedAt: 'desc' },
    include: {
      student: { select: { firstName: true, lastName: true, email: true, studentId: true } },
      university: { select: { name: true, code: true, logoUrl: true } },
    },
  });

  return { data: certificates.map(formatCertificate) };
};

export const getStudentNfts = async (userId: string) => {
  const student = await prisma.student.findFirst({ where: { userId } });
  if (!student) {
    // Also check wallet-owned certificates
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { wallet: true },
    });
    if (!user?.wallet) return { data: [] };

    const byWallet = await prisma.certificate.findMany({
      where: { walletAddress: user.wallet.address, status: CertificateStatus.MINTED },
      include: {
        student: true,
        university: true,
      },
      orderBy: { updatedAt: 'desc' },
    });
    return { data: byWallet.map((c) => ({ ...formatCertificate(c), explorerUrl: c.transactionHash ? getExplorerUrl(c.transactionHash) : null })) };
  }

  const certificates = await prisma.certificate.findMany({
    where: { studentId: student.id },
    include: { student: true, university: true },
    orderBy: { createdAt: 'desc' },
  });

  return {
    studentProfileId: student.id,
    studentPublicId: student.studentId,
    portfolioUrl: `${env.clientUrl}/portfolio/${student.studentId}`,
    data: certificates.map((c) => ({
      ...formatCertificate(c),
      shareLink: c.tokenId
        ? `${env.clientUrl}/verify/${c.tokenId}`
        : `${env.clientUrl}/verify/certificate/${c.id}`,
      explorerUrl: c.transactionHash ? getExplorerUrl(c.transactionHash) : null,
    })),
  };
};

export const getDashboardStats = async (actor: {
  role: RoleName;
  universityId?: string | null;
}) => {
  const universityFilter =
    actor.role === RoleName.UNIVERSITY_ADMIN && actor.universityId
      ? { universityId: actor.universityId }
      : {};

  const [
    totalStudents,
    totalCertificates,
    nftsMinted,
    universities,
    recentActivity,
    recentCertificates,
  ] = await Promise.all([
    prisma.student.count({ where: universityFilter }),
    prisma.certificate.count({ where: universityFilter }),
    prisma.certificate.count({
      where: { ...universityFilter, status: CertificateStatus.MINTED },
    }),
    actor.role === RoleName.SUPER_ADMIN
      ? prisma.university.count()
      : Promise.resolve(actor.universityId ? 1 : 0),
    prisma.activityLog.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true, email: true } } },
    }),
    prisma.certificate.findMany({
      where: universityFilter,
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        student: { select: { firstName: true, lastName: true } },
        university: { select: { name: true } },
      },
    }),
  ]);

  let walletBalance = '0';
  try {
    const { getWalletBalance } = await import('./blockchain.service');
    walletBalance = await getWalletBalance();
  } catch {
    walletBalance = '0';
  }

  return {
    totalStudents,
    totalCertificates,
    nftsMinted,
    universities,
    walletBalance,
    recentActivity,
    recentCertificates,
  };
};
