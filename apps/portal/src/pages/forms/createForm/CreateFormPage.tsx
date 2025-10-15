import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Label, Field, Textarea, Container, Alert } from '@portfolio-grade/ui-kit';
import { formatJsonSchema, validateFormData, createForm } from './CreateFormPage.utils';

export default function CreateFormPage() {
  const nav = useNavigate();
  const [name, setName] = useState('');
  const [schema, setSchema] = useState(
    '{\n  "type": "object",\n  "properties": {\n    "name": {\n      "type": "string",\n      "title": "Name"\n    },\n    "email": {\n      "type": "string",\n      "title": "Email",\n      "format": "email"\n    }\n  },\n  "required": ["name", "email"]\n}',
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleFormatJson() {
    const result = formatJsonSchema(schema);
    setSchema(result.formatted);
    setError(result.error);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const validation = validateFormData(name, schema);
    if (!validation.isValid) {
      setError(validation.error);
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const parsedSchema = JSON.parse(schema);
      const formData = {
        name: name.trim(),
        schema: parsedSchema,
      };

      const data = await createForm(formData);

      nav('/forms', {
        replace: true,
        state: { flash: `Form "${data.name}" created successfully! ✅` },
      });
    } catch (e: any) {
      const s = e?.response?.status;
      if (s === 401 || s === 403) {
        nav('/login', { replace: true });
        return;
      }
      setError(e?.response?.data?.message || e.message || 'Failed to create form');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Container maxWidth='800px'>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ marginBottom: 8 }}>Create New Form</h1>
        <p style={{ opacity: 0.7, margin: 0 }}>
          Create a new form with custom fields and validation.
        </p>
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
          <Button type='button' onClick={() => nav('/', { replace: true })} disabled={submitting}>
            Cancel
          </Button>
          <Button type='submit' disabled={submitting || !name.trim()}>
            {submitting ? 'Creating...' : 'Create Form'}
          </Button>
        </div>
      </form>
    </Container>
  );
}
