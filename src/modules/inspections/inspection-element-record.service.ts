import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";
import Inspection from "./inspection.model";
import Space from "../layouts/space.model";
import Element from "../layouts/element.model";
import InspectionElementRecord from "./inspection-element-record.model";
import sharp from "sharp";
import {
  buildInspectionImageUrl,
  deleteInspectionImagesByFilename,
} from "../../utils/file-storage";
import Property from "../properties/property.model";
import { storageService } from "../../utils/storage.service";

class InspectionElementRecordService {
  async getChecklist(inspectionId: string, ownerId: string): Promise<any> {
    const inspection = await Inspection.findById(inspectionId);
    if (!inspection) throw new Error("Inspection not found");

    const propertyId = (inspection as any).propertyId;

    const spaces = await Space.find({ propertyId, ownerId }).sort({ order: 1 });
    const elements = await Element.find({ propertyId, ownerId }).sort({
      order: 1,
    });
    const records = await InspectionElementRecord.find({
      inspectionId,
      ownerId,
    });

    const recordMap = new Map<string, any>();
    records.forEach((record: any) => {
      recordMap.set(record.elementId.toString(), record);
    });

    const spaceMap = new Map<string, any>();
    const formattedSpaces = spaces.map((space: any) => {
      const row = {
        spaceId: space._id,
        name: space.name,
        sourceField: space.sourceField,
        order: space.order,
        elements: [],
      };
      spaceMap.set(space._id.toString(), row);
      return row;
    });

    elements.forEach((element: any) => {
      const parent = spaceMap.get(element.spaceId.toString());
      if (!parent) return;

      const record = recordMap.get(element._id.toString());

      parent.elements.push({
        elementId: element._id,
        spaceId: element.spaceId,
        name: element.name,
        order: element.order,
        condition: record?.condition || null,
        notes: record?.notes || null,
        photoCount: record?.photos?.length || 0,
      });
    });

    return {
      inspectionId,
      propertyId,
      spaces: formattedSpaces,
    };
  }

  async getSpaceElements(
    inspectionId: string,
    spaceId: string,
    ownerId: string,
  ): Promise<any[]> {
    const inspection = await Inspection.findById(inspectionId);
    if (!inspection) throw new Error("Inspection not found");

    const elements = await Element.find({ spaceId, ownerId }).sort({
      order: 1,
    });
    const records = await InspectionElementRecord.find({
      inspectionId,
      spaceId,
      ownerId,
    });

    const recordMap = new Map<string, any>();
    records.forEach((record: any) => {
      recordMap.set(record.elementId.toString(), record);
    });

    return elements.map((element: any) => {
      const record = recordMap.get(element._id.toString());

      return {
        elementId: element._id,
        spaceId: element.spaceId,
        name: element.name,
        order: element.order,
        condition: record?.condition || null,
        notes: record?.notes || null,
        photoCount: record?.photos?.length || 0,
      };
    });
  }

  async updateInspectionElement(
    inspectionId: string,
    elementId: string,
    ownerId: string,
    payload: { notes?: string; condition?: string },
  ): Promise<any> {
    const inspection = await Inspection.findById(inspectionId);
    if (!inspection) throw new Error("Inspection not found");

    const element = await Element.findOne({ _id: elementId, ownerId });
    if (!element) throw new Error("Element not found");

    const record = await InspectionElementRecord.findOneAndUpdate(
      { inspectionId, elementId, ownerId },
      {
        $set: {
          propertyId: element.propertyId,
          spaceId: element.spaceId,
          elementId,
          ownerId,
          ...(payload.notes !== undefined ? { notes: payload.notes } : {}),
          ...(payload.condition !== undefined
            ? { condition: payload.condition }
            : {}),
        },
      },
      { new: true, upsert: true },
    );

    return record;
  }

  async getPhotos(
    inspectionId: string,
    elementId: string,
    ownerId: string,
  ): Promise<any[]> {
    const record = await InspectionElementRecord.findOne({
      inspectionId,
      elementId,
      ownerId,
    });

    if (!record) return [];

    return (record.photos || []).map((photo: any) => ({
      ...photo.toJSON(),
      url: buildInspectionImageUrl(photo.filename),
      groupComment: record.comment,
    }));
  }

