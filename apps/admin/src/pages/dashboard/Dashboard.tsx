import { useSelector } from 'react-redux'
import type { RootState } from '@portfolio-grade/app-state'
import { Container } from '@portfolio-grade/ui-kit'

export default function Dashboard() {
    const orgId = useSelector((s: RootState) => s.tenant.orgId)
    const token = useSelector((s: RootState) => s.auth.token)
    return (
        <Container>
            <h2>Dashboard</h2>
            <p>Org: {orgId}</p>
            <p>JWT: {token ? 'present' : 'none'}</p>
        </Container>
    )
}