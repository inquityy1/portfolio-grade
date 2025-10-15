import axios from 'axios';
import { createApiUrl } from '@portfolio-grade/shared';
import type { FormSummary, UserWithMemberships } from './FormsListPage.types';

export async function fetchForms(): Promise<FormSummary[]> {
  const token = localStorage.getItem('token') || localStorage.getItem('accessToken') || '';
  const orgId = localStorage.getItem('orgId') || localStorage.getItem('orgid') || '';

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (orgId) headers['x-org-id'] = orgId;

  const response = await axios.get(createApiUrl('/forms'), { headers });

  return response.data;
}

export async function fetchUserRoles(
  token: string | null,
  signal?: AbortSignal,
): Promise<UserWithMemberships | null> {
  if (!token) return null;
  try {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;

    const orgId = typeof localStorage !== 'undefined' ? localStorage.getItem('orgId') : null;
    if (orgId) headers['x-org-id'] = orgId;

    const { data } = await axios.get(createApiUrl('/auth/me'), {
      headers,
      signal,
    });
    return data;
  } catch {
    return null;
  }
}

export function hasAdminRights(memberships: Array<{ role: string }> | undefined): boolean {
  if (!memberships) return false;
  const roles = new Set(memberships.map(m => m.role));
  return roles.has('Editor') || roles.has('OrgAdmin');
}

export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return 'Never';
  try {
    return new Date(dateString).toLocaleDateString();
  } catch {
    return 'Invalid date';
  }
}

export async function deleteForm(id: string): Promise<void> {
  const { token, orgId } = getAuthTokens();

  const headers: Record<string, string> = {
    Accept: 'application/json',
    Authorization: `Bearer ${token}`,
    'Idempotency-Key': `form:delete:${id}:${Date.now()}:${Math.random().toString(36).slice(2)}`,
  };
  if (orgId) headers['x-org-id'] = orgId;

  await axios.delete(createApiUrl(`/forms/${id}`), { headers });
}

export function getAuthTokens(): { token: string; orgId: string } {
  return {
    token: localStorage.getItem('token') || localStorage.getItem('accessToken') || '',
    orgId: localStorage.getItem('orgId') || localStorage.getItem('orgid') || '',
  };
}
