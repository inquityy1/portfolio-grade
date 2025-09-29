import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '@portfolio-grade/app-state';
import { setToken, clearOrg, api } from '@portfolio-grade/app-state';
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
        const { data } = await axios.get(`${apiBase()}/auth/me`, { headers });
        return data;
    } catch {
        return null;
    }
}

function apiBase() {
    const B = String(import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '');
    return /\/api$/.test(B) ? B : `${B}/api`;
}

function hasAdminRights(memberships: Array<{ role: string }> | undefined): boolean {
    if (!memberships) return false;
    const roles = new Set(memberships.map((m) => m.role));
    return roles.has('Editor') || roles.has('OrgAdmin');
}

function NavButton({
    to,
    children,
}: {
    to: string;
    children: React.ReactNode;
}) {
    return (
        <NavLink
            to={to}
            end
            style={{ textDecoration: 'none' }}
            className={({ isActive }) => (isActive ? 'nav-active' : 'nav')}
        >
            {/* If your UI kit has variants, you can switch variant based on active */}
            <Button>{children}</Button>
        </NavLink>
    );
}

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
            <Link to="/" style={{ textDecoration: 'none', color: 'inherit', marginRight: 8 }}>
                <strong>Portal</strong>
            </Link>

            {/* center: nav */}
            <nav style={{ display: 'flex', gap: 8 }}>
                <NavButton to="/forms">Forms</NavButton>
                <NavButton to="/posts">Posts</NavButton>
                {/* add more later: <NavButton to="/tags">Tags</NavButton> … */}
            </nav>

            {/* right: auth actions */}
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                {!roleLoading && canAccessAdmin && (
                    <Button onClick={() => {
                        window.open('http://localhost:4200/login', '_blank');
                    }}>
                        Admin
                    </Button>
                )}
                {token ? (
                    <Button onClick={logout}>Logout</Button>
                ) : (
                    <Link to="/login" style={{ textDecoration: 'none' }}>
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