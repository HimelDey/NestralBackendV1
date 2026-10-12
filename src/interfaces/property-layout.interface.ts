import { Document, Types } from 'mongoose';

export interface IPropertyLayout extends Document {
    propertyId: Types.ObjectId;
    ownerId: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}