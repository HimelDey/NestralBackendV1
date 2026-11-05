import { IStoredStatus, IEffectiveStatus } from '../interfaces/inspection.interface';

interface IInspectionStatusInput {
    status: IStoredStatus;
    date: Date;
    timeStart: string; // "14:30"
    timeEnd: string;   // "16:00"
}

/**
 * Converts "14:30" + a date into a full Date object
 */
function buildDateTime(date: Date, timeStr: string): Date {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const result = new Date(date);
    result.setHours(hours, minutes, 0, 0);
    return result;
}

/**
 * Returns the effective inspection status.
 *
 * All inspection statuses are now persisted in MongoDB.
 * No transient or time-based status is computed here.
 */
export function computeEffectiveStatus(
    inspection: IInspectionStatusInput
): IEffectiveStatus {
    return inspection.status;
}

/**
 * Apply computed effective status to a single inspection object.
 * Accepts both Mongoose documents and plain objects.
 */
export function formatInspectionResponse(inspection: any): any {
    const obj = typeof inspection.toJSON === 'function'
        ? inspection.toJSON()
        : inspection;

    return {
        ...obj,
        status: computeEffectiveStatus({
            status: inspection.status,
            date: inspection.date,
            timeStart: inspection.timeStart,
            timeEnd: inspection.timeEnd
        })
    };
}

/**
 * Apply computed effective status to an array of inspections
 */
export function formatInspectionsResponse(inspections: any[]): any[] {
    return inspections.map(formatInspectionResponse);
}

/**
 * Calculate human-readable duration between two "HH:MM" strings
 */
export function calculateDuration(timeStart: string, timeEnd: string): string {
    const [startH, startM] = timeStart.split(':').map(Number);
    const [endH, endM] = timeEnd.split(':').map(Number);
    const totalMinutes = (endH * 60 + endM) - (startH * 60 + startM);
    if (totalMinutes <= 0) return '0 min';
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours === 0) return `${minutes} min`;
    if (minutes === 0) return `${hours} hr`;
    return `${hours} hr ${minutes} min`;
}
