import fs from "fs";
import path from "path";
import logger from "./logger";
import { leaseDocumentsRoot } from "../config/multer.config";
import { ILeaseDocument } from "../interfaces/lease.interface";

export class LeaseDocumentValidationError extends Error {}

const detectContentType = (header: Buffer): string | null => {
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
  if (
    header.length >= 8 &&
    header.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  ) {
    return "image/png";
  }
  if (
    header.length >= 6 &&
    ["GIF87a", "GIF89a"].includes(header.subarray(0, 6).toString("ascii"))
  ) {
    return "image/gif";
  }
  if (
    header.length >= 12 &&
    header.subarray(0, 4).toString("ascii") === "RIFF" &&
    header.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return "image/webp";
  }
  return null;
};

export const buildLeaseDocumentMetadata = async (
  files: Express.Multer.File[],
): Promise<Omit<ILeaseDocument, "_id">[]> => {
  const documents: Omit<ILeaseDocument, "_id">[] = [];

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
      throw new LeaseDocumentValidationError(
        `Uploaded file "${file.originalname}" is not a valid ${file.mimetype} file`,
      );
    }

    documents.push({
      storageKey: path.basename(file.filename),
      originalName: path.basename(file.originalname),
      contentType: actualContentType,
      size: file.size,
      uploadedAt: new Date(),
    });
  }

  return documents;
};

export const deleteLeaseDocumentUploads = async (
  files: Express.Multer.File[],
): Promise<void> => {
  const failures: string[] = [];
  const root = path.resolve(leaseDocumentsRoot);

  for (const file of files) {
    const storageKey = path.basename(file.filename);
    const filePath = path.resolve(root, storageKey);
    if (path.dirname(filePath) !== root) {
      failures.push(`Invalid lease document storage key: ${storageKey}`);
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
    const message = `Failed to clean up lease document upload(s): ${failures.join("; ")}`;
    logger.error(message);
    throw new Error(message);
  }
};
