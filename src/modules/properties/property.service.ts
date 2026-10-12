import type { Express } from 'express';
import Property from './property.model';
// import Inspection from '../inspections/inspection.model';
import { IProperty, IPropertyBase } from '../../interfaces/property.interface';
// import { formatInspectionsResponse } from '../../utils/inspection-status';
import { buildPropertyImageUrl, deletePropertyImagesByFilename } from '../../utils/file-storage';
import PropertyLayout from '../layouts/property-layout.model';
import PropertyLayoutService from '../layouts/property-layout.service';
import Element from '../layouts/element.model';

class PropertyService {
    private buildImagesWithFullUrl(images: any[]): any[] {
        const baseUrl = (process.env.BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
        return (images ?? []).map((img: any) => ({
            ...(img.toObject ? img.toObject() : img),
            url: `${baseUrl}/uploads/properties/${img.filename}`
        }));
    }

    private buildFullImageUrl(filename?: string | null): string | null {
        if (!filename) return null;
        const baseUrl = (process.env.BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
        return `${baseUrl}/uploads/properties/${filename}`;
    }

    /**
     * Create a new property
     */
    async createProperty(
        propertyData: IPropertyBase,
        ownerId: string,
        imageFiles?: Express.Multer.File[]
    ): Promise<IProperty> {
        try {
            // Strip raw 'images' field to prevent Mongoose casting error when
            // the frontend sends images as an empty string via multipart/form-data
            const { images: _images, ...safePropertyData } = propertyData as any;
            const property = new Property({
                ...safePropertyData,
                ownerId,
                country: propertyData.country || 'Canada'
            });

            if (imageFiles && imageFiles.length > 0) {
                // Process multiple images
                property.images = imageFiles.map((file, index) => ({
                    url: buildPropertyImageUrl(file.filename),
                    filename: file.filename,
                    isPrimary: index === 0, // First image is primary
                    order: index
                }));

                // Set backward compatible imageUrl to first image
                property.imageUrl = property.images[0].url;
            }

            await property.save();

            // Auto-create layout sections from property fields (bedrooms, bathrooms, garage)
            await PropertyLayoutService.autoCreateLayout(property);

            return property;
        } catch (error: any) {
            // Cleanup uploaded images if property creation fails
            if (imageFiles && imageFiles.length > 0) {
                const filenames = imageFiles.map(f => f.filename);
                deletePropertyImagesByFilename(filenames);
            }
            if (error.code === 11000) {
                throw new Error('Property with this address already exists');
            }
            throw error;
        }
    }

    /**
     * Get all properties for a specific owner
     */
    async getAllProperties(ownerId: string, status?: string): Promise<any[]> {
        try {
            const query: Record<string, any> = { ownerId };
            if (status) query.status = status;

            const properties = await Property.find(query).sort({ createdAt: -1 });

            // Transform properties to match the desired output format
            return properties.map(property => {
                const propObj = property.toJSON();
                const images = this.buildImagesWithFullUrl(property.images ?? []);
                const primaryImg = images.find((img: any) => img.isPrimary) || images[0];

                return {
                    id: propObj.id,
                    imageUrl: primaryImg ? primaryImg.url : null,
                    images,
                    address: propObj.streetAddress,
                    // city: propObj.cityTown,
                    // postalCode: propObj.postalCode,
                    country: propObj.country,
                    bedrooms: propObj.bedrooms,
                    bathrooms: propObj.bathrooms,
                    parkingSpaces: propObj.garage,
                    isFurnished: propObj.isFurnished,
                    status: propObj.status,
                    createdAt: propObj.createdAt
                };
            });
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get a single property by ID with aggregated inspection reports
     */
    async getPropertyById(propertyId: string, ownerId: string): Promise<any> {
        try {
            const property = await Property.findOne({ _id: propertyId, ownerId });
            if (!property) {
                throw new Error('Property not found');
            }

            // Rebuild full URLs from filenames
            const images = this.buildImagesWithFullUrl(property.images ?? []);
            const primaryImg = images.find((img: any) => img.isPrimary) || images[0];
            property.images = images;
            property.imageUrl = primaryImg ? primaryImg.url : property.imageUrl;

            // Check if any element exists for this property in elements collection
            const hasLayout = !!(await Element.exists({ propertyId, ownerId }));

            // Fetch and aggregate inspection reports for completed inspections
            // const inspections = await Inspection.find({
            //     propertyId: propertyId,
            //     status: 'completed',
            //     reportUrl: { $exists: true, $ne: null }
            // }).select('status reportUrl');

            // // Format inspections with computed effective status
            // const formattedInspections = formatInspectionsResponse(inspections);

            const result = property.toObject();
            return { 
                ...result, 
                hasLayout,
                // inspections: formattedInspections
            };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Update a property
     */
    async updateProperty(
        propertyId: string,
        propertyData: Partial<IPropertyBase>,
        ownerId: string,
        imageFiles?: Express.Multer.File[],
        imagesToDelete?: string[]
    ): Promise<IProperty | null> {
        try {
            const existing = await Property.findOne({ _id: propertyId, ownerId });

            if (!existing) {
                if (imageFiles && imageFiles.length > 0) {
                    const filenames = imageFiles.map(f => f.filename);
                    deletePropertyImagesByFilename(filenames);
                }
                throw new Error('Property not found or unauthorized');
            }

            // Normalise to safe array
            const currentImages = existing.images ?? [];

            if (imageFiles && imageFiles.length > 0) {
                // Delete all old images from disk and replace with new ones
                if (currentImages.length > 0) {
                    const oldFilenames = currentImages.map((img: any) => img.filename);
                    deletePropertyImagesByFilename(oldFilenames);
                }

                existing.images = imageFiles.map((file, index) => ({
                    url: buildPropertyImageUrl(file.filename),
                    filename: file.filename,
                    isPrimary: index === 0,
                    order: index
                }));
            } else {
                // No new files — keep existing
                existing.images = currentImages;
            }

            // Update primary image reference
            const updatedImages = existing.images ?? [];
            if (updatedImages.length > 0) {
                const hasPrimary = updatedImages.some((img: any) => img.isPrimary);
                if (!hasPrimary) {
                    updatedImages[0].isPrimary = true;
                }
                const primaryImg = updatedImages.find((img: any) => img.isPrimary);
                existing.imageUrl = primaryImg ? primaryImg.url : updatedImages[0].url;
            }

            // Apply other updates (strip raw 'images' to avoid Mongoose casting error)
            const { images: _img, ...safeUpdateData } = propertyData as any;
            Object.assign(existing, safeUpdateData);

            await existing.save();
            return existing;
        } catch (error) {
            if (imageFiles && imageFiles.length > 0) {
                const filenames = imageFiles.map(f => f.filename);
                deletePropertyImagesByFilename(filenames);
            }
            throw error;
        }
    }

    /**
     * Delete a property
     */
    async deleteProperty(propertyId: string, ownerId: string): Promise<boolean> {
        try {
            const property = await Property.findOne({ _id: propertyId, ownerId });
            
            if (!property) {
                throw new Error('Property not found or unauthorized');
            }

            // Delete all image files
            if (property.images && property.images.length > 0) {
                const filenames = property.images.map((img: any) => img.filename);
                deletePropertyImagesByFilename(filenames);
            }

            await Property.findOneAndDelete({ _id: propertyId, ownerId });

            return true;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Set primary image
     */
    async setPrimaryImage(propertyId: string, ownerId: string, imageId: string): Promise<IProperty> {
        try {
            const property = await Property.findOne({ _id: propertyId, ownerId });
            
            if (!property) {
                throw new Error('Property not found or unauthorized');
            }

            const images = property.images ?? [];

            // Reset all images to non-primary
            images.forEach((img: any) => {
                img.isPrimary = false;
            });

            // Set specified image as primary
            const targetImage = images.find((img: any) =>
                img._id.toString() === imageId
            );

            if (!targetImage) {
                throw new Error('Image not found');
            }

            targetImage.isPrimary = true;
            property.imageUrl = targetImage.url; // Update backward compatible field

            await property.save();
            return property;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Reorder images
     */
    async reorderImages(propertyId: string, ownerId: string, imageOrder: { imageId: string; order: number }[]): Promise<IProperty> {
        try {
            const property = await Property.findOne({ _id: propertyId, ownerId });
            
            if (!property) {
                throw new Error('Property not found or unauthorized');
            }

            const images = property.images ?? [];

            imageOrder.forEach(({ imageId, order }) => {
                const image = images.find((img: any) =>
                    img._id.toString() === imageId
                );
                if (image) {
                    image.order = order;
                }
            });

            // Sort images by order
            images.sort((a: any, b: any) => a.order - b.order);
            property.images = images;

            await property.save();
            return property;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get property details with inspections (for task section)
     */
    async getPropertyDetails(propertyId: string, ownerId: string): Promise<any> {
        try {
            const property = await Property.findOne({ _id: propertyId, ownerId });
            
            if (!property) {
                throw new Error('Property not found');
            }

            // Get inspections for this property
            // const inspections = await Inspection.find({ propertyId })
            //     .sort({ date: -1 })
            //     .limit(10);

            // Format inspections with computed effective status
            // const inspectionsWithId = formatInspectionsResponse(inspections).map((insp: any) => ({
            //     id: insp.id,
            //     title: insp.title,
            //     date: insp.date,
            //     inspectionType: insp.inspectionType,
            //     status: insp.status
            // }));

            const images = this.buildImagesWithFullUrl((property as any).images ?? []);
            const primaryImg = images.find((img: any) => img.isPrimary) || images[0];

            // Format property details
            return {
                id: property._id.toString(),
                imageUrl: primaryImg ? primaryImg.url : null,
                images,
                propertyType: property.propertyType,
                // address: `${property.unitAptName ? property.unitAptName + ', ' : ''}${property.streetAddress}, ${property.cityTown}, ${property.province} ${property.postalCode}, ${property.country}`,
                // city: `${property.cityTown}, ${property.province}`,
                // postalCode: property.postalCode,
                country: property.country,
                bedrooms: property.bedrooms,
                bathrooms: property.bathrooms,
                garage: property.garage,
                isFurnished: property.isFurnished,
                tenant: null, // TODO: Add tenant data when tenant module is implemented
                documents: [], // TODO: Add documents when document module is implemented
                // inspections: inspectionsWithId,
                maintenance: [], // TODO: Add maintenance when implemented later
                createdAt: property.createdAt
            };
        } catch (error) {
            throw error;
        }
    }

}

export default new PropertyService();
