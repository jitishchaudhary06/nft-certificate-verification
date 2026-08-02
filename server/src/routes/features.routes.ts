import { Router } from 'express';
import { RoleName } from '@prisma/client';
import * as controller from '../controllers/features.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  bulkMintSchema,
  rejectSchema,
  renewSchema,
  templateSchema,
} from '../validators/schemas';

const router = Router();

router.get('/portfolio/:studentId', controller.portfolio);
router.get('/network', controller.networkInfo);

router.use(authenticate);

router.get(
  '/analytics',
  authorize(RoleName.SUPER_ADMIN, RoleName.UNIVERSITY_ADMIN),
  controller.analytics
);
router.get(
  '/activity-logs',
  authorize(RoleName.SUPER_ADMIN, RoleName.UNIVERSITY_ADMIN),
  controller.activityLogs
);
router.post(
  '/bulk-mint',
  authorize(RoleName.SUPER_ADMIN, RoleName.UNIVERSITY_ADMIN),
  validate(bulkMintSchema),
  controller.bulkMint
);
router.post(
  '/certificates/:id/submit-approval',
  authorize(RoleName.SUPER_ADMIN, RoleName.UNIVERSITY_ADMIN),
  controller.submitApproval
);
router.post(
  '/certificates/:id/approve',
  authorize(RoleName.SUPER_ADMIN, RoleName.UNIVERSITY_ADMIN),
  controller.approve
);
router.post(
  '/certificates/:id/reject',
  authorize(RoleName.SUPER_ADMIN, RoleName.UNIVERSITY_ADMIN),
  validate(rejectSchema),
  controller.reject
);
router.post(
  '/certificates/:id/renew',
  authorize(RoleName.SUPER_ADMIN, RoleName.UNIVERSITY_ADMIN),
  validate(renewSchema),
  controller.renew
);
router.post(
  '/certificates/:id/template',
  authorize(RoleName.SUPER_ADMIN, RoleName.UNIVERSITY_ADMIN),
  validate(templateSchema),
  controller.applyTemplate
);

export default router;
