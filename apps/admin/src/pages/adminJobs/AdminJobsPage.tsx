import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { Container, Button, Table, TableColumn, Alert } from '@portfolio-grade/ui-kit';
import type { RootState } from '@portfolio-grade/app-state';

function api(path: string) {
  // Use Docker internal API URL for e2e tests, otherwise use VITE_API_URL
  const apiUrl =
    import.meta.env.VITE_E2E_API_URL || import.meta.env.VITE_API_URL || 'http://localhost:3000';
  const B = String(apiUrl).replace(/\/$/, '');
  return /\/api$/.test(B) ? `${B}${path}` : `${B}/api${path}`;
}

type TagStat = {
  id: string;
  tagId: string;
  organizationId: string;
  count: number;
  tag?: {
    id: string;
    name: string;
  };
};

type Post = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  files?: Array<{
    id: string;
    url: string;
    mimeType: string;
  }>;
};

export default function AdminJobsPage() {
  const token = useSelector((s: RootState) => s.auth.token);
  const orgId = useSelector((s: RootState) => s.tenant.orgId);

  const [tagStats, setTagStats] = useState<TagStat[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningTagStats, setRunningTagStats] = useState(false);
  const [runningPreview, setRunningPreview] = useState<Record<string, boolean>>({});
  const [message, setMessage] = useState<string | null>(null);

  const loadTagStats = async () => {
    try {
      setLoading(true);
      const actualToken = token || localStorage.getItem('token') || '';
      const actualOrgId = orgId || localStorage.getItem('orgId') || '';

      const response = await axios.get(`${api('/admin/jobs/tag-stats')}`, {
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${actualToken}`,
          'x-org-id': actualOrgId,
        },
      });

      setTagStats(response.data || []);
    } catch (err: any) {
      console.error('Failed to load tag stats:', err);
      setMessage(err?.response?.data?.message || err.message || 'Failed to load tag stats');
    } finally {
      setLoading(false);
    }
  };

  const loadPosts = async () => {
    try {
      const actualToken = token || localStorage.getItem('token') || '';
      const actualOrgId = orgId || localStorage.getItem('orgId') || '';

      const response = await axios.get(`${api('/posts')}?includeFileAssets=true&limit=10`, {
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${actualToken}`,
          'x-org-id': actualOrgId,
        },
      });

      const postsData = response.data?.items || response.data || [];
      setPosts(postsData);
    } catch (err: any) {
      console.error('Failed to load posts:', err);
    }
  };

  const runTagStats = async () => {
    try {
      setRunningTagStats(true);
      setMessage(null);
      const actualToken = token || localStorage.getItem('token') || '';
      const actualOrgId = orgId || localStorage.getItem('orgId') || '';

      await axios.post(
        `${api('/admin/jobs/tag-stats/run')}`,
        {},
        {
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${actualToken}`,
            'x-org-id': actualOrgId,
            'idempotency-key': `tag-stats-${Date.now()}`,
          },
        },
      );

      setMessage('Tag stats job queued successfully! Refreshing data...');
      setTimeout(() => {
        loadTagStats();
        setMessage(null);
      }, 2000);
    } catch (err: any) {
      console.error('Failed to run tag stats:', err);
      setMessage(err?.response?.data?.message || err.message || 'Failed to run tag stats job');
    } finally {
      setRunningTagStats(false);
    }
  };

  const runPreview = async (postId: string) => {
    try {
      setRunningPreview(prev => ({ ...prev, [postId]: true }));
      setMessage(null);
      const actualToken = token || localStorage.getItem('token') || '';
      const actualOrgId = orgId || localStorage.getItem('orgId') || '';

      const response = await axios.post(
        `${api(`/admin/jobs/post-preview/${postId}`)}`,
        {},
        {
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${actualToken}`,
            'x-org-id': actualOrgId,
            'idempotency-key': `preview-${postId}-${Date.now()}`,
          },
        },
      );

      if (response.data.generated) {
        setMessage(`Preview generated for post ${postId.substring(0, 8)}...`);
        setTimeout(() => {
          loadPosts();
          setMessage(null);
        }, 1000);
      } else {
        setMessage(`Post preview job queued for post ${postId.substring(0, 8)}...`);
        setTimeout(() => setMessage(null), 3000);
      }
    } catch (err: any) {
      console.error('Failed to run preview:', err);
      setMessage(err?.response?.data?.message || err.message || 'Failed to run preview job');
    } finally {
      setRunningPreview(prev => ({ ...prev, [postId]: false }));
    }
  };

  useEffect(() => {
    loadTagStats();
    loadPosts();
  }, [token, orgId]);

  const tagStatsColumns: TableColumn<TagStat>[] = [
    {
      key: 'tagName',
      label: 'Tag Name',
      render: (_, item) => (
        <div style={{ fontWeight: '500', marginBottom: '4px' }}>{item.organizationId}</div>
      ),
    },
    {
      key: 'count',
      label: 'Usage Count',
      render: count => <span style={{ fontWeight: 'bold', color: '#4CAF50' }}>{count}</span>,
      align: 'center',
    },
    {
      key: 'tagId',
      label: 'Tag ID',
      render: tagId => (
        <span
          style={{
            fontFamily: 'monospace',
            fontSize: '12px',
            cursor: 'pointer',
            color: '#4CAF50',
            textDecoration: 'underline',
          }}
          onClick={() => {
            navigator.clipboard.writeText(tagId);
            setMessage('Tag ID copied!');
            setTimeout(() => setMessage(null), 2000);
          }}
          title='Click to copy Tag ID'
        >
          {tagId.substring(0, 12)}...
        </span>
      ),
    },
  ];

  const postsColumns: TableColumn<Post>[] = [
    {
      key: 'title',
      label: 'Post Title',
      render: (title, item) => (
        <div>
          <div style={{ fontWeight: '500', marginBottom: '4px' }}>{title || 'Untitled Post'}</div>
          <div
            style={{
              fontSize: '12px',
              color: '#666',
              fontFamily: 'monospace',
            }}
          >
            ID: {item.id.substring(0, 12)}...
          </div>
        </div>
      ),
    },
    {
      key: 'createdAt',
      label: 'Created',
      render: date => (
        <div>
          <div style={{ fontWeight: '500' }}>{new Date(date).toLocaleDateString()}</div>
          <div
            style={{
              fontSize: '12px',
              color: '#666',
            }}
          >
            {new Date(date).toLocaleTimeString()}
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Preview Status',
      render: (_, item) => {
        const hasPreview = item.files && item.files.length > 0;
        return (
          <span
            style={{
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: '500',
              backgroundColor: hasPreview ? '#d4edda' : '#fff3cd',
              color: hasPreview ? '#155724' : '#856404',
            }}
          >
            {hasPreview ? 'Generated' : 'No Preview'}
          </span>
        );
      },
      align: 'center',
    },
    {
      key: 'id',
      label: 'Actions',
      render: (_, item) => {
        const hasPreview = item.files && item.files.length > 0;
        return (
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
            {!hasPreview && (
              <Button
                disabled={runningPreview[item.id]}
                onClick={() => runPreview(item.id)}
                style={{ fontSize: '12px', padding: '6px 12px' }}
              >
                {runningPreview[item.id] ? 'Generating...' : 'Generate Preview'}
              </Button>
            )}
            {hasPreview && (
              <Button
                onClick={() => {
                  const previewUrl = item.files![0].url;
                  window.open(previewUrl, '_blank');
                }}
                style={{ fontSize: '12px', padding: '6px 12px' }}
              >
                View Preview
              </Button>
            )}
          </div>
        );
      },
      align: 'center',
    },
  ];

  return (
    <Container maxWidth='1200px'>
      <h1>Admin Jobs</h1>
      <p>Manage background jobs and view system statistics.</p>

      {/* Message */}
      {message && (
        <Alert
          style={{
            marginBottom: 16,
            color: message.includes('Failed') ? 'tomato' : '#4CAF50',
          }}
        >
          {message}
        </Alert>
      )}

      {/* Tag Stats Section */}
      <div style={{ marginBottom: 32 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
          }}
        >
          <h2>Tag Statistics</h2>
          <Button
            onClick={runTagStats}
            disabled={runningTagStats}
            style={{ border: '1px solid #ccc', background: 'transparent' }}
          >
            {runningTagStats ? 'Running...' : 'Refresh Tag Stats'}
          </Button>
        </div>
        <p style={{ marginBottom: 16, color: '#666' }}>
          View tag usage statistics across your organization. Click "Refresh Tag Stats" to
          recalculate.
        </p>

        <Table
          columns={tagStatsColumns}
          data={tagStats}
          loading={loading}
          emptyMessage='No tag statistics available'
          theme='dark'
        />
      </div>

      {/* Post Preview Jobs Section */}
      <div>
        <h2>Post Preview Jobs</h2>
        <p style={{ marginBottom: 16, color: '#666' }}>
          Generate previews for posts. This is useful for creating thumbnails or summaries.
        </p>

        <Table
          columns={postsColumns}
          data={posts}
          loading={loading}
          emptyMessage='No posts available for preview generation'
          theme='dark'
        />
      </div>
    </Container>
  );
}
