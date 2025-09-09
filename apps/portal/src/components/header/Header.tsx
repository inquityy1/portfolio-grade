import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import type { RootState } from '@portfolio-grade/app-state'
import { setToken } from '@portfolio-grade/app-state'
import { Button } from '@portfolio-grade/ui-kit'

export default function Header() {
    const navigate = useNavigate()
    const dispatch = useDispatch()
    const token = useSelector((s: RootState) => s.auth.token)

    const logout = () => {
        dispatch(setToken(null))
        navigate('/login', { replace: true })
    }

    return (
        <header style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, padding: 16 }}>
            {token ? (
                <Button onClick={logout}>Logout</Button>
            ) : (
                <Link to="/login"><Button>Login</Button></Link>
            )}
        </header>
    )
}