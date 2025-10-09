import { useEffect, useMemo, useState, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  Container,
  LoadingContainer,
  ErrorContainer,
} from '@portfolio-grade/ui-kit';

type FormSummary = {
  id: string;
  name: string;
  description?: string | null;
  status?: string | null;
  updatedAt?: string | null;
};

function api(path: string) {
  // Use Docker internal API URL for e2e tests, otherwise use VITE_API_URL
  const apiUrl =
    import.meta.env.E2E_API_URL || import.meta.env.VITE_API_URL || 'http://localhost:3000';
  const B = String(apiUrl).replace(/\/$/, '');
  return /\/api$/.test(B) ? `${B}${path}` : `${B}/api${path}`;
}

// --- role helpers (fetch roles from /auth/me endpoint) ---
type UserWithMemberships = {
  id: string;
  email: string;
  memberships: Array<{
    organizationId: string;
    role: string;
    organization: { name: string };
  }>;
};

async function fetchUserRoles(
  token: string | null,
  signal?: AbortSignal,
): Promise<UserWithMemberships | null> {
  if (!token) return null;
  try {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;

    const { data } = await axios.get(api('/auth/me'), { headers, signal });
    return data;
  } catch {
    return null;
  }
}

function hasEditorRights(memberships: Array<{ role: string }> | undefined): boolean {
  if (!memberships) return false;

  const roles = new Set(memberships.map(m => m.role));
  return roles.has('Editor') || roles.has('OrgAdmin');
}
// ---------------------------------------------------

