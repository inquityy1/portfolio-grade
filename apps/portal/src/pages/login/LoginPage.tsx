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

export default function LoginPage() {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const token = useSelector((s: RootState) => s.auth.token);
    const [email, setEmail] = useState('adminA@example.com');
    const [password, setPassword] = useState('admin123');
    const [login, { isLoading }] = useLoginMutation();

    if (token) return <Navigate to="/" replace />;

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        try {
            // 1) get JWT
            const { access_token } = await login({ email, password }).unwrap();

            // persist token everywhere your app expects it
            dispatch(setToken(access_token));
            localStorage.setItem('token', access_token);

            // 2) resolve orgId (from login response if enriched; else via /auth/me)
            let orgId: string | undefined;

            // Try /auth/me (no x-org-id needed)
            const me = await axios
                .get(api('/auth/me'), {
                    headers: { Accept: 'application/json', Authorization: `Bearer ${access_token}` },
                })
                .then((r) => r.data)
                .catch(() => null);

            const first = me?.memberships?.[0];
            if (first?.organizationId) {
                orgId = String(first.organizationId);
            }

            if (orgId) {
                dispatch(setOrg(orgId));
                localStorage.setItem('orgId', orgId);
            }

            navigate('/', { replace: true });
        } catch (err) {
            alert('Login failed');
        }
    }

    return (
        <Container maxWidth="360px">
            <h1>Portal Login</h1>
            <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12 }}>
                <Field>
                    <Label>Email</Label>
                    <Input
                        placeholder="email"
                        value={email}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                    />
                </Field>

                <Field>
                    <Label>Password</Label>
                    <Input
                        placeholder="password"
                        type="password"
                        value={password}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                    />
                </Field>

                <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Logging in…' : 'Login'}
                </Button>
            </form>
        </Container>
    );
}