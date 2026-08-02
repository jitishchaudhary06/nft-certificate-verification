import { Router } from 'express';
import authRoutes from './auth.routes';
import universityRoutes from './university.routes';
import studentRoutes from './student.routes';
import certificateRoutes, { mintRouter } from './certificate.routes';
import verifyRoutes, { dashboardRouter, studentDashboardRouter } from './verify.routes';
import prisma from '../config/database';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: 'NFT Certificate Generator API is healthy',
    timestamp: new Date().toISOString(),
  });
});

router.get('/health/db', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    const userCount = await prisma.user.count();
    res.json({
      success: true,
      message: 'Database connected',
      data: { userCount },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Database not connected',
      errors: envSafeMessage(err),
    });
  }
});

function envSafeMessage(err: unknown) {
  const message = err instanceof Error ? err.message : 'Unknown error';
  return message.slice(0, 300);
}

router.use('/auth', authRoutes);
router.use('/universities', universityRoutes);
router.use('/student', studentRoutes);
router.use('/students', studentRoutes);
router.use('/certificate', certificateRoutes);
router.use('/certificates', certificateRoutes);
router.use('/mint', mintRouter);
router.use('/verify', verifyRoutes);
router.use('/dashboard', dashboardRouter);
router.use('/student-dashboard', studentDashboardRouter);

export default router;
