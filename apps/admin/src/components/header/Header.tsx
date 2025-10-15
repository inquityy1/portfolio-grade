import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '@portfolio-grade/app-state';
import { setToken, api, clearOrg } from '@portfolio-grade/app-state';
import { Button, NavButton } from '@portfolio-grade/ui-kit';
import { useEffect, useState } from 'react';
import type { UserWithMemberships } from './Header.types';
import { fetchUserRoles, hasAdminRights } from './Header.utils';

export default function Header() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const token = useSelector((s: RootState) => s.auth.token);
  const [user, setUser] = useState<UserWithMemberships | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
      <Link to='/' style={{ textDecoration: 'none', color: 'inherit', marginRight: 8 }}>
        <strong>Admin</strong>
      </Link>

      {(!loading && canAccessAdmin) || (token && !loading) ? (
        <nav style={{ display: 'flex', gap: 8 }}>
          <NavButton to='/admin-jobs'>Admin Jobs</NavButton>
          <NavButton to='/audit-logs'>Audit Logs</NavButton>
          <NavButton to='/create-user'>Create New User</NavButton>
          <NavButton to='/create-organization'>Create New Org</NavButton>
        </nav>
      ) : null}

      <div style={{ marginLeft: 'auto' }}>
        {(!loading && canAccessAdmin) || (token && !loading) ? (
          <Button onClick={logout}>Logout</Button>
        ) : null}
      </div>

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
