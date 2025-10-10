import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { Container, Table, TableColumn } from '@portfolio-grade/ui-kit';
import type { RootState } from '@portfolio-grade/app-state';

function api(path: string) {
  // Use Docker internal API URL for e2e tests, otherwise use VITE_API_URL
  const apiUrl =
    import.meta.env.VITE_E2E_API_URL || import.meta.env.VITE_API_URL || 'http://localhost:3000';
  const B = String(apiUrl).replace(/\/$/, '');
  return /\/api$/.test(B) ? `${B}${path}` : `${B}/api${path}`;
}

type AuditLog = {
  id: string;
  at: string;
  userId: string;
  action: string;
  resource: string;
  resourceId: string;
};

type User = {
  id: string;
  name: string;
  email: string;
};

export default function AuditLogsPage() {
  const token = useSelector((s: RootState) => s.auth.token);
  const orgId = useSelector((s: RootState) => s.tenant.orgId);

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [users, setUsers] = useState<Record<string, User>>({});
  const [loading, setLoading] = useState(true);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);

  // Load audit logs
  const loadAuditLogs = async () => {
    try {
      setLoading(true);
      const actualToken = token || localStorage.getItem('token') || '';
      const actualOrgId = orgId || localStorage.getItem('orgId') || '';

      const response = await axios.get(`${api('/audit-logs')}?take=50`, {
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${actualToken}`,
          'x-org-id': actualOrgId,
        },
      });

      setAuditLogs(response.data || []);
    } catch (err: any) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load users for display names
  const loadUsers = async () => {
    try {
      const actualToken = token || localStorage.getItem('token') || '';
      const actualOrgId = orgId || localStorage.getItem('orgId') || '';

      const response = await axios.get(`${api('/users')}`, {
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${actualToken}`,
          'x-org-id': actualOrgId,
        },
      });

      const userMap: Record<string, User> = {};
      response.data.forEach((user: any) => {
        userMap[user.id] = {
          id: user.id,
          name: user.name || 'Unknown User',
          email: user.email || 'unknown@example.com',
        };
      });
      setUsers(userMap);
    } catch (err: any) {
      console.error('Failed to load users:', err);
    }
  };

  useEffect(() => {
    loadAuditLogs();
    loadUsers();
  }, [token, orgId]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getUserDisplayName = (userId: string) => {
    const user = users[userId];
    return user ? `${user.name} (${user.email})` : `User ${userId.substring(0, 8)}...`;
  };

  const copyResourceId = async (resourceId: string) => {
    try {
      await navigator.clipboard.writeText(resourceId);
      setCopyMessage('Resource ID copied!');
      setTimeout(() => setCopyMessage(null), 2000); // Hide message after 2 seconds
    } catch (err) {
      console.error('Failed to copy:', err);
      setCopyMessage('Failed to copy');
      setTimeout(() => setCopyMessage(null), 2000);
    }
  };

  // Table columns definition
  const columns: TableColumn<AuditLog>[] = [
    {
      key: 'at',
      label: 'Timestamp',
      render: date => formatDate(date),
    },
    {
      key: 'userId',
      label: 'User',
      render: userId => getUserDisplayName(userId),
    },
    {
      key: 'action',
      label: 'Action',
      render: action => (
        <span
          style={{
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: '500',
            backgroundColor: action.includes('CREATED')
              ? '#d4edda'
              : action.includes('UPDATED')
              ? '#fff3cd'
              : action.includes('DELETED')
              ? '#f8d7da'
              : '#e2e3e5',
            color: action.includes('CREATED')
              ? '#155724'
              : action.includes('UPDATED')
              ? '#856404'
              : action.includes('DELETED')
              ? '#721c24'
              : '#383d41',
          }}
        >
          {action.replace('_', ' ')}
        </span>
      ),
    },
    {
      key: 'resource',
      label: 'Resource',
      render: resource => <span style={{ fontWeight: '500' }}>{resource}</span>,
    },
    {
      key: 'resourceId',
      label: 'Resource ID',
      render: resourceId => (
        <span
          style={{
            cursor: 'pointer',
            textDecoration: 'underline',
            color: '#4CAF50',
            fontFamily: 'monospace',
            fontSize: '12px',
          }}
          onClick={() => copyResourceId(resourceId)}
          title='Click to copy full Resource ID'
        >
          {resourceId}
        </span>
      ),
    },
  ];

  return (
    <Container maxWidth='1200px'>
      <h1>Audit Logs</h1>
      <p>View system activity and user actions across your organization.</p>

      {/* Copy Success Message */}
      {copyMessage && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            backgroundColor: copyMessage.includes('Failed') ? '#f44336' : '#4CAF50',
            color: 'white',
            padding: '12px 20px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            zIndex: 1000,
            fontSize: '14px',
            fontWeight: '500',
            animation: 'slideIn 0.3s ease-out',
          }}
        >
          {copyMessage}
        </div>
      )}

      {/* Audit Logs Table */}
      <Table
        columns={columns}
        data={auditLogs}
        loading={loading}
        emptyMessage='No audit logs found'
        theme='dark'
        style={{ marginTop: 24 }}
      />

      {/* Summary */}
      <div style={{ marginTop: 16, fontSize: '14px', color: '#666' }}>
        Showing {auditLogs.length} audit log entries
      </div>
    </Container>
  );
}
