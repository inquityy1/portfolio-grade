import { useEffect, useMemo, useState, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
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
import {
  fetchForms,
  fetchUserRoles,
  hasAdminRights,
  formatDate,
  deleteForm,
} from './FormsListPage.utils';
import type { FormSummary, UserWithMemberships } from './FormsListPage.types';

export default function FormsListPage() {
  const nav = useNavigate();
  const location = useLocation();
  const [forms, setForms] = useState<FormSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<UserWithMemberships | null>(null);
  const [showFlash, setShowFlash] = useState(true);
  const [deletingFormId, setDeletingFormId] = useState<string | null>(null);
  const flashRef = useRef<HTMLDivElement>(null);

  const flashMessage = useMemo(() => {
    const state = location.state as { flash?: string } | null;
    return state?.flash || null;
  }, [location.state]);

  const isAdmin = useMemo(() => hasAdminRights(user?.memberships), [user?.memberships]);

  useEffect(() => {
    if (flashMessage && flashRef.current) {
      flashRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [flashMessage]);

  // Auto-dismiss flash message after 1 second
  useEffect(() => {
    if (flashMessage) {
      const timer = setTimeout(() => {
        setShowFlash(false);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [flashMessage]);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem('token') || localStorage.getItem('accessToken') || '';

        // Load forms and user data in parallel
        const [formsData, userData] = await Promise.all([fetchForms(), fetchUserRoles(token)]);

        setForms(formsData);
        setUser(userData);
      } catch (e: any) {
        const s = e?.response?.status;
        if (s === 401 || s === 403) {
          nav('/login', { replace: true });
          return;
        }
        setError(e?.response?.data?.message || e.message || 'Failed to load forms');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [nav]);

  async function handleDeleteForm(formId: string, formName: string) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${formName}"? This action cannot be undone and will permanently remove the form and all its submissions.`,
    );

    if (!confirmed) return;

    try {
      setDeletingFormId(formId);
      await deleteForm(formId);

      // Remove the form from the local state
      setForms(prevForms => prevForms.filter(form => form.id !== formId));

      // Show success message
      nav('/forms', {
        replace: true,
        state: { flash: `Form "${formName}" deleted successfully! ✅` },
      });
    } catch (e: any) {
      const s = e?.response?.status;
      if (s === 401 || s === 403) {
        nav('/login', { replace: true });
        return;
      }
      alert(e?.response?.data?.message || e.message || 'Failed to delete form');
    } finally {
      setDeletingFormId(null);
    }
  }

  if (loading) {
    return (
      <Container maxWidth='1200px'>
        <LoadingContainer>Loading forms...</LoadingContainer>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth='1200px'>
        <ErrorContainer>{error}</ErrorContainer>
      </Container>
    );
  }

  return (
    <Container maxWidth='1200px'>
      <div style={{ marginBottom: 24 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
          }}
        >
          <div>
            <h1 style={{ marginBottom: 8 }}>Forms</h1>
            <p style={{ opacity: 0.7, margin: 0 }}>Manage and view all available forms.</p>
          </div>
          {isAdmin && <Button onClick={() => nav('/forms/create')}>Create New Form</Button>}
        </div>

        {flashMessage && showFlash && (
          <div
            ref={flashRef}
            style={{
              padding: 12,
              backgroundColor: '#d4edda',
              border: '1px solid #c3e6cb',
              borderRadius: 4,
              color: '#155724',
              marginBottom: 16,
            }}
          >
            {flashMessage}
          </div>
        )}
      </div>

      {forms.length === 0 ? (
        <Card>
          <CardContent>
            <div style={{ textAlign: 'center', padding: 40 }}>
              <h3 style={{ marginBottom: 8 }}>No forms available</h3>
              <p style={{ opacity: 0.7, marginBottom: 16 }}>
                {isAdmin
                  ? 'Create your first form to get started.'
                  : 'No forms have been created yet.'}
              </p>
              {isAdmin && (
                <Button onClick={() => nav('/forms/create')}>Create Your First Form</Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 16,
          }}
        >
          {forms.map(form => (
            <Card key={form.id}>
              <CardHeader>
                <CardTitle>{form.name}</CardTitle>
              </CardHeader>
              <CardContent>
                {form.description && (
                  <p style={{ opacity: 0.7, marginBottom: 12 }}>{form.description}</p>
                )}
                <div style={{ fontSize: 12, opacity: 0.6 }}>
                  Last updated: {formatDate(form.updatedAt)}
                </div>
                {form.status && (
                  <div style={{ fontSize: 12, opacity: 0.6, marginTop: 4 }}>
                    Status: {form.status}
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <div style={{ display: 'flex', gap: 8, width: '100%' }}>
                  <Link to={`/forms/${form.id}`} style={{ flex: 1 }}>
                    <Button
                      style={{
                        width: '100%',
                        border: '1px solid #ccc',
                        backgroundColor: 'transparent',
                      }}
                    >
                      View Form
                    </Button>
                  </Link>
                  {isAdmin && (
                    <>
                      <Link to={`/forms/${form.id}/edit`} style={{ flex: 1 }}>
                        <Button
                          style={{
                            width: '100%',
                            border: '1px solid #ccc',
                            backgroundColor: 'transparent',
                          }}
                        >
                          Edit
                        </Button>
                      </Link>
                      <Button
                        style={{
                          width: '100%',
                          color: '#dc3545',
                          borderColor: '#dc3545',
                          border: '1px solid #dc3545',
                          backgroundColor: 'transparent',
                          flex: 1,
                        }}
                        onClick={() => handleDeleteForm(form.id, form.name)}
                        disabled={deletingFormId === form.id}
                      >
                        {deletingFormId === form.id ? 'Deleting...' : 'Delete'}
                      </Button>
                    </>
                  )}
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </Container>
  );
}
