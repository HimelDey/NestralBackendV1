import mongoose, { Schema } from 'mongoose';
import { IInspectionComment } from '../../interfaces/inspection-comment.interface';

const InspectionCommentSchema = new Schema<IInspectionComment>(
    {
        inspectionId: {
            type: Schema.Types.ObjectId,
            ref: 'Inspection',
            required: true,
            index: true
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        },
        message: {
            type: String,
            required: true,
            trim: true
        }
    },
    {
        timestamps: true
    }
);

InspectionCommentSchema.index({ inspectionId: 1, createdAt: -1 });

export default mongoose.model<IInspectionComment>('InspectionComment', InspectionCommentSchema);
