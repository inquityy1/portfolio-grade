import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import type { RootState } from '@portfolio-grade/app-state'
import { setToken, api, clearOrg } from '@portfolio-grade/app-state'
import { Button } from '@portfolio-grade/ui-kit'

export default function Header() {
    const navigate = useNavigate()
    const dispatch = useDispatch()
    const token = useSelector((s: RootState) => s.auth.token)

    const logout = () => {
        dispatch(setToken(null))
        dispatch(clearOrg())
        dispatch(api.util.resetApiState())
        navigate('/login')
    }

    return (
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 16 }}>
            <strong>Admin</strong>
            {token ? (
                <Button onClick={logout}>Logout</Button>
            ) : (
                <Link to="/login"><Button>Login</Button></Link>
            )}
        </header>
    )
}