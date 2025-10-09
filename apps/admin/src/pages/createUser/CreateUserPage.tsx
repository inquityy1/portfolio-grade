import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { Container, Button, Label, Input, Field, Select, Alert } from '@portfolio-grade/ui-kit';
import type { RootState } from '@portfolio-grade/app-state';

function api(path: string) {
  // Use Docker internal API URL for e2e tests, otherwise use VITE_API_URL
  const apiUrl =
    import.meta.env.VITE_E2E_API_URL || import.meta.env.VITE_API_URL || 'http://localhost:3000';
  const B = String(apiUrl).replace(/\/$/, '');
  return /\/api$/.test(B) ? `${B}${path}` : `${B}/api${path}`;
}

import type { Role } from '@portfolio-grade/shared';

interface Organization {
  id: string;
  name: string;
}

export default function CreateUserPage() {
  const token = useSelector((s: RootState) => s.auth.token);
  const orgId = useSelector((s: RootState) => s.tenant.orgId);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'Viewer' as Role,
    organizationId: '',
  });
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingOrgs, setIsLoadingOrgs] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load organizations on component mount
  useEffect(() => {
    const loadOrganizations = async () => {
      setIsLoadingOrgs(true);
      try {
        const actualToken = token || localStorage.getItem('token') || '';
        const response = await axios.get(`${api('/organizations')}`, {
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${actualToken}`,
          },
        });
        setOrganizations(response.data);

        // Set default organization to current org if available
        if (orgId && response.data.length > 0) {
          const currentOrg = response.data.find((org: Organization) => org.id === orgId);
          if (currentOrg) {
            setFormData(prev => ({ ...prev, organizationId: currentOrg.id }));
          }
        }
      } catch (err) {
        console.error('Failed to load organizations:', err);
        setError('Failed to load organizations');
      } finally {
        setIsLoadingOrgs(false);
      }
    };

    loadOrganizations();
  }, [token, orgId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!formData.email || !formData.password || !formData.name || !formData.organizationId) {
      setError('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      // Get token and orgId from Redux or localStorage as fallback
      const actualToken = token || localStorage.getItem('token') || '';
      const actualOrgId = orgId || localStorage.getItem('orgId') || '';

      await axios.post(
        `${api('/users')}`,
        {
          email: formData.email,
          password: formData.password,
          name: formData.name,
          role: formData.role,
          organizationId: formData.organizationId,
        },
        {
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${actualToken}`,
            'x-org-id': actualOrgId,
            'idempotency-key': `create-user-${Date.now()}-${Math.random()
              .toString(36)
              .substr(2, 9)}`,
          },
        },
      );

      setSuccess(
        `User ${formData.name} (${formData.email}) created successfully with ${formData.role} role!`,
      );
      setFormData({ email: '', password: '', name: '', role: 'Viewer', organizationId: '' });

      // Auto-hide success message after 1 second
      setTimeout(() => {
        setSuccess(null);
      }, 1000);
    } catch (err: any) {
      let errorMessage = err?.response?.data?.message || err.message || 'Failed to create user';

      // Handle specific error cases
      if (
        err.response?.status === 409 ||
        errorMessage.includes('already exists') ||
        errorMessage.includes('unique constraint')
      ) {
        errorMessage = 'This email is already registered';
      }

      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
    setSuccess(null);
  };

  return (
    <Container maxWidth='600px'>
      <h1>Create New User</h1>
      <p>Add a new user to your organization with appropriate role permissions.</p>

      {error && <Alert style={{ marginBottom: 16, color: 'tomato' }}>{error}</Alert>}

      {success && <Alert style={{ marginBottom: 16, color: 'green' }}>{success}</Alert>}

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 16 }}>
        <Field>
          <Label>Email Address *</Label>
          <Input
            type='email'
            placeholder='user@example.com'
            value={formData.email}
            onChange={e => handleInputChange('email', e.target.value)}
          />
        </Field>

        <Field>
          <Label>Full Name *</Label>
          <Input
            type='text'
            placeholder='John Doe'
            value={formData.name}
            onChange={e => handleInputChange('name', e.target.value)}
          />
        </Field>

        <Field>
          <Label>Password *</Label>
          <Input
            type='password'
            placeholder='Minimum 6 characters'
            value={formData.password}
            onChange={e => handleInputChange('password', e.target.value)}
          />
        </Field>

        <Field>
          <Label>Role *</Label>
          <Select value={formData.role} onChange={e => handleInputChange('role', e.target.value)}>
            <option value='Viewer'>Viewer - Can view content only</option>
            <option value='Editor'>Editor - Can create and edit content</option>
            <option value='OrgAdmin'>OrgAdmin - Full administrative access</option>
          </Select>
        </Field>

        <Field>
          <Label>Organization *</Label>
          <Select
            value={formData.organizationId}
            onChange={e => handleInputChange('organizationId', e.target.value)}
            disabled={isLoadingOrgs}
          >
            <option value=''>Select an organization...</option>
            {organizations.map(org => (
              <option key={org.id} value={org.id}>
                {org.name}
              </option>
            ))}
          </Select>
          {isLoadingOrgs && <small>Loading organizations...</small>}
        </Field>

        <Button type='submit' disabled={isSubmitting}>
          {isSubmitting ? 'Creating User...' : 'Create User'}
        </Button>
      </form>

      <div style={{ marginTop: 24, padding: 16, backgroundColor: 'black', borderRadius: 8 }}>
        <h4>Role Permissions:</h4>
        <ul style={{ margin: 8, paddingLeft: 20 }}>
          <li>
            <strong>Viewer:</strong> Can view posts, forms, and comments
          </li>
          <li>
            <strong>Editor:</strong> Can create/edit posts, manage tags, view admin panel
          </li>
          <li>
            <strong>OrgAdmin:</strong> Full access including user management and system settings
          </li>
        </ul>
      </div>
    </Container>
  );
}