  async uploadPhotos(
    inspectionId: string,
    elementId: string,
    ownerId: string,
    files: Express.Multer.File[],
    comment?: string,
  ): Promise<any[]> {
    const hasPhotos = files?.length > 0;
    const hasComment = comment !== undefined && comment.trim() !== "";

    const inspection = await Inspection.findById(inspectionId);
    if (!inspection) {
      if (hasPhotos)
        deleteInspectionImagesByFilename(files.map((f) => f.filename));
      throw new Error("Inspection not found");
    }

    const element = await Element.findOne({ _id: elementId, ownerId });
    if (!element) {
      if (hasPhotos)
        deleteInspectionImagesByFilename(files.map((f) => f.filename));
      throw new Error("Element not found");
    }

    // nothing to write — return existing photos
    if (!hasPhotos && !hasComment) {
      const existing = await InspectionElementRecord.findOne({
        inspectionId,
        elementId,
        ownerId,
      });
      return (existing?.photos || []).map((photo: any) => ({
        ...photo.toJSON(),
        url: buildInspectionImageUrl(photo.filename),
      }));
    }

    const updateOps: any = {
      $setOnInsert: {
        propertyId: element.propertyId,
        spaceId: element.spaceId,
        elementId,
        ownerId,
        notes: null,
        condition: null,
      },
    };

    if (hasComment) updateOps.$set = { comment: comment!.trim() };
    if (hasPhotos) {
      const newPhotos = files.map((file) => ({
        url: buildInspectionImageUrl(file.filename),
        filename: file.filename,
      }));
      updateOps.$push = { photos: { $each: newPhotos } };
    }

    const record = await InspectionElementRecord.findOneAndUpdate(
      { inspectionId, elementId, ownerId },
      updateOps,
      { new: true, upsert: true },
    );

    return (record?.photos || []).map((photo: any) => ({
      ...photo.toJSON(),
      url: buildInspectionImageUrl(photo.filename),
    }));
  }

  async getProgress(inspectionId: string, ownerId: string): Promise<any> {
    const inspection = await Inspection.findById(inspectionId);
    if (!inspection) throw new Error("Inspection not found");

    const propertyId = (inspection as any).propertyId;

    //property info
    const propertyInfo = await Property.findById(propertyId);

    const spaces = await Space.find({ propertyId, ownerId }).sort({ order: 1 });
    const elements = await Element.find({ propertyId, ownerId }).sort({
      order: 1,
    });
    const records = await InspectionElementRecord.find({
      inspectionId,
      ownerId,
    });

    const recordMap = new Map<string, any>();
    records.forEach((record: any) => {
      recordMap.set(record.elementId.toString(), record);
    });

    const spaceMap = new Map<string, any>();
    const formattedSpaces = spaces.map((space: any) => {
      const row = {
        spaceId: space._id,
        name: space.name,
        sourceField: space.sourceField,
        order: space.order,
        totalElements: 0,
        recordedElements: 0,
        elements: [] as any[],
      };
      spaceMap.set(space._id.toString(), row);
      return row;
    });

    elements.forEach((element: any) => {
      const parent = spaceMap.get(element.spaceId.toString());
      if (!parent) return;

      const record = recordMap.get(element._id.toString());

      parent.totalElements++;
      if (record) parent.recordedElements++;

      parent.elements.push({
        elementId: element._id,
        spaceId: element.spaceId,
        name: element.name,
        order: element.order,
        condition: record?.condition || null,
        notes: record?.notes || null,
        comment: record?.comment || null,
        photos: (record?.photos || []).map((photo: any) => ({
          id: photo._id,
          url: buildInspectionImageUrl(photo.filename),
          filename: photo.filename,
          createdAt: photo.createdAt,
        })),
      });
    });

    return {
      propertyInfo,
      inspection,
      inspectionId,
      propertyId,
      spaces: formattedSpaces,
    };
  }

  private async prepareImageForPdf(imagePath: string): Promise<{
    buffer: Buffer;
    width: number;
    height: number;
  }> {
    const buffer = await sharp(imagePath)
      // Correct iPhone / Samsung / Android EXIF orientation.
      .rotate()

      // Reduce very large smartphone camera images.
      // IMPORTANT: "inside" means NO CROPPING.
      .resize({
        width: 1600,
        height: 1600,
        fit: "inside",
        withoutEnlargement: true,
      })

      .jpeg({
        quality: 90,
        mozjpeg: true,
      })

      .toBuffer();

    const metadata = await sharp(buffer).metadata();

    return {
      buffer,
      width: metadata.width ?? 1,
      height: metadata.height ?? 1,
    };
  }

