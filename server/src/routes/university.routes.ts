import { Router } from 'express';
import { RoleName } from '@prisma/client';
import * as controller from '../controllers/university.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { upload } from '../middleware/upload';
import { assignAdminSchema, universitySchema } from '../validators/schemas';

const router = Router();

router.use(authenticate);

router.get('/', authorize(RoleName.SUPER_ADMIN, RoleName.UNIVERSITY_ADMIN), controller.list);
router.get('/:id', authorize(RoleName.SUPER_ADMIN, RoleName.UNIVERSITY_ADMIN), controller.getOne);
router.post(
  '/',
  authorize(RoleName.SUPER_ADMIN),
  upload.single('logo'),
  validate(universitySchema),
  controller.create
);
router.put(
  '/:id',
  authorize(RoleName.SUPER_ADMIN),
  upload.single('logo'),
  controller.update
);
router.delete('/:id', authorize(RoleName.SUPER_ADMIN), controller.remove);
router.post(
  '/:id/assign-admin',
  authorize(RoleName.SUPER_ADMIN),
  validate(assignAdminSchema),
  controller.assignAdmin
);

export default router;
