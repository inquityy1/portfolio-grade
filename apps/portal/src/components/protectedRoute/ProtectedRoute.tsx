import { useSelector } from 'react-redux'
import { Navigate, Outlet } from 'react-router-dom'
import type { RootState } from '@portfolio-grade/app-state'

export default function ProtectedRoute() {
    const token = useSelector((s: RootState) => s.auth.token)

    if (!token) return <Navigate to="/login" replace />

    return <Outlet />
}