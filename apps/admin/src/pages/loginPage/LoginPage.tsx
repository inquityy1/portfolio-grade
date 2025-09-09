import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { setToken, setOrg, useLoginMutation } from '@portfolio-grade/app-state'
import type { RootState } from '@portfolio-grade/app-state'
import { Navigate } from 'react-router-dom'
import { Button, Input, Label, Field } from '@portfolio-grade/ui-kit'

export default function LoginPage() {
    const dispatch = useDispatch()
    const token = useSelector((s: RootState) => s.auth.token)
    const [email, setEmail] = useState('adminA@example.com')
    const [password, setPassword] = useState('admin123')
    const [login, { isLoading }] = useLoginMutation()

    if (token) return <Navigate to="/" replace />

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault()
        const { access_token } = await login({ email, password }).unwrap()
        dispatch(setToken(access_token))

        const base = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api'
        const me = await fetch(`${base}/auth/me`, {
            headers: { Authorization: `Bearer ${access_token}` },
        }).then((r) => r.json())

        const first = me?.memberships?.[0]
        if (first?.organizationId) dispatch(setOrg(first.organizationId))
    }

    return (
        <div style={{ padding: 24, maxWidth: 380 }}>
            <h1>Admin Login</h1>
            <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12 }}>
                <Field>
                    <Label>Email</Label>
                    <Input value={email} onChange={(e) => setEmail(e.target.value)} />
                </Field>
                <Field>
                    <Label>Password</Label>
                    <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                </Field>
                <Button type="submit" disabled={isLoading}>{isLoading ? 'Logging in…' : 'Login'}</Button>
            </form>
        </div>
    )
}