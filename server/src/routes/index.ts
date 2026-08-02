import { Router } from 'express';
import authRoutes from './auth.routes';
import universityRoutes from './university.routes';
import studentRoutes from './student.routes';
import certificateRoutes, { mintRouter } from './certificate.routes';
import verifyRoutes, { dashboardRouter, studentDashboardRouter } from './verify.routes';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: 'NFT Certificate Generator API is healthy',
    timestamp: new Date().toISOString(),
  });
});

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
