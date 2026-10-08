import fs from 'fs';
import path from 'path';

const uploadsRoot = path.join(process.cwd(), 'uploads');

const buildUrl = (folder: string, filename: string): string => {
    const baseUrl = (process.env.BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
    return `${baseUrl}/uploads/${folder}/${filename}`;
};

export const buildPropertyImageUrl = (filename: string): string =>
    buildUrl('properties', filename);

export const buildLayoutImageUrl = (filename: string): string =>
    buildUrl('layouts', filename);

export const buildInspectionImageUrl = (filename: string): string =>
    buildUrl('inspections', filename);

export const deleteImageByUrl = (imageUrl?: string | null): void => {
    if (!imageUrl) return;

    const filename = path.basename(imageUrl);
    const filePath = path.join(uploadsRoot, 'properties', filename);

    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }
};

export const deleteMultipleImages = (imageUrls: string[]): void => {
    imageUrls.forEach(url => deleteImageByUrl(url));
};

const deleteFiles = (folder: string, filenames: string[]): void => {
    filenames.forEach(filename => {
        const filePath = path.join(uploadsRoot, folder, filename);
        try {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        } catch (error) {
            console.error(`Error deleting ${folder} image ${filename}:`, error);
        }
    });
};

export const deletePropertyImagesByFilename = (filenames: string[]): void =>
    deleteFiles('properties', filenames);

export const deleteLayoutImagesByFilename = (filenames: string[]): void =>
    deleteFiles('layouts', filenames);

export const deleteInspectionImagesByFilename = (filenames: string[]): void =>
    deleteFiles('inspections', filenames);