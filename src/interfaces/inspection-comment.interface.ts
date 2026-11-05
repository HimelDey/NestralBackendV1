import { Document, Types } from 'mongoose';

export interface IInspectionComment extends Document {
    inspectionId: Types.ObjectId;
    userId: Types.ObjectId;
    message: string;
    createdAt: Date;
    updatedAt: Date;
}
