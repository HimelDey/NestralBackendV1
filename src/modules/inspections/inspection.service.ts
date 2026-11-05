import Inspection from './inspection.model';
import InspectionComment from './inspection-comment.model';
import Property from '../properties/property.model';
import User from '../auth/user.model';
import { IInspection, IInspectionBase, IInspectionQuery } from '../../interfaces/inspection.interface';
import { formatInspectionResponse, formatInspectionsResponse, calculateDuration } from '../../utils/inspection-status';
import { INSPECTION_TYPES } from '../../constants/inspection.constants';
import { extractFilters, buildQuery } from '../../utils/inspectionFilter.util';
import Element from '../layouts/element.model';
class InspectionService {
    /**
     * Create a new inspection
     */
    async createInspection(inspectionData: IInspectionBase, createdBy: string): Promise<any> {
        try {
            // Verify property exists
            const property = await Property.findById(inspectionData.propertyId);
            if (!property) {
                throw new Error('Property not found');
            }

            const inspection = new Inspection({
                ...inspectionData,
                createdBy,
                status: 'scheduled'
            });

            await inspection.save();
            return formatInspectionResponse(inspection);
        } catch (error: any) {
            throw error;
        }
    }

    /**
     * Get all inspections with filters and pagination
     */
    async getAllInspections(queryParams: IInspectionQuery, req: any): Promise<any> {
        try {
            const {
                page = 1,
                limit = 100,
                propertyId,
                startDate,
                endDate
            } = queryParams;

            const skip = (parseInt(page.toString()) - 1) * parseInt(limit.toString());

            // NEW HYBRID FILTER LOGIC
            const tokens = extractFilters(queryParams);
            const filterQuery = buildQuery(tokens);

            // Preserve existing filters
            const query: any = {
            ...filterQuery
            };

            // Keep your existing filters working
            if (propertyId) query.propertyId = propertyId;
            if (req.user) query.inspectorId = req.user.id;

            // Date range (merge safely)
            if (startDate || endDate) {
                query.date = {};
                if (startDate) query.date.$gte = new Date(startDate);
                if (endDate) query.date.$lte = new Date(endDate);
            }

            const [inspections, total] = await Promise.all([
                Inspection.find(query)
                    .sort({ date: -1 })
                    .skip(skip)
                    .limit(parseInt(limit.toString())),
                Inspection.countDocuments(query)
            ]);

            // Fetch all referenced properties in a single query
            const propertyIds = [...new Set(inspections.map(i => i.propertyId))];
            const properties = await Property.find({ _id: { $in: propertyIds } })
                .select('_id streetAddress cityTown province');
            const propertyMap = new Map(properties.map(p => [p._id.toString(), p]));

            const data = inspections.map(inspection => {
                const base = formatInspectionResponse(inspection);
                const property = propertyMap.get(inspection.propertyId.toString());
                return {
                    ...base,
                    property: property ? {
                        id: property._id,
                        name: `${property.streetAddress}`
                    } : null
                };
            });

            return {
                data,
                pagination: {
                    page: parseInt(page.toString()),
                    limit: parseInt(limit.toString()),
                    total,
                    pages: Math.ceil(total / parseInt(limit.toString()))
                }
            };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get a single inspection by ID (enriched for detail page)
     */
    async getInspectionById(inspectionId: string): Promise<any> {
        try {
            const inspection = await Inspection.findById(inspectionId);
            if (!inspection) {
                throw new Error('Inspection not found');
            }

            const [property, inspector, comments] = await Promise.all([
                Property.findById(inspection.propertyId).select('unitAptName fullAddress imageUrl'),
                User.findById(inspection.inspectorId).select('firstName lastName profileImageUrl'),
                InspectionComment.find({ inspectionId }).sort({ createdAt: -1 }).lean()
            ]);

            const base = formatInspectionResponse(inspection);
            
            let hasLayout = false;

            if (property) {
                hasLayout = !!(await Element.exists({
                    propertyId: property.id
                }));
            }          
            return {
                ...base,
                duration: calculateDuration(inspection.timeStart, inspection.timeEnd),
                property: property ? {
                    id: property._id,
                    name: `${property.streetAddress}`
                    
                } : null,
                inspector: inspector ? {
                    id: inspector._id,
                    name: `${inspector.firstName ?? ''} ${inspector.lastName ?? ''}`.trim(),
                    profileImageUrl: inspector.profileImageUrl ?? null
                } : null,
                comments: comments.map((comment: any) => ({
                    id: comment._id,
                    inspectionId: comment.inspectionId,
                    userId: comment.userId,
                    message: comment.message,
                    createdAt: comment.createdAt,
                    updatedAt: comment.updatedAt
                })),
                hasLayout
            };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Update an inspection
     */
    async updateInspection(
        inspectionId: string,
        updateData: Partial<IInspectionBase>,
        updatedBy: string
    ): Promise<any> {
        try {
            const inspection = await Inspection.findByIdAndUpdate(
                inspectionId,
                { ...updateData, updatedBy },
                { new: true, runValidators: true }
            );

            if (!inspection) {
                throw new Error('Inspection not found');
            }

            return formatInspectionResponse(inspection);
        } catch (error) {
            throw error;
        }
    }

    /**
     * Manually cancel an inspection
     */
    async cancelInspection(inspectionId: string): Promise<any> {
        try {
            const inspection = await Inspection.findByIdAndUpdate(
                inspectionId,
                { $set: { status: 'cancelled', cancelledAt: new Date() } },
                { new: true }
            );

            if (!inspection) {
                throw new Error('Inspection not found');
            }

            return formatInspectionResponse(inspection);
        } catch (error) {
            throw error;
        }
    }

    /**
     * Manually mark an inspection as completed
     */
    async completeInspection(inspectionId: string): Promise<any> {
        try {
            const inspection = await Inspection.findByIdAndUpdate(
                inspectionId,
                { $set: { status: 'completed', completedAt: new Date() } },
                { new: true }
            );

            if (!inspection) {
                throw new Error('Inspection not found');
            }

            return formatInspectionResponse(inspection);
        } catch (error) {
            throw error;
        }
    }

    /**
     * Delete an inspection
     */
    async deleteInspection(inspectionId: string): Promise<void> {
        try {
            const inspection = await Inspection.findByIdAndDelete(inspectionId);
            if (!inspection) {
                throw new Error('Inspection not found');
            }
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get inspections by property
     */
    async getInspectionsByProperty(propertyId: string, limit: number = 10): Promise<any[]> {
        try {
            const inspections = await Inspection.find({ propertyId })
                .sort({ date: -1 })
                .limit(limit);

            return formatInspectionsResponse(inspections);
        } catch (error) {
            throw error;
        }
    }

    /**
     * Inspection create page — page load data
     * Returns owner's properties + inspection type options
     */
    async getFormData(ownerId: string): Promise<any> {
        try {
            const properties = await Property.find({
                ownerId,
                status: { $in: ['active', 'inactive', 'rented'] }
            })
                .select('_id streetAddress')
                .sort({ createdAt: -1 });

            // Derived from constants — single source of truth
            const inspectionTypes = INSPECTION_TYPES.map(value => ({
                value,
                label: value ? value.charAt(0).toUpperCase() + value.slice(1).replace(/-/g, ' ') : ''
            }));

            return {
                properties: properties.map(p => ({
                    id:    p._id.toString(),
                    label: `${p.streetAddress}`
                })),
                inspectionTypes
            };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Inspection create page — inspectors for a selected property
     * Returns owner of the property (tenant will be added here in the future)
     */
    async getFormDataInspectors(propertyId: string, ownerId: string): Promise<any> {
        try {
            const property = await Property.findOne({ _id: propertyId, ownerId })
                .select('_id ownerId');

            if (!property) {
                throw new Error('Property not found or unauthorized');
            }

            const owner = await User.findById(property.ownerId)
                .select('_id firstName lastName');

            const inspectors: any[] = [];

            if (owner) {
                inspectors.push({
                    id:   owner._id.toString(),
                    name: `${owner.firstName ?? ''} ${owner.lastName ?? ''}`.trim(),
                    role: 'owner'
                });
            }

            // Future: when tenantId is added to property schema
            // if (property.tenantId) {
            //   const tenant = await User.findById(property.tenantId)
            //     .select('_id firstName lastName')
            //     .lean();
            //   if (tenant) {
            //     inspectors.push({
            //       id:   tenant._id.toString(),
            //       name: `${tenant.firstName ?? ''} ${tenant.lastName ?? ''}`.trim(),
            //       role: 'tenant'
            //     });
            //   }
            // }

            return { inspectors };
        } catch (error) {
            throw error;
        }
    }

    async addInspectionComment(inspectionId: string, userId: string, message: string): Promise<any> {
        try {
            if (!message || !message.trim()) {
                throw new Error('Comment message is required');
            }

            const inspection = await Inspection.findById(inspectionId);
            if (!inspection) {
                throw new Error('Inspection not found');
            }

            const comment = await InspectionComment.create({
                inspectionId,
                userId,
                message: message.trim()
            });

            return {
                id: comment._id,
                inspectionId: comment.inspectionId,
                userId: comment.userId,
                message: comment.message,
                createdAt: comment.createdAt,
                updatedAt: comment.updatedAt
            };
        } catch (error) {
            throw error;
        }
    }

    async getInspectionComments(inspectionId: string): Promise<any[]> {
        try {
            const inspection = await Inspection.findById(inspectionId);
            if (!inspection) {
                throw new Error('Inspection not found');
            }

            const comments = await InspectionComment.find({ inspectionId })
                .sort({ createdAt: -1 })
                .lean();

            return comments.map((comment: any) => ({
                id: comment._id,
                inspectionId: comment.inspectionId,
                userId: comment.userId,
                message: comment.message,
                createdAt: comment.createdAt,
                updatedAt: comment.updatedAt
            }));
        } catch (error) {
            throw error;
        }
    }
}

export default new InspectionService();
