/**
 * User roles in the system
 * 
 * - OrgAdmin: Full administrative access to organization
 * - Editor: Can create, edit, and delete content
 * - Viewer: Read-only access to content
 */
export type Role = 'OrgAdmin' | 'Editor' | 'Viewer';

/**
 * Role hierarchy for permission checking
 * Higher numbers indicate more permissions
 */
export const ROLE_HIERARCHY: Record<Role, number> = {
    OrgAdmin: 3,
    Editor: 2,
    Viewer: 1,
} as const;

/**
 * Check if a user has sufficient role level
 */
export function hasRoleLevel(userRole: Role, requiredRole: Role): boolean {
    return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

/**
 * Get all available roles
 */
export function getAllRoles(): Role[] {
    return ['OrgAdmin', 'Editor', 'Viewer'];
}
