import { SetMetadata } from '@nestjs/common';
import type { Role } from '@portfolio-grade/shared';

// metadata key used by RolesGuard
export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);