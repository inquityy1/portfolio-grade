import { useSelector } from 'react-redux'
import type { RootState } from '@portfolio-grade/app-state'

export default function Dashboard() {
    const orgId = useSelector((s: RootState) => s.tenant.orgId)
    const token = useSelector((s: RootState) => s.auth.token)
    return (
        <div>
            <h2>Dashboard</h2>
            <p>Org: {orgId}</p>
            <p>JWT: {token ? 'present' : 'none'}</p>
        </div>
    )
}