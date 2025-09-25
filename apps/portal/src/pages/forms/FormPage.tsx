import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import FormRenderer from '../../components/formRenderer/FormRenderer';
import { Container, LoadingContainer, Alert } from '@portfolio-grade/ui-kit';

type FieldModel = {
    id: string;
    label: string;
    type: 'input' | 'textarea' | 'select' | 'checkbox' | string;
    order?: number | null;
    config?: Record<string, unknown> | null;
};

function base(path: string) {
    const B = String(import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
    return /\/api$/.test(B) ? `${B}${path}` : `${B}/api${path}`;
}
const slug = (s: string) => s.trim().toLowerCase().replace(/\s+/g, '_');

export default function FormPage() {
    const { id } = useParams<{ id: string }>();
    const nav = useNavigate();
    const [form, setForm] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const token = localStorage.getItem('token') || localStorage.getItem('accessToken') || '';
    const orgId = localStorage.getItem('orgId') || localStorage.getItem('orgid') || '';

    useEffect(() => {
        if (!id) return;
        (async () => {
            try {
                setLoading(true); setErr(null);
                const headers: Record<string, string> = { Accept: 'application/json' };
                if (token) headers.Authorization = `Bearer ${token}`;
                if (orgId) headers['x-org-id'] = orgId;
                const { data } = await axios.get(base(`/public/forms/${id}`), { headers });
                setForm(data);
            } catch (e: any) {
                const s = e?.response?.status;
                if (s === 401 || s === 403) { nav('/login', { replace: true }); return; }
                setErr(e?.response?.data?.message || e.message || 'Failed to load form');
            } finally {
                setLoading(false);
            }
        })();
    }, [id, token, orgId, nav]);

    // Prefer DB fields; fallback to JSON schema
    const fields: FieldModel[] = useMemo(() => {
        if (!form) return [];
        const dbFields: any[] = Array.isArray(form.fields) ? form.fields : [];
        if (dbFields.length > 0) {
            return dbFields
                .map((f: any, i: number) => ({
                    id: String(f.id ?? i),
                    label: String(f.label ?? `Field ${i + 1}`),
                    type: (String(f.type ?? 'input').toLowerCase() as FieldModel['type']),
                    order: typeof f.order === 'number' ? f.order : i + 1,
                    config: { ...(f.config ?? {}), name: (f.config?.name as string) || slug(String(f.label ?? `field_${i + 1}`)) },
                }))
                .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        }
        const props = form?.schema?.properties ?? {};
        return Object.keys(props).map((key, i) => {
            const def = props[key] ?? {};
            const typeStr = String(def?.type ?? 'string').toLowerCase();
            const isTA = typeStr === 'string' && (def?.format === 'multiline' || /message|comment|description/i.test(key));
            return {
                id: key,
                label: def?.title || key[0].toUpperCase() + key.slice(1),
                type: isTA ? 'textarea' : 'input',
                order: i + 1,
                config: { name: key, placeholder: def?.description || '' },
            };
        });
    }, [form]);

    async function handleSubmit(values: Record<string, unknown>) {
        if (!id) return;
        try {
            setSubmitting(true);
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                'Idempotency-Key': `submit:${id}:${Date.now()}:${Math.random().toString(36).slice(2)}`
            };
            if (token) headers.Authorization = `Bearer ${token}`;
            if (orgId) headers['x-org-id'] = orgId;

            // backend expects { data: {...} }
            await axios.post(base(`/public/forms/${id}/submit`), { data: values }, { headers });
            nav('/', { replace: true });
        } catch (e: any) {
            setErr(e?.response?.data?.message || e.message || 'Submit failed');
        } finally {
            setSubmitting(false);
        }
    }

    if (loading) return <LoadingContainer>Loading…</LoadingContainer>;
    if (err) return <Alert variant="error">{err}</Alert>;
    if (!form) return <div style={{ padding: 24 }}>Form not found</div>;

    return (
        <Container maxWidth="720px">
            <h1 style={{ marginBottom: 8 }}>{form.name ?? 'Form'}</h1>
            <p style={{ opacity: 0.7, marginBottom: 16, fontSize: 12 }}>ID: {form.id}</p>
            {fields.length === 0
                ? <div>No fields to render.</div>
                : <FormRenderer fields={fields} onSubmit={handleSubmit} submitting={submitting} />
            }
        </Container>
    );
}