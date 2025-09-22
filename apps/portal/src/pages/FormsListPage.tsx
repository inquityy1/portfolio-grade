import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

type FormSummary = {
    id: string;
    name: string;
    description?: string | null;
    status?: string | null;
    updatedAt?: string | null;
};

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

function apiUrl(base: string, path: string) {
    const b = base.replace(/\/$/, '');
    return /\/api$/.test(b) ? `${b}${path}` : `${b}/api${path}`;
}

export default function FormsListPage() {
    const [items, setItems] = useState<FormSummary[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // sequence counter to ignore stale responses
    const seqRef = useRef(0);

    const BASE = String(import.meta.env?.VITE_API_URL || '').replace(/\/$/, '');

    useEffect(() => {
        let aborted = false;
        const seq = ++seqRef.current; // current run id
        const controller = new AbortController();

        async function run() {
            try {
                if (!BASE) {
                    throw new Error('API not configured (VITE_API_URL)');
                }

                // small visual delay
                await delay(100);

                // read auth synchronously from localStorage
                const token =
                    localStorage.getItem('accessToken') ||
                    localStorage.getItem('token') ||
                    undefined;

                let orgId =
                    localStorage.getItem('orgId') ||
                    (() => {
                        try {
                            const raw = localStorage.getItem('org');
                            if (!raw) return undefined;
                            const o = JSON.parse(raw);
                            return o?.id || o?.organizationId || o?.slug;
                        } catch {
                            return undefined;
                        }
                    })() ||
                    undefined;

                // resolve org via /auth/me if missing but we do have a token
                if (!orgId && token) {
                    try {
                        const { data: me } = await axios.get(apiUrl(BASE, '/auth/me'), {
                            headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
                            signal: controller.signal,
                        });
                        orgId =
                            me?.organizationId ||
                            me?.orgId ||
                            me?.organization?.id ||
                            me?.memberships?.[0]?.organizationId;
                        if (orgId) localStorage.setItem('orgId', String(orgId));
                    } catch (e: any) {
                        // If this request was aborted due to StrictMode remount, just exit quietly
                        if (e?.name === 'CanceledError' || e?.name === 'AbortError') return;
                        // Not fatal—some backends require org for /auth/me as well.
                    }
                }

                const headers: Record<string, string> = { Accept: 'application/json' };
                if (token) headers.Authorization = `Bearer ${token}`;
                if (orgId) headers['x-org-id'] = String(orgId);

                const { data } = await axios.get(apiUrl(BASE, '/forms'), {
                    headers,
                    signal: controller.signal,
                });

                // ignore stale results from an older run (StrictMode)
                if (seqRef.current !== seq || aborted) return;

                const arr = Array.isArray(data?.items) ? data.items : (Array.isArray(data) ? data : []);
                const mapped: FormSummary[] = arr.map((f: any) => ({
                    id: String(f.id ?? f.uuid ?? f._id),
                    name: String(f.name ?? f.title ?? 'Untitled Form'),
                    description: f.description ?? null,
                    status: f.status ?? (f.published ? 'published' : 'draft'),
                    updatedAt: f.updatedAt ?? f.updated_at ?? null,
                }));

                setItems(mapped);
                setError(null);
            } catch (e: any) {
                if (e?.name === 'CanceledError' || e?.name === 'AbortError') return; // ignored; next mount will handle
                setItems([]); // ensure we exit loading and show empty state / error
                setError(e?.response?.data?.message || e.message || 'Failed to load forms');
            } finally {
                // only the latest, non-aborted run turns loading off
                if (seqRef.current === seq && !aborted) setLoading(false);
            }
        }

        run();

        return () => {
            aborted = true;
            controller.abort(); // cancel in-flight requests from this run
        };
    }, [BASE]);

    const isEmpty = useMemo(() => !loading && items.length === 0 && !error, [loading, items, error]);

    if (loading) return <div style={{ padding: 24 }}>Loading…</div>;

    return (
        <section style={{ padding: 24 }}>
            <h1 style={{ marginBottom: 8 }}>Portal</h1>
            <p style={{ opacity: 0.7, marginBottom: 16 }}>Pick a form to preview / fill.</p>

            {error && <div style={{ color: 'orange', marginBottom: 12 }}>{error}</div>}
            {isEmpty && <div style={{ opacity: 0.85 }}>Sorry but there is no forms right now</div>}

            {!isEmpty && !error && (
                <ul style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
                    {items.map((f) => (
                        <li key={f.id} style={{ border: '1px solid #2e2e2e', borderRadius: 16, padding: 16 }}>
                            <Link to={`/forms/${f.id}`} style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                                    <h3 style={{ margin: 0 }}>{f.name}</h3>
                                    <span style={{ fontSize: 12, border: '1px solid #2e2e2e', borderRadius: 999, padding: '2px 8px', opacity: 0.7 }}>
                                        {f.status ?? 'draft'}
                                    </span>
                                </div>
                                {f.description ? <p style={{ margin: '8px 0 0', opacity: 0.7 }}>{f.description}</p> : null}
                                {f.updatedAt ? (
                                    <p style={{ margin: '8px 0 0', fontSize: 12, opacity: 0.6 }}>
                                        Updated {new Date(f.updatedAt).toLocaleString()}
                                    </p>
                                ) : null}
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}