  async submitReport(
    inspectionId: string,
    ownerId: string,
  ): Promise<{ reportUrl: string }> {
    const progressData = await this.getProgress(inspectionId, ownerId);

    const { propertyInfo, inspection, spaces } = progressData;

    // ============================================================
    // PAGE CONSTANTS
    // ============================================================

    const PAGE_WIDTH = 595.28; // A4
    const PAGE_HEIGHT = 841.89; // A4

    const MARGIN_X = 50;
    const MARGIN_TOP = 28;
    const MARGIN_BOTTOM = 40;

    const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_X * 2;

    // ============================================================
    // COLORS
    // ============================================================

    const PURPLE = "#6C63FF";
    const DARK = "#222222";
    const GREY = "#666666";
    const LIGHT_GREY = "#E6E6E6";
    const BADGE_BG = "#FFF3E8";
    const BADGE_TEXT = "#F08A3C";

    // ============================================================
    // PHOTO CONSTANTS
    // ============================================================

    const IMAGE_GAP = 12;

    const IMAGE_WIDTH = (CONTENT_WIDTH - IMAGE_GAP) / 2;

    // ============================================================
    // PREPARE PHOTOS
    //
    // Sharp is still responsible only for:
    // - EXIF orientation
    // - resizing
    // - compression
    //
    // This function calculates PDF display dimensions from
    // the resulting image's real aspect ratio.
    // ============================================================

    const preparePhotos = async (
      photos: any[],
    ): Promise<
      Array<{
        buffer: Buffer;
        width: number;
        height: number;
      }>
    > => {
      const result: Array<{
        buffer: Buffer;
        width: number;
        height: number;
      }> = [];

      for (const photo of photos) {
        const imagePath = path.join(
          process.cwd(),
          "uploads",
          "inspections",
          photo.filename,
        );

        if (!fs.existsSync(imagePath)) {
          console.warn("PDF image not found:", imagePath);

          continue;
        }

        try {
          const prepared = await this.prepareImageForPdf(imagePath);

          const displayWidth = IMAGE_WIDTH;

          const displayHeight =
            displayWidth * (prepared.height / prepared.width);

          result.push({
            buffer: prepared.buffer,
            width: displayWidth,
            height: displayHeight,
          });
        } catch (error) {
          console.error("Unable to prepare PDF image:", imagePath, error);
        }
      }

      return result;
    };

    // ============================================================
    // PDF GENERATION
    // ============================================================

    const pdfBuffer = await new Promise<Buffer>(async (resolve, reject) => {
      try {
        const doc = new PDFDocument({
          margin: 0,
          size: "A4",
          autoFirstPage: true,
        });

        const chunks: Buffer[] = [];

        doc.on("data", (chunk: Buffer) => {
          chunks.push(chunk);
        });

        doc.on("end", () => {
          resolve(Buffer.concat(chunks));
        });

        doc.on("error", reject);

        // ====================================================
        // PAGE HELPER
        // ====================================================

        const addPage = () => {
          doc.addPage({
            margin: 0,
            size: "A4",
          });

          doc.y = MARGIN_TOP;
        };

        // ====================================================
        // REPORT DATE/TIME
        // ====================================================

        const reportDateValue = inspection?.date || inspection?.createdAt;

        let reportDate = "";
        let reportTime = "";

        if (reportDateValue) {
          const date = new Date(reportDateValue);

          if (!Number.isNaN(date.getTime())) {
            reportDate = date.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            });

            reportTime = date.toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            });
          }
        }

        // ====================================================
        // REPORT HEADER
        //
        // This intentionally does NOT trigger a page break.
        // It belongs to page 1 and the first section follows it.
        // ====================================================

