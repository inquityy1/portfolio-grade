import axios from 'axios';
import { createApiUrl } from '@portfolio-grade/shared';
import type { UserProfile } from './LoginPage.types';

function getApiBaseUrl(): string {
  // Use Docker internal API URL for e2e tests, otherwise use VITE_API_URL
  const apiUrl =
    import.meta.env.VITE_E2E_API_URL || import.meta.env.VITE_API_URL || 'http://localhost:3000';
  return String(apiUrl).replace(/\/$/, '');
}

export async function fetchUserProfile(token: string): Promise<UserProfile | null> {
  try {
    const response = await axios.get(createApiUrl('/auth/me', getApiBaseUrl()), {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch {
    return null;
  }
}

export function extractOrganizationId(userProfile: UserProfile | null): string | undefined {
  const firstMembership = userProfile?.memberships?.[0];
  return firstMembership?.organizationId ? String(firstMembership.organizationId) : undefined;
}

export function persistAuthData(token: string, orgId?: string): void {
  localStorage.setItem('token', token);
  if (orgId) {
    localStorage.setItem('orgId', orgId);
  }
}
