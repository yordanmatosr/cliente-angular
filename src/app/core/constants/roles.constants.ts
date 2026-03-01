export const ROLE = {
    SUPER:      'super',
    SUPERADMIN: 'superadmin',
    ADMIN:      'admin',
    USER:       'user',
    KIOSK:      'kiosk',
} as const;

export type RoleName = typeof ROLE[keyof typeof ROLE];

/** Roles con acceso administrativo (dashboards, reportes, gestión de entidades) */
export const ADMIN_ROLES: RoleName[] = [ROLE.SUPER, ROLE.SUPERADMIN, ROLE.ADMIN];

/** Roles con acceso a gestión de usuarios y departamentos */
export const MANAGEMENT_ROLES: RoleName[] = [ROLE.SUPER, ROLE.SUPERADMIN];
