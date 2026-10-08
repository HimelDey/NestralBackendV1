import fs from 'fs';
import path from 'path';
import multer from 'multer';

const uploadRoot = path.join(process.cwd(), 'uploads', 'properties');
const layoutRoot = path.join(process.cwd(), 'uploads', 'layouts');
const inspectionRoot = path.join(process.cwd(), 'uploads', 'inspections');

if (!fs.existsSync(uploadRoot)) fs.mkdirSync(uploadRoot, { recursive: true });
if (!fs.existsSync(layoutRoot)) fs.mkdirSync(layoutRoot, { recursive: true });
if (!fs.existsSync(inspectionRoot)) fs.mkdirSync(inspectionRoot, { recursive: true });

const propertyStorage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, uploadRoot);
    },
    filename: (_req, file, cb) => {
        const timestamp = Date.now();
        const random = Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        const baseName = path.basename(file.originalname, ext).replace(/\s+/g, '-');
        cb(null, `${baseName}-${timestamp}-${random}${ext}`);
    }
});

const fileFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowed.includes(file.mimetype)) {
        cb(null, true);
        return;
    }
    cb(new Error('Only image files are allowed'));
};

export const uploadSingle = multer({
    storage: propertyStorage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024
    }
});

export const uploadMultiple = multer({
    storage: propertyStorage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024,
        files: 10
    }
});

export const layoutUpload = multer({
    storage: multer.diskStorage({
        destination: (_req, _file, cb) => cb(null, layoutRoot),
        filename: (_req, file, cb) => {
            const timestamp = Date.now();
            const random = Math.round(Math.random() * 1e9);
            const ext = path.extname(file.originalname);
            cb(null, `layout-${timestamp}-${random}${ext}`);
        }
    }),
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024, files: 10 }
});

export const inspectionUpload = multer({
    storage: multer.diskStorage({
        destination: (_req, _file, cb) => cb(null, inspectionRoot),
        filename: (_req, file, cb) => {
            const timestamp = Date.now();
            const random = Math.round(Math.random() * 1e9);
            const ext = path.extname(file.originalname);
            cb(null, `inspection-${timestamp}-${random}${ext}`);
        }
    }),
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024, files: 10 }
});

export default uploadSingle;