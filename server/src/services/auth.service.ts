import { OAuth2Client } from 'google-auth-library';
import { ethers } from 'ethers';
import { AuthProvider, RoleName } from '@prisma/client';
import prisma from '../config/database';
import { env } from '../config/env';
import { AppError } from '../middleware/errorHandler';
import {
  comparePassword,
  generateNonce,
  generateToken,
  hashPassword,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../utils/crypto';
import { emailTemplates } from './email.service';
import { enqueueEmail } from '../jobs/email.queue';
import { logActivity } from './activity.service';
import { JwtPayload } from '../types';

const googleClient = new OAuth2Client(env.google.clientId);

const getRole = async (name: RoleName) => {
  const role = await prisma.role.findUnique({ where: { name } });
  if (!role) throw new AppError(`Role ${name} not found. Run seed first.`, 500);
  return role;
};

const toAuthResponse = async (userId: string) => {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    include: { role: true, wallet: true, university: true },
  });

  const payload: JwtPayload = {
    userId: user.id,
    email: user.email,
    role: user.role.name,
    universityId: user.universityId,
  };

  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken },
  });

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      role: user.role.name,
      universityId: user.universityId,
      university: user.university
        ? { id: user.university.id, name: user.university.name, code: user.university.code }
        : null,
      wallet: user.wallet
        ? { address: user.wallet.address, chainId: user.wallet.chainId }
        : null,
      isEmailVerified: user.isEmailVerified,
      provider: user.provider,
    },
  };
};

export const register = async (data: {
  email: string;
  password: string;
  name: string;
  role?: RoleName;
}) => {
  const existing = await prisma.user.findUnique({ where: { email: data.email.toLowerCase() } });
  if (existing) throw new AppError('Email already registered', 409);

  const roleName = data.role === RoleName.EMPLOYER ? RoleName.EMPLOYER : RoleName.STUDENT;
  const role = await getRole(roleName);
  const emailVerifyToken = generateToken();

  const user = await prisma.user.create({
    data: {
      email: data.email.toLowerCase(),
      passwordHash: await hashPassword(data.password),
      name: data.name,
      provider: AuthProvider.EMAIL,
      roleId: role.id,
      emailVerifyToken,
    },
  });

  const verifyLink = `${env.clientUrl}/verify-email?token=${emailVerifyToken}`;
  const template = emailTemplates.verifyEmail(user.name, verifyLink);
  await enqueueEmail({ to: user.email, ...template });

  await logActivity({ userId: user.id, action: 'USER_REGISTERED', entity: 'User', entityId: user.id });

  return {
    message: 'Registration successful. Please verify your email.',
    userId: user.id,
  };
};

export const login = async (email: string, password: string) => {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    include: { role: true },
  });

  if (!user || !user.passwordHash) throw new AppError('Invalid email or password', 401);
  if (!user.isActive) throw new AppError('Account is deactivated', 403);

  const valid = await comparePassword(password, user.passwordHash);
  if (!valid) throw new AppError('Invalid email or password', 401);

  await logActivity({ userId: user.id, action: 'USER_LOGIN', entity: 'User', entityId: user.id });
  return toAuthResponse(user.id);
};

export const verifyEmail = async (token: string) => {
  const user = await prisma.user.findFirst({ where: { emailVerifyToken: token } });
  if (!user) throw new AppError('Invalid or expired verification token', 400);

  await prisma.user.update({
    where: { id: user.id },
    data: { isEmailVerified: true, emailVerifyToken: null },
  });

  await logActivity({ userId: user.id, action: 'EMAIL_VERIFIED', entity: 'User', entityId: user.id });
  return { message: 'Email verified successfully' };
};

export const forgotPassword = async (email: string) => {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user) {
    return { message: 'If that email exists, a reset link has been sent' };
  }

  const resetPasswordToken = generateToken();
  const resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);

  await prisma.user.update({
    where: { id: user.id },
    data: { resetPasswordToken, resetPasswordExpires },
  });

  const link = `${env.clientUrl}/reset-password?token=${resetPasswordToken}`;
  const template = emailTemplates.resetPassword(user.name, link);
  await enqueueEmail({ to: user.email, ...template });

  return { message: 'If that email exists, a reset link has been sent' };
};

export const resetPassword = async (token: string, password: string) => {
  const user = await prisma.user.findFirst({
    where: {
      resetPasswordToken: token,
      resetPasswordExpires: { gt: new Date() },
    },
  });

  if (!user) throw new AppError('Invalid or expired reset token', 400);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: await hashPassword(password),
      resetPasswordToken: null,
      resetPasswordExpires: null,
      refreshToken: null,
    },
  });

  await logActivity({ userId: user.id, action: 'PASSWORD_RESET', entity: 'User', entityId: user.id });
  return { message: 'Password reset successful' };
};

export const refreshTokens = async (refreshToken: string) => {
  let payload: JwtPayload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new AppError('Invalid refresh token', 401);
  }

  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user || user.refreshToken !== refreshToken || !user.isActive) {
    throw new AppError('Invalid refresh token', 401);
  }

  return toAuthResponse(user.id);
};

