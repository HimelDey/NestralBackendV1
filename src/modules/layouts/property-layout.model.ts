import mongoose, { Schema } from 'mongoose';
import { IPropertyLayout } from '../../interfaces/property-layout.interface';

const propertyLayoutSchema = new Schema(
    {
        propertyId: {
            type: Schema.Types.ObjectId,
            ref: 'Property',
            required: true,
            unique: true,
            index: true
        },
        ownerId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        }
    },
    { timestamps: true }
);

export default mongoose.model<IPropertyLayout>('PropertyLayout', propertyLayoutSchema);