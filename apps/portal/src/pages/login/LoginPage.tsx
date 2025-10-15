import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Navigate, useNavigate } from 'react-router-dom';
import { useLoginMutation, setToken, setOrg } from '@portfolio-grade/app-state';
import type { RootState } from '@portfolio-grade/app-state';
import { Button, Label, Input, Field, Container } from '@portfolio-grade/ui-kit';
import { fetchUserProfile, extractOrganizationId, persistAuthData } from './LoginPage.utils';

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const token = useSelector((s: RootState) => s.auth.token);
  const [email, setEmail] = useState('adminA@example.com');
  const [password, setPassword] = useState('admin123');
  const [login, { isLoading }] = useLoginMutation();

  if (token) return <Navigate to='/' replace />;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      // 1) Get JWT token
      const { access_token } = await login({ email, password }).unwrap();

      // Persist token everywhere your app expects it
      dispatch(setToken(access_token));
      persistAuthData(access_token);

      // 2) Resolve orgId from user profile
      const userProfile = await fetchUserProfile(access_token);
      const orgId = extractOrganizationId(userProfile);

      if (orgId) {
        dispatch(setOrg(orgId));
        persistAuthData(access_token, orgId);
      }

      navigate('/', { replace: true });
    } catch (err) {
      alert('Login failed');
    }
  }

  return (
    <Container maxWidth='360px'>
      <h1>Portal Login</h1>
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
          {isLoading ? 'Logging in…' : 'Login'}
        </Button>
      </form>
    </Container>
  );
}
