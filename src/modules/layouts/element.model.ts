import mongoose, { Schema } from 'mongoose';
import { IElement } from '../../interfaces/element.interface';

const referencePhotoSchema = new Schema(
    {
        url: { type: String, required: true },
        filename: { type: String, required: true }
    },
    { timestamps: true }
);

const elementSchema = new Schema(
    {
        propertyId: {
            type: Schema.Types.ObjectId,
            ref: 'Property',
            required: true,
            index: true
        },
        layoutId: {
            type: Schema.Types.ObjectId,
            ref: 'PropertyLayout',
            required: true,
            index: true
        },
        spaceId: {
            type: Schema.Types.ObjectId,
            ref: 'Space',
            required: true,
            index: true
        },
        ownerId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        },
        name: {
            type: String,
            required: true,
            trim: true
        },
        order: {
            type: Number,
            default: 0
        },
        referencePhotos: {
            type: [referencePhotoSchema],
            default: []
        }
    },
    { timestamps: true }
);

elementSchema.index({ propertyId: 1, ownerId: 1, order: 1 });
elementSchema.index({ spaceId: 1, ownerId: 1, order: 1 });

export default mongoose.model<IElement>('Element', elementSchema);