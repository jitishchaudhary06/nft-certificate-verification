import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

const uploadsRoot = path.resolve(__dirname, '../../../uploads');

const ensureDir = (dir: string) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

ensureDir(uploadsRoot);
ensureDir(path.join(uploadsRoot, 'logos'));
ensureDir(path.join(uploadsRoot, 'certificates'));
ensureDir(path.join(uploadsRoot, 'qrcodes'));
ensureDir(path.join(uploadsRoot, 'temp'));

const storage = multer.diskStorage({
  destination: (_req, file, cb) => {
    let folder = 'temp';
    if (file.fieldname === 'logo') folder = 'logos';
    if (file.fieldname === 'pdf' || file.fieldname === 'certificate') folder = 'certificates';
    cb(null, path.join(uploadsRoot, folder));
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const fileFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
  const allowedImages = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
  const allowedDocs = ['application/pdf', 'text/csv', 'application/vnd.ms-excel'];

  if (
    file.fieldname === 'logo' ||
    file.fieldname === 'image' ||
    file.fieldname === 'avatar'
  ) {
    if (allowedImages.includes(file.mimetype)) return cb(null, true);
    return cb(new Error('Only JPEG, PNG, WEBP, SVG images are allowed'));
  }

  if (file.fieldname === 'pdf' || file.fieldname === 'certificate') {
    if (file.mimetype === 'application/pdf') return cb(null, true);
    return cb(new Error('Only PDF files are allowed'));
  }

  if (file.fieldname === 'csv') {
    if (allowedDocs.includes(file.mimetype) || file.originalname.endsWith('.csv')) {
      return cb(null, true);
    }
    return cb(new Error('Only CSV files are allowed'));
  }

  cb(null, true);
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});

export const UPLOADS_ROOT = uploadsRoot;
