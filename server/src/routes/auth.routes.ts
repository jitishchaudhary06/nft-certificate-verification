import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as authController from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  forgotPasswordSchema,
  googleAuthSchema,
  loginSchema,
  metamaskLoginSchema,
  metamaskNonceSchema,
  refreshTokenSchema,
  registerSchema,
  resetPasswordSchema,
} from '../validators/schemas';

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many auth attempts, please try again later' },
});

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user
 */
router.post('/register', authLimiter, validate(registerSchema), authController.register);

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Email/password login
 */
router.post('/login', authLimiter, validate(loginSchema), authController.login);

router.get('/verify-email', authController.verifyEmail);
router.post('/verify-email', authController.verifyEmail);
router.post('/forgot-password', authLimiter, validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', authLimiter, validate(resetPasswordSchema), authController.resetPassword);
router.post('/refresh', validate(refreshTokenSchema), authController.refresh);
router.post('/google', authLimiter, validate(googleAuthSchema), authController.googleAuth);
router.post('/metamask/nonce', validate(metamaskNonceSchema), authController.metamaskNonce);
router.post('/metamask', authLimiter, validate(metamaskLoginSchema), authController.metamaskLogin);
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.me);
router.post('/link-wallet', authenticate, authController.linkWallet);

export default router;
