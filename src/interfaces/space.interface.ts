import { Document, Types } from 'mongoose';

export interface ISpace extends Document {
    propertyId: Types.ObjectId;
    layoutId: Types.ObjectId;
    ownerId: Types.ObjectId;
    name: string;
    sourceField: string;
    order: number;
    createdAt: Date;
    updatedAt: Date;
}