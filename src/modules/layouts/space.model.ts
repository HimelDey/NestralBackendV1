import mongoose, { Schema } from 'mongoose';
import { ISpace } from '../../interfaces/space.interface';

const spaceSchema = new Schema(
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
        sourceField: {
            type: String,
            required: true
        },
        order: {
            type: Number,
            default: 0
        }
    },
    { timestamps: true }
);

spaceSchema.index({ propertyId: 1, ownerId: 1, order: 1 });

export default mongoose.model<ISpace>('Space', spaceSchema);