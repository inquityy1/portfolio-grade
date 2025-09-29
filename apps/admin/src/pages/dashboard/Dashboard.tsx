import { Container } from '@portfolio-grade/ui-kit'
import { Link } from 'react-router-dom'

export default function Dashboard() {
    return (
        <Container>
            <h1>Admin Dashboard</h1>
            <p>Welcome to the Admin Panel. Use the navigation above to access different admin functions.</p>
            <div style={{ marginTop: 24 }}>
                <h3>Available Functions:</h3>
                <ul>
                    <li><strong>Admin Jobs</strong> - Manage background jobs and tasks</li>
                    <li><strong>Audit Logs</strong> - View system audit logs and activity</li>
                    <li><strong><Link to="/create-user">Create New User</Link></strong> - Add new users to the system</li>
                    <li><strong><Link to="/create-organization">Create New Organization</Link></strong> - Add new organizations to the system</li>
                </ul>
            </div>
        </Container>
    )
}