import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { randomUUID } from 'crypto';
import { Request, Response, NextFunction } from 'express';

const uploadRoot = path.join(process.cwd(), 'uploads', 'properties');
const layoutRoot = path.join(process.cwd(), 'uploads', 'layouts');
const inspectionRoot = path.join(process.cwd(), 'uploads', 'inspections');
export const leaseDocumentsRoot = path.join(process.cwd(), 'private_uploads', 'leases');
export const propertyDocumentsRoot = path.join(process.cwd(), 'private_uploads', 'properties');

if (!fs.existsSync(uploadRoot)) fs.mkdirSync(uploadRoot, { recursive: true });
if (!fs.existsSync(layoutRoot)) fs.mkdirSync(layoutRoot, { recursive: true });
if (!fs.existsSync(inspectionRoot)) fs.mkdirSync(inspectionRoot, { recursive: true });
if (!fs.existsSync(leaseDocumentsRoot)) fs.mkdirSync(leaseDocumentsRoot, { recursive: true });
if (!fs.existsSync(propertyDocumentsRoot)) fs.mkdirSync(propertyDocumentsRoot, { recursive: true });

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

const leaseDocumentMimeExtensions: Record<string, string> = {
    'application/pdf': '.pdf',
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'image/gif': '.gif'
};

const leaseDocumentUpload = multer({
    storage: multer.diskStorage({
        destination: (_req, _file, cb) => cb(null, leaseDocumentsRoot),
        filename: (_req, file, cb) => {
            const extension = leaseDocumentMimeExtensions[file.mimetype];
            cb(null, `${randomUUID()}${extension || ''}`);
        }
    }),
    fileFilter: (_req, file, cb) => {
        if (Object.prototype.hasOwnProperty.call(leaseDocumentMimeExtensions, file.mimetype)) {
            cb(null, true);
            return;
        }
        cb(new Error('Only PDF and image files are allowed'));
    },
    limits: { fileSize: 5 * 1024 * 1024, files: 10 }
}).array('documents', 10);

export const uploadLeaseDocuments = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    leaseDocumentUpload(req, res, (error?: unknown) => {
        if (!error) {
            next();
            return;
        }

        const message = error instanceof Error ? error.message : String(error);
        if (
            error instanceof multer.MulterError ||
            message === 'Only PDF and image files are allowed'
        ) {
            res.status(400).json({ success: false, message });
            return;
        }

        next(error);
    });
};

const propertyDocumentUpload = multer({
    storage: multer.diskStorage({
        destination: (_req, _file, cb) => cb(null, propertyDocumentsRoot),
        filename: (_req, _file, cb) => cb(null, `${randomUUID()}`),
    }),
    fileFilter: (_req, file, cb) => {
        if (file.mimetype === 'application/pdf' || file.mimetype === 'image/jpeg') {
            cb(null, true);
            return;
        }
        cb(new Error('Only PDF and JPEG files are allowed'));
    },
    limits: { fileSize: 5 * 1024 * 1024, files: 10 }
}).array('documents', 10);

export const uploadPropertyDocuments = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    propertyDocumentUpload(req, res, (error?: unknown) => {
        if (!error) {
            next();
            return;
        }

        const message = error instanceof Error ? error.message : String(error);
        if (
            error instanceof multer.MulterError ||
            message === 'Only PDF and JPEG files are allowed'
        ) {
            res.status(400).json({ success: false, message });
            return;
        }

        next(error);
    });
};

export default uploadSingle;