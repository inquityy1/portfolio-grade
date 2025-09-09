import { useState } from 'react';
import { useLoginMutation } from '@portfolio-grade/app-state';
import { setToken, setOrg } from '@portfolio-grade/app-state';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '@portfolio-grade/app-state';
import { Navigate } from 'react-router-dom';
import { Button, Label, Input, Field } from '@portfolio-grade/ui-kit';

export default function LoginPage() {
    const dispatch = useDispatch();
    const token = useSelector((s: RootState) => s.auth.token);
    const [email, setEmail] = useState('adminA@example.com');
    const [password, setPassword] = useState('123456');
    const [login, { isLoading }] = useLoginMutation();

    if (token) return <Navigate to="/" replace />;

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        try {
            const { access_token } = await login({ email, password }).unwrap();
            dispatch(setToken(access_token));
            // fetch /auth/me to get orgs/roles
            const base = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';
            const me = await fetch(`${base}/auth/me`, {
                headers: { Authorization: `Bearer ${access_token}` },
            }).then((r) => r.json());

            const first = me?.memberships?.[0];
            if (first?.organizationId) {
                dispatch(setOrg(first.organizationId));
            }
        } catch (err) {
            alert('Login failed');
            console.error(err);
        }
    }

    return (
        <div style={{ padding: 24, maxWidth: 360 }}>
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
        </div>
    );
}