export default function FormsListPage() {
  const nav = useNavigate();
  const location = useLocation();

  const token = localStorage.getItem('token') || localStorage.getItem('accessToken') || null;

  const orgId = localStorage.getItem('orgId') || localStorage.getItem('orgid') || '';

  const [user, setUser] = useState<UserWithMemberships | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);
  const canEdit = hasEditorRights(user?.memberships);

  const [items, setItems] = useState<FormSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [flashMessage, setFlashMessage] = useState<string | null>(null);
  const [formsLoading, setFormsLoading] = useState(false);

  // Request deduplication
  const formsRequestRef = useRef<AbortController | null>(null);
  const userRequestRef = useRef<AbortController | null>(null);
  const loadingRef = useRef(false);

  async function load() {
    // Cancel any existing request
    if (formsRequestRef.current) {
      formsRequestRef.current.abort();
    }

    const controller = new AbortController();
    formsRequestRef.current = controller;
    loadingRef.current = true;

    try {
      setError(null);
      setFormsLoading(true);

      const { data } = await axios.get(api('/forms'), {
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
          ...(orgId ? { 'x-org-id': orgId } : {}),
        },
        signal: controller.signal,
      });

      // Check if request was aborted
      if (controller.signal.aborted) return;

      const arr = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];

      setItems(
        arr.map((f: any) => ({
          id: String(f.id),
          name: String(f.name ?? 'Untitled'),
          description: f.description ?? null,
          status: f.status ?? (f.published ? 'published' : 'draft'),
          updatedAt: f.updatedAt ?? null,
        })),
      );
    } catch (e: any) {
      // Don't set error if request was aborted
      if (e.name === 'CanceledError' || e.name === 'AbortError') return;

      const s = e?.response?.status;
      if (s === 401 || s === 403) {
        nav('/login', { replace: true });
        return;
      }
      setItems([]);
      setError(e?.response?.data?.message || e.message || 'Failed to load forms');
    } finally {
      setFormsLoading(false);
      loadingRef.current = false;
      if (formsRequestRef.current === controller) {
        formsRequestRef.current = null;
      }
    }
  }

  useEffect(() => {
    if (!token) {
      nav('/login', { replace: true });
      return;
    }

    load();

    // Cleanup function to cancel requests on unmount
    return () => {
      if (formsRequestRef.current) {
        formsRequestRef.current.abort();
      }
    };
  }, [token, orgId]);

  // Fetch user roles
  useEffect(() => {
    if (!token) return;

    // Cancel any existing user request
    if (userRequestRef.current) {
      userRequestRef.current.abort();
    }

    const controller = new AbortController();
    userRequestRef.current = controller;

    (async () => {
      try {
        setRoleLoading(true);
        const userData = await fetchUserRoles(token, controller.signal);

        // Check if request was aborted
        if (controller.signal.aborted) return;

        setUser(userData);
      } catch (e: any) {
        // Don't set error if request was aborted
        if (e.name === 'CanceledError' || e.name === 'AbortError') return;

        console.error('Failed to fetch user roles:', e);
        setUser(null);
      } finally {
        setRoleLoading(false);
        if (userRequestRef.current === controller) {
          userRequestRef.current = null;
        }
      }
    })();

    // Cleanup function to cancel requests on unmount
    return () => {
      if (userRequestRef.current) {
        userRequestRef.current.abort();
      }
    };
  }, [token]);

  // Handle flash messages from navigation state
  useEffect(() => {
    if (location.state?.flash) {
      setFlashMessage(location.state.flash);
      // Clear the flash message after 0.5 seconds
      const timer = setTimeout(() => setFlashMessage(null), 1000);
      return () => clearTimeout(timer);
    }
  }, [location.state]);

  const isEmpty = useMemo(() => !items || items.length === 0, [items]);

  // --- CRUD UI actions ---
  function goCreate() {
    nav('/forms/new'); // page to implement
  }

  function goEdit(id: string) {
    nav(`/forms/${id}/edit`); // page to implement
  }

  async function onDelete(id: string) {
    if (!confirm('Delete this form?')) return;
    try {
      setBusyId(id);
      await axios.delete(api(`/forms/${id}`), {
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
          ...(orgId ? { 'x-org-id': orgId } : {}),
          'Idempotency-Key': `form:delete:${id}:${Date.now()}:${Math.random()
            .toString(36)
            .slice(2)}`,
        },
      });
      await load();
    } catch (e: any) {
      setError(e?.response?.data?.message || e.message || 'Failed to delete form');
    } finally {
      setBusyId(null);
    }
  }
  // ----------------------

  if (!token) return null;
  if (roleLoading) return <LoadingContainer>Loading user permissions…</LoadingContainer>;
  if (formsLoading) return <LoadingContainer>Loading forms…</LoadingContainer>;

  return (
    <Container>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12,
        }}
      >
        <div>
          <h1 style={{ marginBottom: 4 }}>Portal</h1>
          <p style={{ opacity: 0.7, margin: 0 }}>Pick a form to preview / fill.</p>
        </div>
        {canEdit && <Button onClick={goCreate}>Create new form</Button>}
      </div>

      {flashMessage && (
        <div
          style={{
            color: 'green',
            backgroundColor: '#e6ffe6',
            padding: 12,
            borderRadius: 8,
            marginBottom: 12,
            border: '1px solid #4caf50',
          }}
        >
          {flashMessage}
        </div>
      )}
      {error && <ErrorContainer>{error}</ErrorContainer>}
      {!error && (!items || items.length === 0) && <div>Sorry but there is no forms right now</div>}

      {items && items.length > 0 && !error && (
        <div
          style={{
            display: 'grid',
            gap: 16,
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          }}
        >
          {(items ?? []).map(f => (
            <Card key={f.id}>
              <Link to={`/forms/${f.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <CardHeader>
                  <CardTitle>{f.name}</CardTitle>
                  <span
                    style={{
                      fontSize: 12,
                      border: '1px solid #2e2e2e',
                      borderRadius: 999,
                      padding: '2px 8px',
                      opacity: 0.7,
                    }}
                  >
                    {f.status ?? 'draft'}
                  </span>
                </CardHeader>
                <CardContent>
                  {f.description ? (
                    <p style={{ margin: '8px 0 0', opacity: 0.7 }}>{f.description}</p>
                  ) : null}
                  {f.updatedAt ? (
                    <p style={{ margin: '8px 0 0', fontSize: 12, opacity: 0.6 }}>
                      Updated {new Date(f.updatedAt).toLocaleString()}
                    </p>
                  ) : null}
                </CardContent>
              </Link>

              {canEdit && (
                <CardFooter>
                  <Button onClick={() => goEdit(f.id)}>Edit</Button>
                  <Button onClick={() => onDelete(f.id)} disabled={busyId === f.id}>
                    {busyId === f.id ? 'Deleting…' : 'Delete'}
                  </Button>
                </CardFooter>
              )}
            </Card>
          ))}
        </div>
      )}
    </Container>
  );
}
