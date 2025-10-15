import axios from 'axios';
import { createApiUrl } from '@portfolio-grade/shared';
import type {
  FormData,
  FieldModel,
  FormSubmissionData,
  FormSubmissionResponse,
} from './FormPage.types';

export function createSlug(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, '_');
}

export function convertSchemaToFields(schema: Record<string, unknown>): FieldModel[] {
  const fields: FieldModel[] = [];
  const properties = (schema.properties as Record<string, any>) || {};
  const required = (schema.required as string[]) || [];

  Object.entries(properties).forEach(([key, field], index) => {
    const fieldType =
      field.type === 'string' && field.format === 'email'
        ? 'input'
        : field.type === 'string' && field.maxLength > 100
        ? 'textarea'
        : field.type === 'boolean'
        ? 'checkbox'
        : field.enum
        ? 'select'
        : 'input';

    fields.push({
      id: `field_${index}`,
      label: field.title || key,
      type: fieldType,
      order: index,
      config: {
        name: key,
        placeholder: field.description || '',
        required: required.includes(key),
        ...(field.enum && { options: field.enum }),
        ...(fieldType === 'textarea' && { rows: 4 }),
      },
    });
  });

  return fields;
}

export async function fetchForm(id: string): Promise<FormData> {
  const token = localStorage.getItem('token') || localStorage.getItem('accessToken') || '';
  const orgId = localStorage.getItem('orgId') || localStorage.getItem('orgid') || '';

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (orgId) headers['x-org-id'] = orgId;

  const response = await axios.get(createApiUrl(`/public/forms/${id}`), { headers });

  return response.data;
}

export async function submitForm(
  id: string,
  data: FormSubmissionData,
): Promise<FormSubmissionResponse> {
  const token = localStorage.getItem('token') || localStorage.getItem('accessToken') || '';
  const orgId = localStorage.getItem('orgId') || localStorage.getItem('orgid') || '';

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    Authorization: `Bearer ${token}`,
    'Idempotency-Key': `submission:${id}:${Date.now()}:${Math.random().toString(36).slice(2)}`,
  };

  if (orgId) headers['x-org-id'] = orgId;

  const response = await axios.post(
    createApiUrl(`/public/forms/${id}/submit`),
    { data },
    { headers },
  );

  return response.data;
}

export function getAuthTokens(): { token: string; orgId: string } {
  return {
    token: localStorage.getItem('token') || localStorage.getItem('accessToken') || '',
    orgId: localStorage.getItem('orgId') || localStorage.getItem('orgid') || '',
  };
}
