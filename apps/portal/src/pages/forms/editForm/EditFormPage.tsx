import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Button,
  Input,
  Label,
  Field,
  Textarea,
  Container,
  Alert,
  LoadingContainer,
} from '@portfolio-grade/ui-kit';
import { formatJsonSchema, validateFormData, fetchForm, updateForm } from './EditFormPage.utils';
import type { FormData } from './EditFormPage.types';

export default function EditFormPage() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const [form, setForm] = useState<FormData | null>(null);
  const [name, setName] = useState('');
  const [schema, setSchema] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleFormatJson() {
    const result = formatJsonSchema(schema);
    setSchema(result.formatted);
    setError(result.error);
  }

  useEffect(() => {
    if (!id) return;

    async function loadForm() {
      try {
        setLoading(true);
        setError(null);
        const formData = await fetchForm(id);
        setForm(formData);
        setName(formData.name);
        setSchema(JSON.stringify(formData.schema, null, 2));
      } catch (e: any) {
        const s = e?.response?.status;
        if (s === 401 || s === 403) {
          nav('/login', { replace: true });
          return;
        }
        if (s === 404) {
          nav('/forms', { replace: true });
          return;
        }
        setError(e?.response?.data?.message || e.message || 'Failed to load form');
      } finally {
        setLoading(false);
      }
    }

    loadForm();
  }, [id, nav]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const validation = validateFormData(name, schema);
    if (!validation.isValid) {
      setError(validation.error);
      return;
    }

    if (!id) return;

    try {
      setSubmitting(true);
      setError(null);

      const parsedSchema = JSON.parse(schema);
      const formData = {
        name: name.trim(),
        schema: parsedSchema,
      };

      const data = await updateForm(id, formData);

      nav('/forms', {
        replace: true,
        state: { flash: `Form "${data.name}" updated successfully! ✅` },
      });
    } catch (e: any) {
      const s = e?.response?.status;
      if (s === 401 || s === 403) {
        nav('/login', { replace: true });
        return;
      }
      setError(e?.response?.data?.message || e.message || 'Failed to update form');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <Container maxWidth='800px'>
        <LoadingContainer>Loading form...</LoadingContainer>
      </Container>
    );
  }

  if (!form) {
    return (
      <Container maxWidth='800px'>
        <Alert variant='error'>Form not found</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth='800px'>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ marginBottom: 8 }}>Edit Form</h1>
        <p style={{ opacity: 0.7, margin: 0 }}>Update your form fields and validation rules.</p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 16 }}>
        <Field>
          <Label>Form Name *</Label>
          <Input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder='Enter form name'
            required
          />
        </Field>

        <Field>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 8,
            }}
          >
            <Label>JSON Schema *</Label>
            <Button
              type='button'
              onClick={handleFormatJson}
              style={{ fontSize: 12, padding: '4px 8px' }}
            >
              Format JSON
            </Button>
          </div>
          <Textarea
            value={schema}
            onChange={e => setSchema(e.target.value)}
            rows={12}
            placeholder='Enter JSON schema'
            style={{ fontFamily: 'monospace', fontSize: 14 }}
            required
          />
          <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>
            Define your form fields using JSON Schema format. This determines what fields users will
            see. Use the "Format JSON" button to fix common issues like trailing commas.
          </div>
        </Field>

        {error && <Alert variant='error'>{error}</Alert>}

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <Button
            type='button'
            onClick={() => nav('/forms', { replace: true })}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button type='submit' disabled={submitting || !name.trim()}>
            {submitting ? 'Updating...' : 'Update Form'}
          </Button>
        </div>
      </form>
    </Container>
  );
}