        const drawReportHeader = () => {
          const startY = MARGIN_TOP;

          // ============================================================
          // HEADING 1
          // Inspection Report
          // ============================================================

          doc
            .font("Helvetica-Bold")
            .fontSize(18)
            .fillColor(DARK)
            .text("Inspection Report", MARGIN_X, startY);

          // ============================================================
          // REPORT DATE
          // ============================================================

          if (reportDate) {
            doc
              .font("Helvetica-Bold")
              .fontSize(9)
              .fillColor(DARK)
              .text(reportDate, MARGIN_X + CONTENT_WIDTH - 95, startY, {
                width: 95,
                align: "right",
              });
          }

          // ============================================================
          // REPORT TIME
          // ============================================================

          if (reportTime) {
            doc
              .font("Helvetica")
              .fontSize(8)
              .fillColor(GREY)
              .text(reportTime, MARGIN_X + CONTENT_WIDTH - 95, startY + 18, {
                width: 95,
                align: "right",
              });
          }

          // ============================================================
          // PROPERTY ADDRESS
          // Metadata — NOT a heading
          // ============================================================

          const address =
            propertyInfo?.fullAddress ||
            propertyInfo?.propertyName ||
            inspection?.propertyId ||
            "";

          if (address) {
            doc
              .font("Helvetica")
              .fontSize(8.5)
              .fillColor(GREY)
              .text(address, MARGIN_X, startY + 25, {
                width: CONTENT_WIDTH - 120,
                lineGap: 1,
              });
          }

          // ============================================================
          // HEADER SEPARATOR
          // ============================================================

          const separatorY = startY + 57;

          doc
            .moveTo(MARGIN_X, separatorY)
            .lineTo(MARGIN_X + CONTENT_WIDTH, separatorY)
            .lineWidth(0.7)
            .stroke(LIGHT_GREY);

          // Space after Heading 1
          doc.y = separatorY + 18;
        };

        // ====================================================
        // SECTION ICON
        //
        // Simple vector bed/room marker.
        //
        // This avoids emoji/font problems in PDFKit.
        // ====================================================

        const drawSectionIcon = (x: number, y: number) => {
          doc.save();

          doc.strokeColor(PURPLE).lineWidth(1.5);

          // Bed frame / mattress
          doc.roundedRect(x, y + 7, 19, 9, 2).stroke();

          // Headboard
          doc
            .moveTo(x, y + 5)
            .lineTo(x, y + 19)
            .stroke();

          // Pillow
          doc.roundedRect(x + 2, y + 8, 6, 4, 1).stroke();

          // Legs
          doc
            .moveTo(x + 3, y + 16)
            .lineTo(x + 3, y + 20)
            .stroke();

          doc
            .moveTo(x + 16, y + 16)
            .lineTo(x + 16, y + 20)
            .stroke();

          doc.restore();
        };

        // ====================================================
        // SECTION HEADER
        //
        // Example:
        //
        // [bed icon] Bedroom 1                  3/4
        // ------------------------------------------------
        // ====================================================

        const drawSectionHeader = (space: any) => {
          const y = doc.y;

          // ============================================================
          // HEADING 2 ICON
          // ============================================================

          drawSectionIcon(MARGIN_X, y);

          // ============================================================
          // HEADING 2
          // Example: Bedroom 1
          // ============================================================

          doc
            .font("Helvetica-Bold")
            .fontSize(13)
            .fillColor(DARK)
            .text(space.name, MARGIN_X + 27, y + 3);

          // ============================================================
          // PROGRESS BADGE
          // ============================================================

          const progress =
            `${space.recordedElements ?? 0}/` + `${space.totalElements ?? 0}`;

          const badgeWidth = 29;
          const badgeHeight = 16;

          const badgeX = MARGIN_X + CONTENT_WIDTH - badgeWidth;

          const badgeY = y + 2;

          doc
            .roundedRect(badgeX, badgeY, badgeWidth, badgeHeight, 8)
            .fill(BADGE_BG);

          doc
            .font("Helvetica")
            .fontSize(7)
            .fillColor(BADGE_TEXT)
            .text(progress, badgeX, badgeY + 4, {
              width: badgeWidth,
              align: "center",
            });

          // ============================================================
          // HEADING 2 BOTTOM BORDER
          // ============================================================

          const lineY = y + 28;

          doc
            .moveTo(MARGIN_X, lineY)
            .lineTo(MARGIN_X + CONTENT_WIDTH, lineY)
            .lineWidth(0.7)
            .stroke(LIGHT_GREY);

          // Space between Heading 2 and Heading 3
          doc.y = lineY + 12;
        };

        // ====================================================
        // ELEMENT HEADER
        //
        // Example:
        //
        // Big Closet - South wall
        // ====================================================

