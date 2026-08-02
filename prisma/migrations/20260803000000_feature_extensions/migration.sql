-- AlterEnum
ALTER TYPE "CertificateStatus" ADD VALUE IF NOT EXISTS 'PENDING_APPROVAL';
ALTER TYPE "CertificateStatus" ADD VALUE IF NOT EXISTS 'EXPIRED';

-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "CertificateTemplate" AS ENUM ('CLASSIC', 'MODERN', 'ELEGANT');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- AlterEnum TransactionType
ALTER TYPE "TransactionType" ADD VALUE IF NOT EXISTS 'RENEW';

-- AlterTable
ALTER TABLE "certificates" ADD COLUMN IF NOT EXISTS "template" "CertificateTemplate" NOT NULL DEFAULT 'CLASSIC';
ALTER TABLE "certificates" ADD COLUMN IF NOT EXISTS "approvalStatus" "ApprovalStatus" NOT NULL DEFAULT 'APPROVED';
ALTER TABLE "certificates" ADD COLUMN IF NOT EXISTS "expiresAt" TIMESTAMP(3);
ALTER TABLE "certificates" ADD COLUMN IF NOT EXISTS "approvedAt" TIMESTAMP(3);
ALTER TABLE "certificates" ADD COLUMN IF NOT EXISTS "approvedById" TEXT;
ALTER TABLE "certificates" ADD COLUMN IF NOT EXISTS "rejectionReason" TEXT;

CREATE INDEX IF NOT EXISTS "certificates_approvalStatus_idx" ON "certificates"("approvalStatus");
CREATE INDEX IF NOT EXISTS "certificates_expiresAt_idx" ON "certificates"("expiresAt");