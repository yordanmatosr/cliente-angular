type TagSeverity = 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast';

// ---- Clinician / User status ----

export const USER_STATUS = {
    NEW:     0,
    ACTIVE:  1,
    PENDING: 2,
} as const;

export const USER_STATUS_INFO: Record<number, { label: string; severity: TagSeverity }> = {
    [USER_STATUS.NEW]:     { label: 'New',     severity: 'info' },
    [USER_STATUS.ACTIVE]:  { label: 'Active',  severity: 'success' },
    [USER_STATUS.PENDING]: { label: 'Pending', severity: 'danger' },
};

// ---- Exam status ----

export const EXAM_STATUS = {
    NEW:         'new',
    INITIATED:   'initiated',
    IN_PROGRESS: 'in progress',
    COMPLETE:    'complete',
} as const;

export const EXAM_STATUS_SEVERITY: Record<string, TagSeverity> = {
    [EXAM_STATUS.NEW]:         'info',
    [EXAM_STATUS.INITIATED]:   'warn',
    [EXAM_STATUS.IN_PROGRESS]: 'warn',
    [EXAM_STATUS.COMPLETE]:    'success',
};

// ---- Misc ----

/** Password por defecto asignado al crear usuarios desde el back-office */
export const DEFAULT_PASSWORD = '12345678';

/** Tamaño máximo para logos de organización */
export const MAX_LOGO_SIZE_BYTES = 400 * 1024;
