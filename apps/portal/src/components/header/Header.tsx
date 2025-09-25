import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '@portfolio-grade/app-state';
import { setToken, clearOrg, api } from '@portfolio-grade/app-state';
import { Button } from '@portfolio-grade/ui-kit';

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

    const logout = () => {
        dispatch(setToken(null));
        dispatch(clearOrg());
        dispatch(api.util.resetApiState());
        navigate('/login', { replace: true });
    };

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
            <div style={{ marginLeft: 'auto' }}>
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