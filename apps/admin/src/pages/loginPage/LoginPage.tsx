import { useState } from 'react';
import axios from 'axios';
import { useDispatch, useSelector } from 'react-redux';
import { Navigate, useNavigate } from 'react-router-dom';
import { useLoginMutation, setToken, setOrg } from '@portfolio-grade/app-state';
import type { RootState } from '@portfolio-grade/app-state';
import { Button, Label, Input, Field, Container, Alert } from '@portfolio-grade/ui-kit';

function api(path: string) {
  const B = String(import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '');
  return /\/api$/.test(B) ? `${B}${path}` : `${B}/api${path}`;
}

export default function AdminLoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const token = useSelector((s: RootState) => s.auth.token);
  const [email, setEmail] = useState('adminA@example.com');
  const [password, setPassword] = useState('admin123');
  const [login, { isLoading }] = useLoginMutation();
  const [error, setError] = useState<string | null>(null);

  if (token) return <Navigate to='/' replace />;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    try {
      // 1) get JWT
      const { access_token } = await login({ email, password }).unwrap();

      // 2) resolve orgId and check user roles
      let orgId: string | undefined;

      // Try /auth/me to get user data and roles
      const me = await axios
        .get(api('/auth/me'), {
          headers: { Accept: 'application/json', Authorization: `Bearer ${access_token}` },
        })
        .then(r => r.data)
        .catch(() => null);

      const first = me?.memberships?.[0];
      if (first?.organizationId) {
        orgId = String(first.organizationId);
      }

      // Check if user has admin/editor role
      const hasAdminRole = me?.memberships?.some(
        (membership: any) => membership.role === 'Editor' || membership.role === 'OrgAdmin',
      );

      if (!hasAdminRole) {
        setError('Access denied. Only Editors and OrgAdmins can access the admin panel.');
        return;
      }

      if (orgId) {
        dispatch(setOrg(orgId));
        localStorage.setItem('orgId', orgId);
      }

      // Store token
      dispatch(setToken(access_token));
      localStorage.setItem('token', access_token);

      navigate('/', { replace: true });
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err.message || 'Login failed';
      setError(errorMessage);
    }
  }

  return (
    <Container maxWidth='360px'>
      <h1>Admin Login</h1>
      <p style={{ marginBottom: 24, opacity: 0.8 }}>
        Only Editors and OrgAdmins can access the admin panel.
      </p>

      {error && <Alert style={{ marginBottom: 16, color: 'tomato' }}>{error}</Alert>}

      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12 }}>
        <Field>
          <Label>Email</Label>
          <Input
            placeholder='email'
            value={email}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
          />
        </Field>

        <Field>
          <Label>Password</Label>
          <Input
            placeholder='password'
            type='password'
            value={password}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
          />
        </Field>

        <Button type='submit' disabled={isLoading}>
          {isLoading ? 'Logging in…' : 'Login to Admin'}
        </Button>
      </form>

      <div style={{ marginTop: 24, textAlign: 'center' }}>
        <Button variant='outline' onClick={() => (window.location.href = 'http://localhost:4201')}>
          Back to Portal
        </Button>
      </div>
    </Container>
  );
}
