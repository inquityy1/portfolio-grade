import { useState } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { Container, Button, Label, Input, Field, Alert } from '@portfolio-grade/ui-kit';
import type { RootState } from '@portfolio-grade/app-state';

function api(path: string) {
  // Use Docker internal API URL for e2e tests, otherwise use VITE_API_URL
  const apiUrl =
    import.meta.env.VITE_E2E_API_URL || import.meta.env.VITE_API_URL || 'http://localhost:3000';
  const B = String(apiUrl).replace(/\/$/, '');
  return /\/api$/.test(B) ? `${B}${path}` : `${B}/api${path}`;
}

export default function CreateOrganizationPage() {
  const token = useSelector((s: RootState) => s.auth.token);

  const [formData, setFormData] = useState({
    name: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!formData.name.trim()) {
      setError('Please enter an organization name');
      return;
    }

    if (formData.name.trim().length < 2) {
      setError('Organization name must be at least 2 characters long');
      return;
    }

    if (formData.name.trim().length > 100) {
      setError('Organization name must be at most 100 characters long');
      return;
    }

    setIsSubmitting(true);

    try {
      const actualToken = token || localStorage.getItem('token') || '';

      await axios.post(
        `${api('/organizations')}`,
        {
          name: formData.name.trim(),
        },
        {
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${actualToken}`,
          },
        },
      );

      setSuccess('Organization created successfully!');
      setFormData({ name: '' });
    } catch (err: any) {
      console.error('Failed to create organization:', err);
      setError(err?.response?.data?.message || err.message || 'Failed to create organization');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container>
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '2rem' }}>
        <h1>Create New Organization</h1>
        <p style={{ color: '#666', marginBottom: '2rem' }}>
          Create a new organization to manage users, posts, and forms.
        </p>

        {error && (
          <Alert variant='error' style={{ marginBottom: '1rem' }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert variant='success' style={{ marginBottom: '1rem' }}>
            {success}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Field>
            <Label>Organization Name *</Label>
            <Input
              type='text'
              value={formData.name}
              onChange={e => handleInputChange('name', e.target.value)}
              placeholder='Enter organization name'
              disabled={isSubmitting}
              required
            />
            <small style={{ color: '#666', marginTop: '0.5rem', display: 'block' }}>
              Organization name must be 2-100 characters long and can contain letters, numbers,
              spaces, hyphens, and underscores.
            </small>
          </Field>

          <div style={{ marginTop: '2rem' }}>
            <Button
              type='submit'
              disabled={isSubmitting || !formData.name.trim()}
              style={{ marginRight: '1rem' }}
            >
              {isSubmitting ? 'Creating...' : 'Create Organization'}
            </Button>
          </div>
        </form>
      </div>
    </Container>
  );
}
