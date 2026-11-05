import { Document } from 'mongoose';
import { InspectionType } from '../constants/inspection.constants';

/** Statuses physically stored in MongoDB */
export type IStoredStatus =
    | 'scheduled'
    | 'ongoing'
    | 'cancelled'
    | 'completed';
/** Statuses returned to the frontend (includes computed transient ones) */
export type IEffectiveStatus = 'scheduled' | 'ongoing' | 'cancelled' | 'completed';

export interface IInspection extends Document {
    id: string;
    propertyId: string;
    inspectorId: string;
    inspectionType?: InspectionType;
    title?: string;
    date: Date;
    timeStart: string; // "14:30"
    timeEnd: string;   // "16:00"
    /** Only stored statuses — never store transient ones */
    status: IStoredStatus;
    completedAt?: Date | null;
    cancelledAt?: Date | null;
    notes?: string | null;
    reportUrl?: string | null;
    createdBy: string;
    updatedBy?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface IInspectionBase {
    propertyId: string;
    inspectorId: string;
    inspectionType?: InspectionType;
    title?: string;
    date: string | Date;
    timeStart: string;
    timeEnd: string;
    notes?: string;
}

/** Shape of every inspection returned to the frontend */
export interface IInspectionResponse {
    id: string;
    propertyId: string;
    inspectorId: string;
    inspectionType?: string;
    title?: string;
    date: Date;
    timeStart: string;
    timeEnd: string;
    status: IEffectiveStatus; 
    completedAt?: Date | null;
    cancelledAt?: Date | null;
    notes?: string | null;
    createdAt: Date;
    updatedAt: Date;
}

/** Enriched shape returned by GET /inspections/:id (detail page) */
export interface IInspectionDetailResponse extends IInspectionResponse {
    duration: string;
    property: {
        id: string;
        unitAptName: string | null;
        fullAddress: string;
        imageUrl: string | null;
    } | null;
    inspector: {
        id: string;
        name: string;
        profileImageUrl: string | null;
    } | null;
}

export interface IInspectionQuery {
    page?: number;
    limit?: number;
    status?: string;
    inspectionType?: string;
    propertyId?: string;
    inspectorId?: string;
    startDate?: string;
    endDate?: string;
}
