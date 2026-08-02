import { Router } from 'express';
import { RoleName } from '@prisma/client';
import * as controller from '../controllers/certificate.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { upload } from '../middleware/upload';
import { certificateSchema, mintSchema, revokeSchema } from '../validators/schemas';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  authorize(RoleName.SUPER_ADMIN, RoleName.UNIVERSITY_ADMIN, RoleName.STUDENT),
  controller.list
);
router.get(
  '/:id',
  authorize(RoleName.SUPER_ADMIN, RoleName.UNIVERSITY_ADMIN, RoleName.STUDENT),
  controller.getOne
);
router.post(
  '/',
  authorize(RoleName.SUPER_ADMIN, RoleName.UNIVERSITY_ADMIN),
  upload.single('pdf'),
  validate(certificateSchema),
  controller.create
);
router.delete(
  '/:id',
  authorize(RoleName.SUPER_ADMIN, RoleName.UNIVERSITY_ADMIN),
  controller.remove
);
router.post(
  '/:id/generate-pdf',
  authorize(RoleName.SUPER_ADMIN, RoleName.UNIVERSITY_ADMIN),
  controller.regeneratePdf
);
router.post(
  '/:id/ipfs',
  authorize(RoleName.SUPER_ADMIN, RoleName.UNIVERSITY_ADMIN),
  controller.uploadIpfs
);
router.post(
  '/:id/email',
  authorize(RoleName.SUPER_ADMIN, RoleName.UNIVERSITY_ADMIN),
  controller.emailCert
);
router.post(
  '/:id/revoke',
  authorize(RoleName.SUPER_ADMIN, RoleName.UNIVERSITY_ADMIN),
  validate(revokeSchema),
  controller.revoke
);

export default router;

export const mintRouter = Router();
mintRouter.use(authenticate);
mintRouter.post(
  '/',
  authorize(RoleName.SUPER_ADMIN, RoleName.UNIVERSITY_ADMIN),
  validate(mintSchema),
  controller.mint
);
