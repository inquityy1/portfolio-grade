import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '@portfolio-grade/app-state';
import { setToken, clearOrg, api } from '@portfolio-grade/app-state';
import { Button, NavButton } from '@portfolio-grade/ui-kit';
import { useEffect, useState } from 'react';
import type { UserWithMemberships } from './Header.types';
import { fetchUserRoles, hasAdminRights } from './Header.utils';

export default function Header() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const token = useSelector((s: RootState) => s.auth.token);
  const [user, setUser] = useState<UserWithMemberships | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);

  // Fetch user roles
  useEffect(() => {
    if (!token) {
      setUser(null);
      setRoleLoading(false);
      return;
    }

    (async () => {
      try {
        setRoleLoading(true);
        const userData = await fetchUserRoles(token);
        setUser(userData);
      } catch (e) {
        setUser(null);
      } finally {
        setRoleLoading(false);
      }
    })();
  }, [token]);

  const logout = () => {
    dispatch(setToken(null));
    dispatch(clearOrg());
    dispatch(api.util.resetApiState());
    navigate('/login', { replace: true });
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
        <strong>Portal</strong>
      </Link>

      {/* center: nav */}
      <nav style={{ display: 'flex', gap: 8 }}>
        <NavButton to='/forms'>Forms</NavButton>
        <NavButton to='/posts'>Posts</NavButton>
        {/* add more later: <NavButton to="/tags">Tags</NavButton> … */}
      </nav>

      {/* right: auth actions */}
      <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
        {!roleLoading && canAccessAdmin && (
          <Button
            onClick={() => {
              window.open('http://localhost:4200/login', '_blank');
            }}
          >
            Admin
          </Button>
        )}
        {token ? (
          <Button onClick={logout}>Logout</Button>
        ) : (
          <Link to='/login' style={{ textDecoration: 'none' }}>
            <Button>Login</Button>
          </Link>
        )}
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
