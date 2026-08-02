import { NextFunction, Response } from 'express';
import { AuthRequest } from '../types';
import * as authService from '../services/auth.service';
import { sendSuccess } from '../utils/response';

export const register = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await authService.register(req.body);
    sendSuccess(res, result, result.message, 201);
  } catch (err) {
    next(err);
  }
};

export const login = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await authService.login(req.body.email, req.body.password);
    sendSuccess(res, result, 'Login successful');
  } catch (err) {
    next(err);
  }
};

export const verifyEmail = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await authService.verifyEmail(String(req.query.token || req.body.token));
    sendSuccess(res, result, result.message);
  } catch (err) {
    next(err);
  }
};

export const forgotPassword = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await authService.forgotPassword(req.body.email);
    sendSuccess(res, result, result.message);
  } catch (err) {
    next(err);
  }
};

export const resetPassword = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await authService.resetPassword(req.body.token, req.body.password);
    sendSuccess(res, result, result.message);
  } catch (err) {
    next(err);
  }
};

export const refresh = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await authService.refreshTokens(req.body.refreshToken);
    sendSuccess(res, result, 'Token refreshed');
  } catch (err) {
    next(err);
  }
};

export const googleAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await authService.googleLogin(req.body.idToken);
    sendSuccess(res, result, 'Google login successful');
  } catch (err) {
    next(err);
  }
};

export const metamaskNonce = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await authService.getMetamaskNonce(req.body.address);
    sendSuccess(res, result, 'Nonce generated');
  } catch (err) {
    next(err);
  }
};

export const metamaskLogin = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await authService.metamaskLogin(req.body);
    sendSuccess(res, result, 'MetaMask login successful');
  } catch (err) {
    next(err);
  }
};

export const logout = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await authService.logout(req.user!.userId);
    sendSuccess(res, result, result.message);
  } catch (err) {
    next(err);
  }
};

export const me = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await authService.getProfile(req.user!.userId);
    sendSuccess(res, result, 'Profile fetched');
  } catch (err) {
    next(err);
  }
};

export const linkWallet = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await authService.linkWallet(
      req.user!.userId,
      req.body.address,
      req.body.signature,
      req.body.nonce
    );
    sendSuccess(res, result, 'Wallet linked');
  } catch (err) {
    next(err);
  }
};
