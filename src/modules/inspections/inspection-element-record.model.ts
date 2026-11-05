import mongoose, { Schema } from 'mongoose';
import { IInspectionElementRecord } from '../../interfaces/inspection-element-record.interface';

const inspectionPhotoSchema = new Schema(
    {
        url: { type: String, required: true },
        filename: { type: String, required: true },
        selfComment: { type: String, default: null }
    },
    { timestamps: true }
);

const inspectionElementRecordSchema = new Schema(
    {
        inspectionId: {
            type: Schema.Types.ObjectId,
            ref: 'Inspection',
            required: true,
            index: true
        },
        propertyId: {
            type: Schema.Types.ObjectId,
            ref: 'Property',
            required: true,
            index: true
        },
        spaceId: {
            type: Schema.Types.ObjectId,
            ref: 'Space',
            required: true,
            index: true
        },
        elementId: {
            type: Schema.Types.ObjectId,
            ref: 'Element',
            required: true,
            index: true
        },
        ownerId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        },
        notes: {
            type: String,
            default: null
        },
        condition: {
            type: String,
            default: null
        },
        comment: {
            type: String,
            default: null
        },
        photos: {
            type: [inspectionPhotoSchema],
            default: []
        }
    },
    { timestamps: true }
);

inspectionElementRecordSchema.index(
    { inspectionId: 1, elementId: 1 },
    { unique: true }
);

inspectionElementRecordSchema.index(
    { inspectionId: 1, spaceId: 1 }
);

export default mongoose.model<IInspectionElementRecord>(
    'InspectionElementRecord',
    inspectionElementRecordSchema
);