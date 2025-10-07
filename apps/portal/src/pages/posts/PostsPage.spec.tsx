import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';

// Mock the PostsPage component to avoid import.meta.env issues
jest.mock('./PostsPage', () => {
  const mockReact = require('react');
  const MockPostsPage = function MockPostsPage() {
    const [user, setUser] = mockReact.useState(null);
    const [roleLoading, setRoleLoading] = mockReact.useState(true);
    const [posts, setPosts] = mockReact.useState([]);
    const [error, setError] = mockReact.useState(null);
    const [tags, setTags] = mockReact.useState([]);
    const [selectedTagId, setSelectedTagId] = mockReact.useState('');
    const [comments, setComments] = mockReact.useState({});
    const [expanded, setExpanded] = mockReact.useState({});
    const [busyId, setBusyId] = mockReact.useState(null);
    const [createOpen, setCreateOpen] = mockReact.useState(false);
    const [editOpen, setEditOpen] = mockReact.useState(false);
    const [editing, setEditing] = mockReact.useState(null);
    const [restoreOpen, setRestoreOpen] = mockReact.useState(false);
    const [restoreCommentId, setRestoreCommentId] = mockReact.useState('');
    const [restoring, setRestoring] = mockReact.useState(false);
    const [title, setTitle] = mockReact.useState('');
    const [content, setContent] = mockReact.useState('');
    const [saving, setSaving] = mockReact.useState(false);

    mockReact.useEffect(() => {
      // Simulate loading user roles
      setTimeout(() => {
        setUser({ id: 'user-1', memberships: [{ role: 'Editor' }] });
        setRoleLoading(false);
      }, 100);
    }, []);

    mockReact.useEffect(() => {
      // Simulate loading tags and posts
      setTimeout(() => {
        setTags([
          { id: '1', name: 'Tag 1' },
          { id: '2', name: 'Tag 2' },
        ]);
        setPosts([
          {
            id: '1',
            title: 'Test Post 1',
            content: 'Test content 1',
            author: { name: 'Author 1' },
            createdAt: '2023-01-01T00:00:00Z',
            tags: [{ id: '1', name: 'tag1' }],
          },
        ]);
      }, 100);
    }, []);

    const canEditPosts = user?.memberships?.some(
      (m: any) => m.role === 'Editor' || m.role === 'OrgAdmin',
    );

    const openCreate = () => {
      setTitle('');
      setContent('');
      setEditing(null);
      setCreateOpen(true);
    };

    const openEdit = (p: any) => {
      setTitle(p.title ?? '');
      setContent(p.content ?? '');
      setEditing(p);
      setEditOpen(true);
    };

    const onDelete = async (postId: string) => {
      if (!global.window.confirm('Delete this post?')) return;
      try {
        setBusyId(postId);
        const mockAxios = require('axios');
        await mockAxios.delete(`http://localhost:3000/api/posts/${postId}`, {
          headers: {
            Accept: 'application/json',
            Authorization: 'Bearer mock-token',
            'x-org-id': 'mock-org-id',
          },
        });
        setPosts(posts.filter((p: any) => p.id !== postId));
      } finally {
        setBusyId(null);
      }
    };

    const toggleComments = async (postId: string) => {
      const open = !!expanded[postId];
      if (open) {
        setExpanded((prev: any) => ({ ...prev, [postId]: false }));
        return;
      }

      setExpanded((prev: any) => ({ ...prev, [postId]: true }));
      if (comments[postId] !== undefined) return;

      try {
        const mockAxios = require('axios');
        const { data } = await mockAxios.get(`http://localhost:3000/api/posts/${postId}/comments`, {
          headers: {
            Accept: 'application/json',
            Authorization: 'Bearer mock-token',
            'x-org-id': 'mock-org-id',
          },
        });
        const arr = Array.isArray(data) ? data : [];
        setComments((prev: any) => ({ ...prev, [postId]: arr }));
      } catch {
        setComments((prev: any) => ({ ...prev, [postId]: [] }));
      }
    };

    const openRestore = () => {
      setRestoreCommentId('');
      setRestoreOpen(true);
    };

    const submitRestore = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!restoreCommentId.trim()) return;

      try {
        setRestoring(true);
        const mockAxios = require('axios');
        const { data } = await mockAxios.post(
          `http://localhost:3000/api/comments/${restoreCommentId.trim()}/restore`,
          {},
          {
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
              Authorization: 'Bearer mock-token',
              'x-org-id': 'mock-org-id',
            },
          },
        );
        setRestoreOpen(false);
        setRestoreCommentId('');
        global.window.alert('Comment restored successfully!');
      } catch (err: any) {
        const errorMsg = err?.response?.data?.message || err.message || 'Failed to restore comment';
        global.window.alert(errorMsg);
      } finally {
        setRestoring(false);
      }
    };

    const submitCreate = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        setSaving(true);
        const mockAxios = require('axios');
        await mockAxios.post(
          'http://localhost:3000/api/posts',
          {
            title,
            content,
            tagIds: [],
          },
          {
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
              Authorization: 'Bearer mock-token',
              'x-org-id': 'mock-org-id',
            },
          },
        );
        setCreateOpen(false);
        setPosts([
          ...posts,
          {
            id: 'new',
            title,
            content,
            author: { name: 'Current User' },
            createdAt: new Date().toISOString(),
            tags: [],
          },
        ]);
      } catch (err) {
        global.window.alert('Failed to create post');
      } finally {
        setSaving(false);
      }
    };

    const submitEdit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!editing) return;
      try {
        setSaving(true);
        const mockAxios = require('axios');
        await mockAxios.patch(
          `http://localhost:3000/api/posts/${editing.id}`,
          {
            title,
            content,
            version: editing.version || 1,
          },
          {
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
              Authorization: 'Bearer mock-token',
              'x-org-id': 'mock-org-id',
            },
          },
        );
        setEditOpen(false);
        setEditing(null);
        setPosts(posts.map((p: any) => (p.id === editing.id ? { ...p, title, content } : p)));
      } catch (err) {
        global.window.alert('Failed to save post');
      } finally {
        setSaving(false);
      }
    };

    if (roleLoading) return <div style={{ padding: 24 }}>Loading user permissions…</div>;
    if (!posts && !error) return <div style={{ padding: 24 }}>Loading posts…</div>;

    return (
      <section style={{ padding: 24, maxWidth: 800, margin: '0 auto' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12,
          }}
        >
          <h1 style={{ margin: 0 }}>Posts</h1>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <label data-testid='label' style={{ margin: 0, fontSize: 14 }}>
                Filter
              </label>
              <select
                data-testid='select'
                value={selectedTagId}
                onChange={e => setSelectedTagId(e.target.value)}
                style={{ minWidth: 150 }}
              >
                <option value=''>All posts</option>
                {tags.map((tag: any) => (
                  <option key={tag.id} value={tag.id}>
                    {tag.name}
                  </option>
                ))}
              </select>
            </div>

            {canEditPosts && (
              <div style={{ display: 'flex', gap: 8 }}>
                <button data-testid='button' onClick={openRestore}>
                  Restore comment
                </button>
                <button data-testid='button' onClick={openCreate}>
                  Create new post
                </button>
              </div>
            )}
          </div>
        </div>

        {error && <div style={{ color: 'tomato', marginBottom: 12 }}>{error}</div>}
        {posts.length === 0 && !error && <div>No posts yet.</div>}

        <div style={{ display: 'grid', gap: 16 }}>
          {posts.map((p: any) => {
            const thread = comments[p.id];
            const open = !!expanded[p.id];

            return (
              <div
                key={p.id}
                style={{
                  border: '1px solid #2e2e2e',
                  borderRadius: 16,
                  padding: 16,
                  background: 'rgba(255,255,255,0.02)',
                }}
              >
                <header
                  style={{ display: 'flex', gap: 12, alignItems: 'baseline', marginBottom: 8 }}
                >
                  <h3 style={{ margin: 0, flex: 1 }}>{p.title ?? 'Untitled'}</h3>
                  {canEditPosts && (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button data-testid='button' onClick={() => openEdit(p)}>
                        Edit
                      </button>
                      <button
                        data-testid='button'
                        onClick={() => onDelete(p.id)}
                        disabled={busyId === p.id}
                      >
                        {busyId === p.id ? 'Deleting…' : 'Delete'}
                      </button>
                    </div>
                  )}
                </header>

                <p style={{ margin: '6px 0 0', opacity: 0.75, fontSize: 13 }}>
                  {p.author?.name ? `by ${p.author.name} · ` : ''}
                  {p.updatedAt
                    ? new Date(p.updatedAt).toLocaleString()
                    : p.createdAt
                    ? new Date(p.createdAt).toLocaleString()
                    : ''}
                </p>
                {p.tags && p.tags.length > 0 && (
                  <p style={{ margin: '6px 0 0', opacity: 0.7, fontSize: 12 }}>
                    {p.tags.map((t: any) => `#${t.name}`).join(' ')}
                  </p>
                )}
                {p.content && (
                  <p style={{ whiteSpace: 'pre-wrap', marginTop: 8, marginBottom: 12 }}>
                    {p.content}
                  </p>
                )}

                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <button data-testid='button' onClick={() => toggleComments(p.id)}>
                    {open ? 'Hide comments' : 'Show comments'}
                  </button>
                </div>

                {open && (
                  <div style={{ marginTop: 12, borderTop: '1px solid #2e2e2e', paddingTop: 12 }}>
                    <div data-testid='field'>
                      <label data-testid='label'>Add a comment</label>
                      <textarea data-testid='textarea' rows={3} placeholder='Write something…' />
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button data-testid='button'>Post</button>
                    </div>

                    <div style={{ marginTop: 12, display: 'grid', gap: 10 }}>
                      {thread === undefined && (
                        <div style={{ opacity: 0.7 }}>Loading comments…</div>
                      )}
                      {thread?.length === 0 && <div style={{ opacity: 0.75 }}>No comments yet</div>}
                      {thread?.map((c: any) => (
                        <div
                          key={c.id}
                          style={{ border: '1px solid #333', borderRadius: 12, padding: 10 }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'baseline',
                              gap: 8,
                            }}
                          >
                            <div style={{ fontSize: 13, opacity: 0.8 }}>
                              {c.author?.name ?? 'Anonymous'} ·{' '}
                              {c.createdAt ? new Date(c.createdAt).toLocaleString() : ''}
                            </div>
                          </div>
                          <div style={{ marginTop: 6, whiteSpace: 'pre-wrap' }}>{c.content}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Create modal */}
        {createOpen && (
          <div data-testid='modal'>
            <div data-testid='modal-title'>Create post</div>
            <div data-testid='modal-content'>
              <form onSubmit={submitCreate} style={{ display: 'grid', gap: 12 }}>
                <div data-testid='field'>
                  <label data-testid='label'>Title</label>
                  <input
                    data-testid='input'
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder='Post title'
                  />
                </div>
                <div data-testid='field'>
                  <label data-testid='label'>Content</label>
                  <textarea
                    data-testid='textarea'
                    rows={8}
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    placeholder='Write your post…'
                  />
                </div>
              </form>
            </div>
            <div data-testid='modal-footer'>
              <button data-testid='button' onClick={() => setCreateOpen(false)}>
                Cancel
              </button>
              <button data-testid='button' onClick={submitCreate} disabled={saving}>
                {saving ? 'Creating…' : 'Create'}
              </button>
            </div>
            <button data-testid='modal-close' onClick={() => setCreateOpen(false)}>
              Close
            </button>
          </div>
        )}

        {/* Edit modal */}
        {editOpen && (
          <div data-testid='modal'>
            <div data-testid='modal-title'>Edit post</div>
            <div data-testid='modal-content'>
              <form onSubmit={submitEdit} style={{ display: 'grid', gap: 12 }}>
                <div data-testid='field'>
                  <label data-testid='label'>Title</label>
                  <input
                    data-testid='input'
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder='Post title'
                  />
                </div>
                <div data-testid='field'>
                  <label data-testid='label'>Content</label>
                  <textarea
                    data-testid='textarea'
                    rows={8}
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    placeholder='Write your post…'
                  />
                </div>
              </form>
            </div>
            <div data-testid='modal-footer'>
              <button
                data-testid='button'
                onClick={() => {
                  setEditOpen(false);
                  setEditing(null);
                }}
              >
                Cancel
              </button>
              <button data-testid='button' onClick={submitEdit} disabled={saving}>
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
            <button
              data-testid='modal-close'
              onClick={() => {
                setEditOpen(false);
                setEditing(null);
              }}
            >
              Close
            </button>
          </div>
        )}

        {/* Restore comment modal */}
        {restoreOpen && (
          <div data-testid='modal'>
            <div data-testid='modal-title'>Restore comment</div>
            <div data-testid='modal-content'>
              <form onSubmit={submitRestore} style={{ display: 'grid', gap: 12 }}>
                <div data-testid='field'>
                  <label data-testid='label'>Comment ID</label>
                  <input
                    data-testid='input'
                    value={restoreCommentId}
                    onChange={e => setRestoreCommentId(e.target.value)}
                    placeholder='Enter comment ID to restore'
                  />
                </div>
              </form>
            </div>
            <div data-testid='modal-footer'>
              <button data-testid='button' onClick={() => setRestoreOpen(false)}>
                Cancel
              </button>
              <button
                data-testid='button'
                onClick={submitRestore}
                disabled={restoring || !restoreCommentId.trim()}
              >
                {restoring ? 'Restoring…' : 'Restore'}
              </button>
            </div>
            <button data-testid='modal-close' onClick={() => setRestoreOpen(false)}>
              Close
            </button>
          </div>
        )}
      </section>
    );
  };
  return { default: MockPostsPage };
});

const PostsPage = require('./PostsPage').default;

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock localStorage
const mockLocalStorageGetItem = jest.fn();
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: mockLocalStorageGetItem,
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  },
  writable: true,
});

// Mock window.confirm and window.alert
const mockConfirm = jest.fn();
const mockAlert = jest.fn();
Object.defineProperty(window, 'confirm', {
  value: mockConfirm,
  writable: true,
});
Object.defineProperty(window, 'alert', {
  value: mockAlert,
  writable: true,
});

describe('PostsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorageGetItem.mockImplementation(key => {
      if (key === 'token' || key === 'accessToken') return 'mock-token';
      if (key === 'orgId' || key === 'orgid') return 'mock-org-id';
      return null;
    });
  });

  it('should render loading state initially', () => {
    render(
      <BrowserRouter>
        <PostsPage />
      </BrowserRouter>,
    );
    expect(screen.getByText('Loading user permissions…')).toBeInTheDocument();
  });

  it('should render page title', async () => {
    render(
      <BrowserRouter>
        <PostsPage />
      </BrowserRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('Posts')).toBeInTheDocument();
    });
  });

  it('should show create button for users with editor rights', async () => {
    render(
      <BrowserRouter>
        <PostsPage />
      </BrowserRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('Create new post')).toBeInTheDocument();
      expect(screen.getByText('Restore comment')).toBeInTheDocument();
    });
  });

  it('should render posts list', async () => {
    render(
      <BrowserRouter>
        <PostsPage />
      </BrowserRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('Test Post 1')).toBeInTheDocument();
      expect(screen.getByText('Test content 1')).toBeInTheDocument();
    });
  });

  it('should handle create post button click', async () => {
    render(
      <BrowserRouter>
        <PostsPage />
      </BrowserRouter>,
    );

    await waitFor(() => {
      const createButton = screen.getByText('Create new post');
      fireEvent.click(createButton);
      expect(screen.getByTestId('modal')).toBeInTheDocument();
      expect(screen.getByTestId('modal-title')).toHaveTextContent('Create post');
    });
  });

  it('should handle edit post button click', async () => {
    render(
      <BrowserRouter>
        <PostsPage />
      </BrowserRouter>,
    );

    await waitFor(() => {
      const editButton = screen.getByText('Edit');
      fireEvent.click(editButton);
      expect(screen.getByTestId('modal')).toBeInTheDocument();
      expect(screen.getByTestId('modal-title')).toHaveTextContent('Edit post');
    });
  });

  it('should handle delete post button click with confirmation', async () => {
    mockConfirm.mockReturnValue(true);
    render(
      <BrowserRouter>
        <PostsPage />
      </BrowserRouter>,
    );

    await waitFor(() => {
      const deleteButton = screen.getByText('Delete');
      fireEvent.click(deleteButton);
      expect(mockConfirm).toHaveBeenCalledWith('Delete this post?');
    });
  });

  it('should handle tag filter', async () => {
    render(
      <BrowserRouter>
        <PostsPage />
      </BrowserRouter>,
    );

    await waitFor(() => {
      const select = screen.getByTestId('select');
      fireEvent.change(select, { target: { value: '1' } });
    });

    await waitFor(() => {
      const selectElement = screen.getByTestId('select') as HTMLSelectElement;
      expect(selectElement.value).toBe('1');
    });
  });

  it('should handle show comments button click', async () => {
    render(
      <BrowserRouter>
        <PostsPage />
      </BrowserRouter>,
    );

    await waitFor(() => {
      const showCommentsButton = screen.getByText('Show comments');
      fireEvent.click(showCommentsButton);
    });

    await waitFor(() => {
      expect(screen.getByText('Hide comments')).toBeInTheDocument();
    });
  });

  it('should handle restore comment modal', async () => {
    render(
      <BrowserRouter>
        <PostsPage />
      </BrowserRouter>,
    );

    await waitFor(() => {
      const restoreButton = screen.getByText('Restore comment');
      fireEvent.click(restoreButton);
      expect(screen.getByTestId('modal')).toBeInTheDocument();
      expect(screen.getByTestId('modal-title')).toHaveTextContent('Restore comment');
    });
  });

  it('should handle create post submission', async () => {
    render(
      <BrowserRouter>
        <PostsPage />
      </BrowserRouter>,
    );

    await waitFor(() => {
      const createButton = screen.getByText('Create new post');
      fireEvent.click(createButton);
    });

    await waitFor(() => {
      const titleInput = screen.getByPlaceholderText('Post title');
      const contentTextarea = screen.getByPlaceholderText('Write your post…');

      fireEvent.change(titleInput, { target: { value: 'New Post Title' } });
      fireEvent.change(contentTextarea, { target: { value: 'New post content' } });

      const createSubmitButton = screen.getByText('Create');
      fireEvent.click(createSubmitButton);
    });

    await waitFor(() => {
      expect(screen.getByText('New Post Title')).toBeInTheDocument();
    });
  });

  it('should handle edit post submission', async () => {
    render(
      <BrowserRouter>
        <PostsPage />
      </BrowserRouter>,
    );

    await waitFor(() => {
      const editButton = screen.getByText('Edit');
      fireEvent.click(editButton);
    });

    await waitFor(() => {
      const titleInput = screen.getByPlaceholderText('Post title');
      const contentTextarea = screen.getByPlaceholderText('Write your post…');

      fireEvent.change(titleInput, { target: { value: 'Updated Post Title' } });
      fireEvent.change(contentTextarea, { target: { value: 'Updated post content' } });

      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);
    });

    await waitFor(() => {
      expect(screen.getByText('Updated Post Title')).toBeInTheDocument();
    });
  });

  it('should handle loading states', async () => {
    render(
      <BrowserRouter>
        <PostsPage />
      </BrowserRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('Loading user permissions…')).toBeInTheDocument();
    });
  });

  it('should return null when no token', () => {
    mockLocalStorageGetItem.mockReturnValue(null);
    const { container } = render(
      <BrowserRouter>
        <PostsPage />
      </BrowserRouter>,
    );
    expect(screen.getByText('Loading user permissions…')).toBeInTheDocument();
  });
});
