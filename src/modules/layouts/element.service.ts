import Element from './element.model';
import Space from './space.model';
import { buildLayoutImageUrl, deleteLayoutImagesByFilename } from '../../utils/file-storage';

class ElementService {
    async getElementsByProperty(propertyId: string, ownerId: string): Promise<any[]> {
        const elements = await Element.find({ propertyId, ownerId })
            .sort({ order: 1 });

        return elements.map((element: any) => ({
            ...element.toJSON(),
            photos: (element.referencePhotos || []).map((photo: any) => ({
                ...photo.toJSON(),
                url: buildLayoutImageUrl(photo.filename)
            }))
        }));
    }

    async getElementsBySpace(spaceId: string, ownerId: string): Promise<any[]> {
        const elements = await Element.find({ spaceId, ownerId })
            .sort({ order: 1 });

        return elements.map((element: any) => ({
            ...element.toJSON(),
            photos: (element.referencePhotos || []).map((photo: any) => ({
                ...photo.toJSON(),
                url: buildLayoutImageUrl(photo.filename)
            }))
        }));
    }

    async addElement(
        spaceId: string,
        ownerId: string,
        name: string,
        imageFiles?: Express.Multer.File[]
    ): Promise<any> {
        const space = await Space.findOne({ _id: spaceId, ownerId });
        if (!space) {
            if (imageFiles?.length) deleteLayoutImagesByFilename(imageFiles.map(f => f.filename));
            throw new Error('Space not found');
        }

        const normalizedName = name.trim().toLowerCase();

        const exists = await Element.findOne({
            spaceId,
            ownerId,
            name: { $regex: `^${this.escapeRegex(normalizedName)}$`, $options: 'i' }
        });

        if (exists) {
            if (imageFiles?.length) deleteLayoutImagesByFilename(imageFiles.map(f => f.filename));
            throw new Error('Element with this name already exists in this space');
        }

        const lastElement = await Element.findOne({ spaceId, ownerId }).sort({ order: -1 });
        const nextOrder = lastElement?.order ? lastElement.order + 1 : 1;

        const referencePhotos = (imageFiles || []).map(file => ({
            url: buildLayoutImageUrl(file.filename),
            filename: file.filename
        }));

        const element = await Element.create({
            propertyId: space.propertyId,
            layoutId: space.layoutId,
            spaceId: space._id,
            ownerId,
            name: name.trim(),
            order: nextOrder,
            referencePhotos
        });

        return {
            ...element.toJSON(),
            photos: element.referencePhotos
        };
    }

    async updateElement(
        elementId: string,
        ownerId: string,
        name: string,
        imageFiles?: Express.Multer.File[]
    ): Promise<any> {
        const element = await Element.findOne({ _id: elementId, ownerId });
        if (!element) {
            if (imageFiles?.length) deleteLayoutImagesByFilename(imageFiles.map(f => f.filename));
            throw new Error('Element not found');
        }

        const normalizedName = name.trim().toLowerCase();

        const exists = await Element.findOne({
            _id: { $ne: elementId },
            spaceId: element.spaceId,
            ownerId,
            name: { $regex: `^${this.escapeRegex(normalizedName)}$`, $options: 'i' }
        });

        if (exists) {
            if (imageFiles?.length) deleteLayoutImagesByFilename(imageFiles.map(f => f.filename));
            throw new Error('Element with this name already exists in this space');
        }

        element.name = name.trim();

        if (imageFiles?.length) {
            const newPhotos = imageFiles.map(file => ({
                url: buildLayoutImageUrl(file.filename),
                filename: file.filename
            }));

            element.referencePhotos.push(...(newPhotos as any));
        }

        await element.save();

        return {
            ...element.toJSON(),
            photos: element.referencePhotos
        };
    }

    async deleteElement(elementId: string, ownerId: string): Promise<boolean> {
        const element = await Element.findOne({ _id: elementId, ownerId });
        if (!element) throw new Error('Element not found');

        const filenames = (element.referencePhotos || []).map((photo: any) => photo.filename);
        if (filenames.length) {
            deleteLayoutImagesByFilename(filenames);
        }

        await Element.deleteOne({ _id: elementId, ownerId });
        return true;
    }

    async uploadReferencePhotos(
        elementId: string,
        ownerId: string,
        imageFiles: Express.Multer.File[]
    ): Promise<any> {
        const element = await Element.findOne({ _id: elementId, ownerId });
        if (!element) {
            if (imageFiles?.length) deleteLayoutImagesByFilename(imageFiles.map(f => f.filename));
            throw new Error('Element not found');
        }

        const newPhotos = imageFiles.map(file => ({
            url: buildLayoutImageUrl(file.filename),
            filename: file.filename
        }));

        element.referencePhotos.push(...(newPhotos as any));
        await element.save();

        return {
            ...element.toJSON(),
            photos: element.referencePhotos
        };
    }

    async deleteReferencePhoto(
        elementId: string,
        ownerId: string,
        photoId: string
    ): Promise<any> {
        const element = await Element.findOne({ _id: elementId, ownerId });
        if (!element) throw new Error('Element not found');

        const photo = (element.referencePhotos as any).find((p: any) => p._id?.toString() === photoId);
        if (!photo) throw new Error('Photo not found');

        deleteLayoutImagesByFilename([photo.filename]);

        element.referencePhotos = (element.referencePhotos as any).filter(
            (p: any) => p._id?.toString() !== photoId
        );

        await element.save();

        return {
            ...element.toJSON(),
            photos: element.referencePhotos
        };
    }

    private escapeRegex(value: string): string {
        return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
}

export default new ElementService();