        const drawElementHeader = (element: any) => {
          const y = doc.y;

          // ============================================================
          // HEADING 3
          // Example: South wall established
          // ============================================================

          doc
            .font("Helvetica-Bold")
            .fontSize(10.5)
            .fillColor(DARK)
            .text(element.name, MARGIN_X, y, {
              width: CONTENT_WIDTH,
              lineGap: 1,
            });

          // Space between Heading 3 and photos/paragraph
          doc.y = y + 18;
        };

        // ====================================================
        // DRAW PHOTO CARD
        // ====================================================

        const drawImageCard = (
          image: {
            buffer: Buffer;
            width: number;
            height: number;
          },
          x: number,
          y: number,
        ) => {
          doc.save();

          doc.roundedRect(x, y, image.width, image.height, 7).clip();

          // Do NOT provide a height.
          //
          // PDFKit preserves the original aspect ratio.
          doc.image(image.buffer, x, y, {
            width: image.width,
          });

          doc.restore();
        };

        // ====================================================
        // DRAW PHOTO ROWS
        //
        // This is the important pagination logic.
        //
        // We do NOT reserve the entire element/section.
        // Each actual row decides whether it fits.
        // ====================================================

        const drawPhotoRows = (
          photos: Array<{
            buffer: Buffer;
            width: number;
            height: number;
          }>,
        ) => {
          let index = 0;

          while (index < photos.length) {
            const left = photos[index];

            const right = photos[index + 1] ?? null;

            // --------------------------------------------
            // Row height is determined by the tallest
            // image in the row.
            // --------------------------------------------

            const rowHeight = Math.max(left.height, right?.height ?? 0);

            const requiredHeight = 8 + rowHeight;

            const availableHeight = PAGE_HEIGHT - MARGIN_BOTTOM - doc.y;

            // --------------------------------------------
            // If the entire row does not fit:
            //
            // move BOTH images to the next page.
            // --------------------------------------------

            if (requiredHeight > availableHeight) {
              addPage();
            }

            const y = doc.y + 8;

            // --------------------------------------------
            // LEFT IMAGE
            // --------------------------------------------

            let leftX = MARGIN_X;

            // Center the final odd image.
            if (!right) {
              leftX = MARGIN_X + (CONTENT_WIDTH - left.width) / 2;
            }

            drawImageCard(left, leftX, y);

            // --------------------------------------------
            // RIGHT IMAGE
            // --------------------------------------------

            if (right) {
              const rightX = MARGIN_X + IMAGE_WIDTH + IMAGE_GAP;

              drawImageCard(right, rightX, y);
            }

            // --------------------------------------------
            // Move below the tallest image.
            // --------------------------------------------

            doc.y = y + rowHeight + IMAGE_GAP;

            index += 2;
          }
        };

        // ====================================================
        // COMMENT
        // ====================================================

        const drawComment = (element: any) => {
          const comment = element.comment || element.notes || "";

          if (!comment || !comment.trim()) {
            return;
          }

          // ============================================================
          // PARAGRAPH PAGE PROTECTION
          // ============================================================

          if (doc.y > PAGE_HEIGHT - MARGIN_BOTTOM - 45) {
            addPage();
          }

          // ============================================================
          // PARAGRAPH
          // ============================================================

          doc
            .font("Helvetica")
            .fontSize(9)
            .fillColor(GREY)
            .text(comment.trim(), MARGIN_X, doc.y, {
              width: CONTENT_WIDTH,
              lineGap: 1.5,
            });

          // Space after paragraph
          doc.moveDown(0.8);
        };

        // ====================================================
        // ELEMENT DIVIDER
        // ====================================================

        const drawElementDivider = () => {
          if (doc.y > PAGE_HEIGHT - MARGIN_BOTTOM - 10) {
            addPage();
            return;
          }

          doc
            .moveTo(MARGIN_X, doc.y + 3)
            .lineTo(MARGIN_X + CONTENT_WIDTH, doc.y + 3)
            .lineWidth(0.6)
            .stroke(LIGHT_GREY);

          doc.y += 13;
        };

        // ====================================================
        // START REPORT
        // ====================================================

        drawReportHeader();

        // ====================================================
        // SPACES / SECTIONS
        // ====================================================

