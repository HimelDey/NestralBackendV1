import mongoose, { Schema } from 'mongoose';
import { IInspection } from '../../interfaces/inspection.interface';
import { INSPECTION_TYPES } from '../../constants/inspection.constants';

const InspectionSchema = new Schema<IInspection>({
    propertyId: {
        type: String,
        required: true,
        index: true
    },
    inspectorId: {
        type: String,
        required: true,
        index: true
    },
    inspectionType: {
        type: String,
        enum: INSPECTION_TYPES,
        default: null,
        index: true
    },
    title: {
        type: String
    },
    date: {
        type: Date,
        required: true,
        index: true
    },
    timeStart: {
        type: String,
        required: true  // "14:30"
    },
    timeEnd: {
        type: String,
        required: true  // "16:00"
    },
    // Only permanent/manual statuses are stored in DB.
    // Transient statuses (ongoing, overdue) are computed at response time.
    status: {
        type: String,
        enum: ['scheduled', 'cancelled', 'completed', 'ongoing'],
        default: 'scheduled',
        index: true
    },
    completedAt: {
        type: Date,
        default: null
    },
    cancelledAt: {
        type: Date,
        default: null
    },
    notes: {
        type: String,
        default: null
    },
    reportUrl: {
        type: String,
        default: null
    },
    createdBy: {
        type: String,
        required: true
    },
    updatedBy: {
        type: String
    }
}, {
    timestamps: true
});

// Compound indexes
InspectionSchema.index({ propertyId: 1, date: -1 });
InspectionSchema.index({ inspectorId: 1, date: -1 });
InspectionSchema.index({ status: 1, date: 1 });
InspectionSchema.index({ propertyId: 1, status: 1, date: -1 });

export default mongoose.model<IInspection>('Inspection', InspectionSchema);
