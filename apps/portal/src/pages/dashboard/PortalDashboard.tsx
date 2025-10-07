import { Container } from '@portfolio-grade/ui-kit';
import { Link } from 'react-router-dom';

export default function PortalDashboard() {
  return (
    <Container>
      <h1>Portal Dashboard</h1>
      <p>Welcome to the Portal. Use the navigation above to access different portal functions.</p>
      <div style={{ marginTop: 24 }}>
        <h3>Available Functions:</h3>
        <ul>
          <li>
            <strong>
              <Link to='/forms'>Forms</Link>
            </strong>{' '}
            - View and manage forms. Create new forms, edit existing ones, and preview form
            submissions.
          </li>
          <li>
            <strong>
              <Link to='/posts'>Posts</Link>
            </strong>{' '}
            - View and manage posts. Create new posts, edit existing ones, add comments, and filter
            by tags.
          </li>
          <li>
            <strong>
              <Link to='/admin'>Admin</Link>
            </strong>{' '}
            - Access admin functions (if you have admin privileges). Manage users, organizations,
            and system settings.
          </li>
        </ul>
      </div>
    </Container>
  );
}
