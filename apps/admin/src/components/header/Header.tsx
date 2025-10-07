import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '@portfolio-grade/app-state';
import { setToken, api, clearOrg } from '@portfolio-grade/app-state';
import { Button } from '@portfolio-grade/ui-kit';
import { useEffect, useState } from 'react';
import axios from 'axios';

type Membership = {
  organizationId: string;
  role: string;
  organization: { name: string };
};

type UserWithMemberships = {
  id: string;
  email: string;
  memberships: Membership[];
};

async function fetchUserRoles(token: string | null): Promise<UserWithMemberships | null> {
  if (!token) return null;
  try {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;

    // Add orgId header if available
    const orgId = typeof localStorage !== 'undefined' ? localStorage.getItem('orgId') : null;
    if (orgId) headers['x-org-id'] = orgId;

    const { data } = await axios.get(`${apiBase()}/auth/me`, { headers });
    return data;
  } catch (error) {
    return null;
  }
}

function apiBase() {
  const B = String(import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '');
  return /\/api$/.test(B) ? B : `${B}/api`;
}

function hasAdminRights(memberships: Array<{ role: string }> | undefined): boolean {
  if (!memberships) return false;
  const roles = new Set(memberships.map(m => m.role));
  return roles.has('Editor') || roles.has('OrgAdmin');
}

function NavButton({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      end
      style={{ textDecoration: 'none' }}
      className={({ isActive }) => (isActive ? 'nav-active' : 'nav')}
    >
      <Button>{children}</Button>
    </NavLink>
  );
}

export default function Header() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const token = useSelector((s: RootState) => s.auth.token);
  const [user, setUser] = useState<UserWithMemberships | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Ensure token is loaded from localStorage into Redux store
    const localStorageToken =
      typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
    if (localStorageToken && !token) {
      dispatch(setToken(localStorageToken));
    }

    const actualToken = token || localStorageToken;

    if (!actualToken) {
      setUser(null);
      setLoading(false);
      return;
    }

    (async () => {
      try {
        setLoading(true);
        const userData = await fetchUserRoles(actualToken);
        setUser(userData);
      } catch (e) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [token, dispatch]);

  const logout = () => {
    dispatch(setToken(null));
    dispatch(clearOrg());
    dispatch(api.util.resetApiState());
    navigate('/login');
  };

  const canAccessAdmin = hasAdminRights(user?.memberships);

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 16px',
        borderBottom: '1px solid #2e2e2e',
      }}
    >
      {/* left: app logo / title */}
      <Link to='/' style={{ textDecoration: 'none', color: 'inherit', marginRight: 8 }}>
        <strong>Admin</strong>
      </Link>

      {/* center: nav - show if user has admin rights OR if we have a token (fallback) */}
      {(!loading && canAccessAdmin) || (token && !loading) ? (
        <nav style={{ display: 'flex', gap: 8 }}>
          <NavButton to='/admin-jobs'>Admin Jobs</NavButton>
          <NavButton to='/audit-logs'>Audit Logs</NavButton>
          <NavButton to='/create-user'>Create New User</NavButton>
          <NavButton to='/create-organization'>Create New Org</NavButton>
        </nav>
      ) : null}

      {/* right: auth actions */}
      <div style={{ marginLeft: 'auto' }}>
        {(!loading && canAccessAdmin) || (token && !loading) ? (
          <Button onClick={logout}>Logout</Button>
        ) : null}
      </div>

      {/* very small inline styles to "shine" the active link */}
      <style>
        {`
        .nav button {
          opacity: 0.85;
        }
        .nav-active button {
          outline: 2px solid rgba(255,255,255,0.25);
          opacity: 1;
        }
      `}
      </style>
    </header>
  );
}
