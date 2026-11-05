export const INSPECTION_TYPES = [
    'move-in',
    'move-out',
    'routine',
    'annual',
    'safety',
    'maintenance',
    'emergency',
    'quarterly', 
    null
] as const;

export type InspectionType = typeof INSPECTION_TYPES[number];
