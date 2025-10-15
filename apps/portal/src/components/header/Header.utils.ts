import axios from 'axios';
import type { UserWithMemberships } from './Header.types';

export async function fetchUserRoles(token: string | null): Promise<UserWithMemberships | null> {
  if (!token) return null;
  try {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    const { data } = await axios.get(`${apiBase()}/auth/me`, { headers });
    return data;
  } catch {
    return null;
  }
}

export function apiBase() {
  const B = String(import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '');
  return /\/api$/.test(B) ? B : `${B}/api`;
}

export function hasAdminRights(memberships: Array<{ role: string }> | undefined): boolean {
  if (!memberships) return false;
  const roles = new Set(memberships.map(m => m.role));
  return roles.has('Editor') || roles.has('OrgAdmin');
}