export const googleLogin = async (idToken: string) => {
  if (!env.google.clientId) throw new AppError('Google OAuth is not configured', 503);

  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: env.google.clientId,
  });
  const googlePayload = ticket.getPayload();
  if (!googlePayload?.email) throw new AppError('Invalid Google token', 401);

  const email = googlePayload.email.toLowerCase();
  let user = await prisma.user.findFirst({
    where: { OR: [{ googleId: googlePayload.sub }, { email }] },
  });

  if (!user) {
    const role = await getRole(RoleName.STUDENT);
    user = await prisma.user.create({
      data: {
        email,
        name: googlePayload.name || email.split('@')[0],
        googleId: googlePayload.sub,
        avatarUrl: googlePayload.picture,
        provider: AuthProvider.GOOGLE,
        isEmailVerified: true,
        roleId: role.id,
      },
    });
  } else if (!user.googleId) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        googleId: googlePayload.sub,
        avatarUrl: user.avatarUrl || googlePayload.picture,
        isEmailVerified: true,
      },
    });
  }

  await logActivity({ userId: user.id, action: 'GOOGLE_LOGIN', entity: 'User', entityId: user.id });
  return toAuthResponse(user.id);
};

export const getMetamaskNonce = async (address: string) => {
  const normalized = address.toLowerCase();
  let wallet = await prisma.wallet.findUnique({
    where: { address: normalized },
    include: { user: true },
  });

  const nonce = generateNonce();

  if (!wallet) {
    return {
      address: normalized,
      nonce,
      message: `Sign this message to authenticate with NFT Certificate Generator.\nNonce: ${nonce}`,
      isNew: true,
    };
  }

  await prisma.wallet.update({ where: { id: wallet.id }, data: { nonce } });

  return {
    address: normalized,
    nonce,
    message: `Sign this message to authenticate with NFT Certificate Generator.\nNonce: ${nonce}`,
    isNew: false,
  };
};

export const metamaskLogin = async (data: {
  address: string;
  signature: string;
  name?: string;
}) => {
  const normalized = data.address.toLowerCase();
  let wallet = await prisma.wallet.findUnique({
    where: { address: normalized },
    include: { user: true },
  });

  const nonce = wallet?.nonce || '';
  const message = `Sign this message to authenticate with NFT Certificate Generator.\nNonce: ${nonce}`;

  let recovered: string;
  try {
    recovered = ethers.verifyMessage(message, data.signature).toLowerCase();
  } catch {
    throw new AppError('Invalid signature', 401);
  }

  if (recovered !== normalized) throw new AppError('Signature does not match address', 401);

  if (!wallet) {
    const role = await getRole(RoleName.STUDENT);
    const email = `${normalized.slice(0, 10)}@wallet.local`;
    const user = await prisma.user.create({
      data: {
        email,
        name: data.name || `Wallet ${normalized.slice(0, 8)}`,
        provider: AuthProvider.METAMASK,
        isEmailVerified: true,
        roleId: role.id,
        wallet: {
          create: {
            address: normalized,
            nonce: generateNonce(),
            chainId: env.blockchain.chainId,
          },
        },
      },
    });
    await logActivity({ userId: user.id, action: 'METAMASK_LOGIN', entity: 'User', entityId: user.id });
    return toAuthResponse(user.id);
  }

  await prisma.wallet.update({
    where: { id: wallet.id },
    data: { nonce: generateNonce() },
  });

  await logActivity({
    userId: wallet.userId,
    action: 'METAMASK_LOGIN',
    entity: 'User',
    entityId: wallet.userId,
  });

  return toAuthResponse(wallet.userId);
};

export const logout = async (userId: string) => {
  await prisma.user.update({
    where: { id: userId },
    data: { refreshToken: null },
  });
  await logActivity({ userId, action: 'USER_LOGOUT', entity: 'User', entityId: userId });
  return { message: 'Logged out successfully' };
};

export const getProfile = async (userId: string) => {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    include: {
      role: true,
      wallet: true,
      university: true,
      studentProfile: true,
    },
  });

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl,
    role: user.role.name,
    universityId: user.universityId,
    university: user.university,
    wallet: user.wallet,
    studentProfile: user.studentProfile,
    isEmailVerified: user.isEmailVerified,
    provider: user.provider,
    createdAt: user.createdAt,
  };
};

export const linkWallet = async (userId: string, address: string, signature: string, nonce: string) => {
  const normalized = address.toLowerCase();
  const message = `Sign this message to authenticate with NFT Certificate Generator.\nNonce: ${nonce}`;
  const recovered = ethers.verifyMessage(message, signature).toLowerCase();
  if (recovered !== normalized) throw new AppError('Invalid signature', 401);

  const existing = await prisma.wallet.findUnique({ where: { address: normalized } });
  if (existing && existing.userId !== userId) {
    throw new AppError('Wallet already linked to another account', 409);
  }

  const wallet = await prisma.wallet.upsert({
    where: { userId },
    create: {
      address: normalized,
      userId,
      chainId: env.blockchain.chainId,
      nonce: generateNonce(),
    },
    update: {
      address: normalized,
      nonce: generateNonce(),
    },
  });

  return wallet;
};
