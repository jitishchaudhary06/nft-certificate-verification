import { Router } from 'express';
import { RoleName } from '@prisma/client';
import * as controller from '../controllers/student.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { upload } from '../middleware/upload';
import { studentSchema } from '../validators/schemas';

const router = Router();

router.use(authenticate);
router.use(authorize(RoleName.SUPER_ADMIN, RoleName.UNIVERSITY_ADMIN));

router.get('/', controller.list);
router.get('/export/csv', controller.exportCsv);
router.get('/:id', controller.getOne);
router.post('/', validate(studentSchema), controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.remove);
router.post('/import/csv', upload.single('csv'), controller.importCsv);

export default router;
