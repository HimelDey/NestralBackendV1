import { Document, Types } from 'mongoose';

export interface IInspectionPhoto {
    _id?: Types.ObjectId;
    url: string;
    filename: string;
    selfComment?: string | null;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface IInspectionElementRecord extends Document {
    inspectionId: Types.ObjectId;
    propertyId: Types.ObjectId;
    spaceId: Types.ObjectId;
    elementId: Types.ObjectId;
    ownerId: Types.ObjectId;
    notes?: string | null;
    condition?: string | null;
    comment?: string | null;
    photos: IInspectionPhoto[];
    createdAt: Date;
    updatedAt: Date;
}