import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import FormRenderer from '../../../components/formRenderer/FormRenderer';
import { Container, LoadingContainer, Alert, Button } from '@portfolio-grade/ui-kit';
import { fetchForm, submitForm, convertSchemaToFields } from './FormPage.utils';
import type { FormData, FieldModel } from './FormPage.types';

export default function FormPage() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const [form, setForm] = useState<FormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;

    async function loadForm() {
      try {
        setLoading(true);
        setErr(null);
        const formData = await fetchForm(id);
        setForm(formData);
      } catch (e: any) {
        const s = e?.response?.status;
        if (s === 401 || s === 403) {
          nav('/login', { replace: true });
          return;
        }
        setErr(e?.response?.data?.message || e.message || 'Failed to load form');
      } finally {
        setLoading(false);
      }
    }

    loadForm();
  }, [id, nav]);

  const fields: FieldModel[] = useMemo(() => {
    if (!form?.schema) return [];
    return convertSchemaToFields(form.schema);
  }, [form?.schema]);

  async function handleSubmit(values: Record<string, unknown>) {
    if (!id) return;

    try {
      setSubmitting(true);
      setErr(null);

      await submitForm(id, values);

      nav('/', {
        replace: true,
        state: { flash: `Form "${form?.name}" submitted successfully! ✅` },
      });
    } catch (e: any) {
      const s = e?.response?.status;
      if (s === 401 || s === 403) {
        nav('/login', { replace: true });
        return;
      }
      setErr(e?.response?.data?.message || e.message || 'Failed to submit form');
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

  if (err) {
    return (
      <Container maxWidth='800px'>
        <Alert variant='error'>{err}</Alert>
        <Button onClick={() => nav('/forms')}>Back to Forms</Button>
      </Container>
    );
  }

  if (!form) {
    return (
      <Container maxWidth='800px'>
        <Alert variant='error'>Form not found</Alert>
        <Button onClick={() => nav('/forms')}>Back to Forms</Button>
      </Container>
    );
  }

  return (
    <Container maxWidth='800px'>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ marginBottom: 8 }}>{form.name}</h1>
        <p style={{ opacity: 0.7, margin: 0 }}>Please fill out the form below.</p>
      </div>

      <FormRenderer fields={fields} onSubmit={handleSubmit} submitting={submitting} />
    </Container>
  );
}
