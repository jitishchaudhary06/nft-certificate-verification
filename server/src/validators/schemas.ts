import { z } from 'zod';
import { RoleName } from '@prisma/client';

export const registerSchema = z.object({
  email: z.string().email(),
  password: z
    .string()
    .min(8)
    .regex(/[A-Z]/, 'Must contain uppercase')
    .regex(/[a-z]/, 'Must contain lowercase')
    .regex(/[0-9]/, 'Must contain number'),
  name: z.string().min(2).max(100),
  role: z.nativeEnum(RoleName).optional().default(RoleName.STUDENT),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z
    .string()
    .min(8)
    .regex(/[A-Z]/, 'Must contain uppercase')
    .regex(/[a-z]/, 'Must contain lowercase')
    .regex(/[0-9]/, 'Must contain number'),
});

export const googleAuthSchema = z.object({
  idToken: z.string().min(1),
});

export const metamaskNonceSchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
});

export const metamaskLoginSchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  signature: z.string().min(1),
  name: z.string().min(2).optional(),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});

const optionalUrl = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((val) => {
    if (val == null || val === "") return null;
    const trimmed = String(val).trim();
    if (!trimmed) return null;
    return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  })
  .pipe(z.string().url().nullable());

export const universitySchema = z.object({
  name: z.string().min(2).max(200),
  code: z.string().min(2).max(20).toUpperCase(),
  email: z.string().email().optional().nullable(),
  website: optionalUrl,
  address: z.string().max(500).optional().nullable(),
});

export const assignAdminSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  password: z.string().min(8).optional(),
});

export const studentSchema = z.object({
  studentId: z.string().min(1).max(50),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string().optional().nullable(),
  course: z.string().optional().nullable(),
  department: z.string().optional().nullable(),
  enrollmentYear: z.coerce.number().int().optional().nullable(),
  graduationYear: z.coerce.number().int().optional().nullable(),
  universityId: z.string().cuid().optional(),
});

export const certificateSchema = z.object({
  studentId: z.string().cuid(),
  title: z.string().min(2).max(200),
  course: z.string().min(1).max(200),
  grade: z.string().optional().nullable(),
  issueDate: z.coerce.date().optional(),
  description: z.string().max(1000).optional().nullable(),
  universityId: z.string().cuid().optional(),
  template: z.enum(['CLASSIC', 'MODERN', 'ELEGANT']).optional(),
  expiresAt: z.coerce.date().optional().nullable(),
  requiresApproval: z.coerce.boolean().optional(),
});

export const mintSchema = z.object({
  certificateId: z.string().cuid(),
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
});

export const bulkMintSchema = z.object({
  items: z
    .array(
      z.object({
        certificateId: z.string().cuid(),
        walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
      })
    )
    .min(1)
    .max(50),
});

export const renewSchema = z.object({
  expiresAt: z.coerce.date(),
});

export const rejectSchema = z.object({
  reason: z.string().min(3).max(500),
});

export const templateSchema = z.object({
  template: z.enum(['CLASSIC', 'MODERN', 'ELEGANT']),
});

export const revokeSchema = z.object({
  reason: z.string().min(3).max(500),
});

export const transferNftSchema = z.object({
  certificateId: z.string().cuid(),
  toAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
});

export const verifySearchSchema = z.object({
  q: z.string().optional(),
  tokenId: z.string().optional(),
  txHash: z.string().optional(),
  walletAddress: z.string().optional(),
  studentName: z.string().optional(),
});
