import { Router } from 'express';
import { RoleName } from '@prisma/client';
import * as controller from '../controllers/verify.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/', controller.search);
router.get('/certificate/:id', controller.verifyCertificate);
router.get('/:token', controller.verifyToken);

export default router;

export const dashboardRouter = Router();
dashboardRouter.get(
  '/',
  authenticate,
  authorize(RoleName.SUPER_ADMIN, RoleName.UNIVERSITY_ADMIN),
  controller.dashboard
);

export const studentDashboardRouter = Router();
studentDashboardRouter.get(
  '/nfts',
  authenticate,
  authorize(RoleName.STUDENT, RoleName.SUPER_ADMIN),
  controller.studentNfts
);
