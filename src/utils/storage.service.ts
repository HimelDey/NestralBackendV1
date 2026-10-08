import fs from 'fs';
import path from 'path';

export interface IStorageService {
    saveReport(filename: string, buffer: Buffer): Promise<string>;
}

export class LocalStorageService implements IStorageService {
    private readonly reportsDir: string;

    constructor() {
        this.reportsDir = path.join(process.cwd(), 'reports');
        if (!fs.existsSync(this.reportsDir)) {
            fs.mkdirSync(this.reportsDir, { recursive: true });
        }
    }

    async saveReport(filename: string, buffer: Buffer): Promise<string> {
        const filePath = path.join(this.reportsDir, filename);
        fs.writeFileSync(filePath, buffer);

        const baseUrl = (process.env.BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
        return `${baseUrl}/reports/${filename}`;
    }
}

// Future cloud implementation — swap here, zero changes elsewhere:
// export class CloudStorageService implements IStorageService {
//     async saveReport(filename: string, buffer: Buffer): Promise<string> {
//         // upload to S3/Cloudinary, return cdn url
//     }
// }

export const storageService: IStorageService = new LocalStorageService();