        for (const space of spaces) {
          // ------------------------------------------------
          // Only protect the section heading itself.
          //
          // We DON'T reserve the entire section.
          // ------------------------------------------------

          const SECTION_HEADER_HEIGHT = 45;

          if (doc.y + SECTION_HEADER_HEIGHT > PAGE_HEIGHT - MARGIN_BOTTOM) {
            addPage();
          }

          drawSectionHeader(space);

          // =================================================
          // ELEMENTS
          // =================================================

          for (const element of space.elements) {
            const photos = element.photos || [];

            // ---------------------------------------------
            // Prepare images first so we know their real
            // heights.
            // ---------------------------------------------

            const preparedPhotos = photos.length
              ? await preparePhotos(photos)
              : [];

            // ---------------------------------------------
            // Element header + first row:
            //
            // If we're so close to the bottom that the
            // element header would be orphaned, move it
            // together with the first row.
            //
            // This is NOT reserving the whole section.
            // ---------------------------------------------

            if (preparedPhotos.length > 0) {
              const first = preparedPhotos[0];

              const second = preparedPhotos[1] ?? null;

              const firstRowHeight = Math.max(
                first.height,
                second?.height ?? 0,
              );

              const elementHeaderHeight = 18;

              const requiredForFirstRow =
                elementHeaderHeight + 8 + firstRowHeight;

              const available = PAGE_HEIGHT - MARGIN_BOTTOM - doc.y;

              if (requiredForFirstRow > available) {
                addPage();
              }
            } else if (doc.y > PAGE_HEIGHT - MARGIN_BOTTOM - 25) {
              addPage();
            }

            // ---------------------------------------------
            // Element title
            // ---------------------------------------------

            drawElementHeader(element);

            // ---------------------------------------------
            // Photos
            // ---------------------------------------------

            if (preparedPhotos.length > 0) {
              drawPhotoRows(preparedPhotos);
            }

            // ---------------------------------------------
            // Comment
            // ---------------------------------------------

            drawComment(element);

            // ---------------------------------------------
            // Divider
            // ---------------------------------------------

            drawElementDivider();
          }

          // Small spacing before next section.
          doc.y += 8;
        }

        // ====================================================
        // FINISH
        // ====================================================

        doc.end();
      } catch (error) {
        reject(error);
      }
    });

    // ============================================================
    // SAVE REPORT
    // ============================================================

    const date = new Date().toISOString().slice(0, 10);

    const filename = `inspection-${inspectionId}-${date}.pdf`;

    const reportUrl = await storageService.saveReport(filename, pdfBuffer);

    // ============================================================
    // UPDATE INSPECTION
    // ============================================================

    await Inspection.findByIdAndUpdate(inspectionId, {
      reportUrl,
      status: "completed",
    });

    return {
      reportUrl,
    };
  }

  async deletePhoto(
    inspectionId: string,
    elementId: string,
    photoId: string,
    ownerId: string,
  ): Promise<any[]> {
    const record = await InspectionElementRecord.findOne({
      inspectionId,
      elementId,
      ownerId,
    });

    if (!record) throw new Error("Inspection element record not found");

    const photo = (record.photos as any).find(
      (p: any) => p._id?.toString() === photoId,
    );
    if (!photo) throw new Error("Photo not found");

    deleteInspectionImagesByFilename([photo.filename]);

    record.photos = (record.photos as any).filter(
      (p: any) => p._id?.toString() !== photoId,
    );

    await record.save();

    return (record.photos || []).map((p: any) => ({
      ...p.toJSON(),
      url: buildInspectionImageUrl(p.filename),
    }));
  }

  async addCommentToSpecificPhoto(
    photoId: string,
    comment: string | undefined,
  ): Promise<any[]> {
    // 1. Atomically update the specific photo inside the array
    const updatedRecord = await InspectionElementRecord.findOneAndUpdate(
      {
        "photos._id": photoId, // Finds the correct document and matches the correct photo
      },
      {
        $set: { "photos.$.selfComment": comment }, // Updates only the matched photo
      },
      { new: true }, // Returns the updated document
    );

    if (!updatedRecord) throw new Error("Record or Photo not found");

    return (updatedRecord.photos || []).map((p: any) => ({
      ...(typeof p.toJSON === "function" ? p.toJSON() : p),
      url: buildInspectionImageUrl(p.filename),
    }));
  }

  async setStatusOngoing(inspectionId: string): Promise<any> {
    const record = await Inspection.findByIdAndUpdate(
      inspectionId,
      {
        status: "ongoing",
      },
      { new: true },
    );

    return record;
  }
}

export default new InspectionElementRecordService();
