import axios from 'axios';
import { createApiUrl } from '@portfolio-grade/shared';
import type { FormData, UpdateFormData, UpdateFormResponse } from './EditFormPage.types';

export function formatJsonSchema(schema: string): { formatted: string; error: string | null } {
  try {
    // Remove trailing commas and format JSON
    const cleaned = schema.replace(/,(\s*[}\]])/g, '$1');
    const parsed = JSON.parse(cleaned);
    return {
      formatted: JSON.stringify(parsed, null, 2),
      error: null,
    };
  } catch (e: any) {
    return {
      formatted: schema,
      error: `Cannot format JSON: ${e.message}`,
    };
  }
}

export function validateFormData(
  name: string,
  schema: string,
): { isValid: boolean; error: string | null } {
  if (!name.trim()) {
    return { isValid: false, error: 'Form name is required' };
  }

  try {
    JSON.parse(schema);
    return { isValid: true, error: null };
  } catch (e: any) {
    return { isValid: false, error: `Invalid JSON schema: ${e.message}` };
  }
}

export async function fetchForm(id: string): Promise<FormData> {
  const token = localStorage.getItem('token') || localStorage.getItem('accessToken') || '';
  const orgId = localStorage.getItem('orgId') || localStorage.getItem('orgid') || '';

  const headers: Record<string, string> = {
    Accept: 'application/json',
    Authorization: `Bearer ${token}`,
  };

  if (orgId) headers['x-org-id'] = orgId;

  const response = await axios.get(createApiUrl(`/forms/${id}`), { headers });

  return response.data;
}

export async function updateForm(
  id: string,
  formData: UpdateFormData,
): Promise<UpdateFormResponse> {
  const token = localStorage.getItem('token') || localStorage.getItem('accessToken') || '';
  const orgId = localStorage.getItem('orgId') || localStorage.getItem('orgid') || '';

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    Authorization: `Bearer ${token}`,
    'Idempotency-Key': `form:update:${id}:${Date.now()}:${Math.random().toString(36).slice(2)}`,
  };

  if (orgId) headers['x-org-id'] = orgId;

  const response = await axios.patch(createApiUrl(`/forms/${id}`), formData, { headers });

  return response.data;
}

export function getAuthTokens(): { token: string; orgId: string } {
  return {
    token: localStorage.getItem('token') || localStorage.getItem('accessToken') || '',
    orgId: localStorage.getItem('orgId') || localStorage.getItem('orgid') || '',
  };
}
