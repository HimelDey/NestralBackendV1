import { Document, Types } from 'mongoose';

export interface IReferencePhoto {
    _id?: Types.ObjectId;
    url: string;
    filename: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface IElement extends Document {
    propertyId: Types.ObjectId;
    layoutId: Types.ObjectId;
    spaceId: Types.ObjectId;
    ownerId: Types.ObjectId;
    name: string;
    order: number;
    referencePhotos: IReferencePhoto[];
    createdAt: Date;
    updatedAt: Date;
}