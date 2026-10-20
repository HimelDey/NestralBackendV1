import fs from "fs";
import path from "path";
import logger from "./logger";
import { propertyDocumentsRoot } from "../config/multer.config";
import { IPropertyDocument } from "../interfaces/property.interface";

export class PropertyDocumentValidationError extends Error {}

const detectContentType = (header: Buffer): IPropertyDocument["contentType"] | null => {
  if (header.subarray(0, 5).toString("ascii") === "%PDF-") {
    return "application/pdf";
  }
  if (
    header.length >= 3 &&
    header[0] === 0xff &&
    header[1] === 0xd8 &&
    header[2] === 0xff
  ) {
    return "image/jpeg";
  }
  return null;
};

export const buildPropertyDocumentMetadata = async (
  files: Express.Multer.File[],
  uploadedBy: string,
): Promise<Omit<IPropertyDocument, "_id">[]> => {
  const documents: Omit<IPropertyDocument, "_id">[] = [];

  for (const file of files) {
    const handle = await fs.promises.open(file.path, "r");
    let header: Buffer;
    try {
      header = Buffer.alloc(12);
      const { bytesRead } = await handle.read(header, 0, header.length, 0);
      header = header.subarray(0, bytesRead);
    } finally {
      await handle.close();
    }

    const actualContentType = detectContentType(header);
    if (!actualContentType || actualContentType !== file.mimetype) {
      throw new PropertyDocumentValidationError(
        `Uploaded file "${path.basename(file.originalname)}" is not a valid ${file.mimetype} file`,
      );
    }

    documents.push({
      storageKey: path.basename(file.filename),
      name: path.basename(file.originalname),
      contentType: actualContentType,
      size: file.size,
      uploadedBy,
      uploadedAt: new Date(),
    });
  }

  return documents;
};

export const deletePropertyDocumentUploads = async (
  files: Express.Multer.File[],
): Promise<void> => {
  const failures: string[] = [];
  const root = path.resolve(propertyDocumentsRoot);

  for (const file of files) {
    const storageKey = path.basename(file.filename);
    const filePath = path.resolve(root, storageKey);
    if (path.dirname(filePath) !== root) {
      failures.push(`Invalid property document storage key: ${storageKey}`);
      continue;
    }

    try {
      await fs.promises.unlink(filePath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        failures.push(`${storageKey}: ${(error as Error).message}`);
      }
    }
  }

  if (failures.length) {
    const message = `Failed to clean up property document upload(s): ${failures.join("; ")}`;
    logger.error(message);
    throw new Error(message);
  }
};
