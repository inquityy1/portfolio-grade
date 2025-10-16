import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Field, Label, Textarea, Input, Select } from '@portfolio-grade/ui-kit';
import Modal from '../../components/common/Modal';
import type { UserWithMemberships, Post, Comment, Tag } from './PostsPage.types';
import {
  generateIdempotencyKey,
  getAuthTokens,
  createAuthHeaders,
  fetchUserRoles,
  hasEditorRights,
  loadTags,
  loadPosts,
  loadComments,
  addComment,
  updateComment,
  deleteComment,
  restoreComment,
  deletePost,
  createPost,
  updatePost,
} from './PostsPage.utils';

export default function PostsPage() {
  const token = localStorage.getItem('token') || localStorage.getItem('accessToken') || null;

  const [user, setUser] = useState<UserWithMemberships | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);
  const canEditPosts = hasEditorRights(user?.memberships); // for post create/edit/delete

  const [posts, setPosts] = useState<Post[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  // tag filter state
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTagId, setSelectedTagId] = useState<string>('');

  // comments state
  const [comments, setComments] = useState<Record<string, Comment[] | null>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [adding, setAdding] = useState<Record<string, boolean>>({});
  const inputsRef = useRef<Record<string, HTMLTextAreaElement | null>>({});

  // comment edit state
  const [editingComment, setEditingComment] = useState<Record<string, boolean>>({});
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [savingComment, setSavingComment] = useState<Record<string, boolean>>({});
  const [deletingComment, setDeletingComment] = useState<Record<string, boolean>>({});

  // posts: busy id
  const [busyId, setBusyId] = useState<string | null>(null);

  // modals for posts
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Post | null>(null);

  // restore comment modal
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [restoreCommentId, setRestoreCommentId] = useState('');
  const [restoring, setRestoring] = useState(false);

  // create/edit post state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);

  // Request deduplication for /auth/me
  const userRequestRef = useRef<AbortController | null>(null);

  // ----- Load tags -----
  async function loadTagsHandler() {
    try {
      const tagsData = await loadTags();
      setTags(tagsData);
    } catch (e: any) {
      console.error('Failed to load tags:', e);
      setTags([]);
    }
  }

  async function loadPostsHandler() {
    try {
      setError(null);
      setPosts(null);
      const { posts, error } = await loadPosts(selectedTagId);
      setPosts(posts);
      setError(error);
    } catch (e: any) {
      setPosts([]);
      setError(e?.response?.data?.message || e.message || 'Failed to load posts');
    }
  }
  useEffect(() => {
    loadTagsHandler();
    loadPostsHandler();
  }, []);

  useEffect(() => {
    loadPostsHandler();
  }, [selectedTagId]);

  useEffect(() => {
    if (!token) return;

    if (userRequestRef.current) userRequestRef.current.abort();
    const controller = new AbortController();
    userRequestRef.current = controller;

    (async () => {
      try {
        setRoleLoading(true);
        const me = await fetchUserRoles(token, controller.signal);
        if (!controller.signal.aborted) setUser(me);
      } finally {
        setRoleLoading(false);
        if (userRequestRef.current === controller) userRequestRef.current = null;
      }
    })();

    return () => userRequestRef.current?.abort();
  }, [token]);

  async function toggleComments(postId: string) {
    const open = !!expanded[postId];
    if (open) return setExpanded(s => ({ ...s, [postId]: false }));

    setExpanded(s => ({ ...s, [postId]: true }));
    if (comments[postId] !== undefined) return;

    try {
      const arr = await loadComments(postId);
      setComments(s => ({ ...s, [postId]: arr }));
    } catch {
      setComments(s => ({ ...s, [postId]: [] }));
    }
  }

  async function addCommentHandler(postId: string, value: string) {
    if (!value.trim()) return;
    try {
      setAdding(s => ({ ...s, [postId]: true }));
      await addComment(postId, value);
      // Refresh comments list to get real ids/ownership
      await toggleComments(postId); // ensures expanded true
      // force reload of that thread
      const arr = await loadComments(postId);
      setComments(s => ({ ...s, [postId]: arr }));
      const ref = inputsRef.current[postId];
      if (ref) ref.value = '';
    } finally {
      setAdding(s => ({ ...s, [postId]: false }));
    }
  }

  function canModifyComment(c: Comment): boolean {
    const isOwner = !!(user?.id && c.authorId && user.id === c.authorId);
    return isOwner || hasEditorRights(user?.memberships);
  }

  function startEditComment(postId: string, c: Comment) {
    if (!canModifyComment(c)) return;
    setEditingComment(s => ({ ...s, [c.id]: true }));
    setEditValues(s => ({ ...s, [c.id]: c.content }));
  }

  function cancelEditComment(commentId: string) {
    setEditingComment(s => ({ ...s, [commentId]: false }));
    setEditValues(s => {
      const { [commentId]: _, ...rest } = s;
      return rest;
    });
  }

  async function saveEditComment(postId: string, c: Comment) {
    const newVal = (editValues[c.id] ?? '').trim();
    if (!newVal) return;
    try {
      setSavingComment(s => ({ ...s, [c.id]: true }));
      await updateComment(c.id, newVal);
      // update UI
      setComments(s => ({
        ...s,
        [postId]: (s[postId] ?? []).map(x => (x.id === c.id ? { ...x, content: newVal } : x)),
      }));
      cancelEditComment(c.id);
    } catch (err) {
      alert('Failed to update comment');
      console.error(err);
    } finally {
      setSavingComment(s => ({ ...s, [c.id]: false }));
    }
  }

  async function deleteCommentHandler(postId: string, c: Comment) {
    if (!canModifyComment(c)) return;
    if (!confirm('Delete this comment?')) return;
    try {
      setDeletingComment(s => ({ ...s, [c.id]: true }));
      await deleteComment(c.id);
      setComments(s => ({
        ...s,
        [postId]: (s[postId] ?? []).filter(x => x.id !== c.id),
      }));
    } catch (err) {
      alert('Failed to delete comment');
      console.error(err);
    } finally {
      setDeletingComment(s => ({ ...s, [c.id]: false }));
    }
  }

  // ----- Restore comment -----
  function openRestore() {
    setRestoreCommentId('');
    setRestoreOpen(true);
  }

  async function submitRestore(e: React.FormEvent) {
    e.preventDefault();
    if (!restoreCommentId.trim()) return;

    try {
      setRestoring(true);
      const data = await restoreComment(restoreCommentId.trim());

      // Refresh comments for the specific post
      if (data.postId) {
        await refreshCommentsForPost(data.postId);
      }

      setRestoreOpen(false);
      setRestoreCommentId('');
      alert('Comment restored successfully!');
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || err.message || 'Failed to restore comment';
      alert(errorMsg);
      console.error(err);
    } finally {
      setRestoring(false);
    }
  }

  // Helper function to refresh comments for a specific post
  async function refreshCommentsForPost(postId: string) {
    try {
      const arr = await loadComments(postId);
      setComments(s => ({ ...s, [postId]: arr }));
    } catch (err) {
      console.error('Failed to refresh comments:', err);
    }
  }

  // ----- Post delete / create / edit -----
  async function onDelete(postId: string) {
    if (!confirm('Delete this post?')) return;
    try {
      setBusyId(postId);
      await deletePost(postId);
      await loadPostsHandler();
    } finally {
      setBusyId(null);
    }
  }

  function openCreate() {
    setTitle('');
    setContent('');
    setSelectedTagIds([]);
    setEditing(null);
    setCreateOpen(true);
  }
  function openEdit(p: Post) {
    setTitle(p.title ?? '');
    setContent(p.content ?? '');
    setEditing(p);
    setEditOpen(true);
  }

  async function submitCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      setSaving(true);
      await createPost(title, content, selectedTagIds);
      setCreateOpen(false);
      await loadPostsHandler();
    } catch (err) {
      alert('Failed to create post');
      console.error(err);
    } finally {
      setSaving(false);
    }
  }
  async function submitEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    try {
      setSaving(true);
      await updatePost(editing.id, title, content, editing.version || 1);
      setEditOpen(false);
      setEditing(null);
      await loadPostsHandler();
    } catch (err) {
      alert('Failed to save post');
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  const isEmpty = useMemo(() => posts?.length === 0 && !error, [posts, error]);

  if (!token) return null;
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
            <Label style={{ margin: 0, fontSize: 14 }}>Filter</Label>
            <Select
              value={selectedTagId}
              onChange={e => setSelectedTagId(e.target.value)}
              style={{ minWidth: 150 }}
            >
              <option value=''>All posts</option>
              {tags.map(tag => (
                <option key={tag.id} value={tag.id}>
                  {tag.name}
                </option>
              ))}
            </Select>
          </div>

          {canEditPosts && (
            <div style={{ display: 'flex', gap: 8 }}>
              <Button onClick={openRestore}>Restore comment</Button>
              <Button onClick={openCreate}>Create new post</Button>
            </div>
          )}
        </div>
      </div>

      {error && <div style={{ color: 'tomato', marginBottom: 12 }}>{error}</div>}
      {isEmpty && <div>No posts yet.</div>}

      <div style={{ display: 'grid', gap: 16 }}>
        {(posts ?? []).map(p => {
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
              <header style={{ display: 'flex', gap: 12, alignItems: 'baseline', marginBottom: 8 }}>
                <h3 style={{ margin: 0, flex: 1 }}>{p.title ?? 'Untitled'}</h3>
                {canEditPosts && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Button onClick={() => openEdit(p)}>Edit</Button>
                    <Button onClick={() => onDelete(p.id)} disabled={busyId === p.id}>
                      {busyId === p.id ? 'Deleting…' : 'Delete'}
                    </Button>
                  </div>
                )}
              </header>

              <p style={{ margin: '6px 0 0', opacity: 0.75, fontSize: 13 }}>
                {p.authorName ? `by ${p.authorName} · ` : ''}
                {p.updatedAt
                  ? new Date(p.updatedAt).toLocaleString()
                  : p.createdAt
                  ? new Date(p.createdAt).toLocaleString()
                  : ''}
              </p>
              {p.tags && p.tags.length > 0 && (
                <p style={{ margin: '6px 0 0', opacity: 0.7, fontSize: 12 }}>
                  {p.tags.map(t => `#${t.name}`).join(' ')}
                </p>
              )}
              {p.content && (
                <p style={{ whiteSpace: 'pre-wrap', marginTop: 8, marginBottom: 12 }}>
                  {p.content}
                </p>
              )}

              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <Button onClick={() => toggleComments(p.id)}>
                  {open ? 'Hide comments' : 'Show comments'}
                </Button>
              </div>

              {open && (
                <div style={{ marginTop: 12, borderTop: '1px solid #2e2e2e', paddingTop: 12 }}>
                  {/* Add comment */}
                  <Field>
                    <Label>Add a comment</Label>
                    <Textarea
                      ref={el => {
                        inputsRef.current[p.id] = el;
                      }}
                      rows={3}
                      placeholder='Write something…'
                    />
                  </Field>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Button
                      onClick={() => addCommentHandler(p.id, inputsRef.current[p.id]?.value || '')}
                      disabled={!!adding[p.id]}
                    >
                      {adding[p.id] ? 'Posting…' : 'Post'}
                    </Button>
                  </div>

                  {/* Thread */}
                  <div style={{ marginTop: 12, display: 'grid', gap: 10 }}>
                    {thread === undefined && <div style={{ opacity: 0.7 }}>Loading comments…</div>}
                    {thread?.length === 0 && <div style={{ opacity: 0.75 }}>No comments yet</div>}
                    {thread?.map(c => {
                      const isEditing = !!editingComment[c.id];
                      const canModify = canModifyComment(c);

                      return (
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
                              {c.authorName ?? 'Anonymous'} ·{' '}
                              {c.createdAt ? new Date(c.createdAt).toLocaleString() : ''}
                            </div>
                            {canModify && !isEditing && (
                              <div style={{ display: 'flex', gap: 8 }}>
                                <Button onClick={() => startEditComment(p.id, c)}>Edit</Button>
                                <Button
                                  onClick={() => deleteCommentHandler(p.id, c)}
                                  disabled={!!deletingComment[c.id]}
                                >
                                  {deletingComment[c.id] ? 'Deleting…' : 'Delete'}
                                </Button>
                              </div>
                            )}
                          </div>

                          {!isEditing ? (
                            <div style={{ marginTop: 6, whiteSpace: 'pre-wrap' }}>{c.content}</div>
                          ) : (
                            <div style={{ marginTop: 8 }}>
                              <Textarea
                                rows={4}
                                value={editValues[c.id] ?? ''}
                                onChange={(e: any) =>
                                  setEditValues(s => ({ ...s, [c.id]: e.target.value }))
                                }
                              />
                              <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                                <Button
                                  onClick={() => saveEditComment(p.id, c)}
                                  disabled={!!savingComment[c.id]}
                                >
                                  {savingComment[c.id] ? 'Saving…' : 'Save'}
                                </Button>
                                <Button onClick={() => cancelEditComment(c.id)}>Cancel</Button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Create modal */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title='Create post'
        footer={
          <>
            <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={(e: any) => submitCreate(e)} disabled={saving}>
              {saving ? 'Creating…' : 'Create'}
            </Button>
          </>
        }
      >
        <form onSubmit={submitCreate} style={{ display: 'grid', gap: 12 }}>
          <Field>
            <Label>Title</Label>
            <Input
              value={title}
              onChange={(e: any) => setTitle(e.target.value)}
              placeholder='Post title'
            />
          </Field>
          <Field>
            <Label>Content</Label>
            <Textarea
              rows={8}
              value={content}
              onChange={(e: any) => setContent(e.target.value)}
              placeholder='Write your post…'
            />
          </Field>
          <Field>
            <Label>Tags (optional)</Label>
            <Select
              multiple
              value={selectedTagIds}
              onChange={(e: any) => {
                const values = Array.from(e.target.selectedOptions, (option: any) => option.value);
                setSelectedTagIds(values);
              }}
              style={{ minHeight: 100 }}
            >
              {tags.map(tag => (
                <option key={tag.id} value={tag.id}>
                  {tag.name}
                </option>
              ))}
            </Select>
            {selectedTagIds.length > 0 && (
              <div style={{ marginTop: 8, fontSize: 12, opacity: 0.7 }}>
                Selected: {selectedTagIds.map(id => tags.find(t => t.id === id)?.name).join(', ')}
              </div>
            )}
          </Field>
        </form>
      </Modal>

      {/* Edit modal */}
      <Modal
        open={editOpen}
        onClose={() => {
          setEditOpen(false);
          setEditing(null);
        }}
        title='Edit post'
        footer={
          <>
            <Button
              onClick={() => {
                setEditOpen(false);
                setEditing(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={(e: any) => submitEdit(e)} disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </>
        }
      >
        <form onSubmit={submitEdit} style={{ display: 'grid', gap: 12 }}>
          <Field>
            <Label>Title</Label>
            <Input
              value={title}
              onChange={(e: any) => setTitle(e.target.value)}
              placeholder='Post title'
            />
          </Field>
          <Field>
            <Label>Content</Label>
            <Textarea
              rows={8}
              value={content}
              onChange={(e: any) => setContent(e.target.value)}
              placeholder='Write your post…'
            />
          </Field>
        </form>
      </Modal>

      {/* Restore comment modal */}
      <Modal
        open={restoreOpen}
        onClose={() => setRestoreOpen(false)}
        title='Restore comment'
        footer={
          <>
            <Button onClick={() => setRestoreOpen(false)}>Cancel</Button>
            <Button
              onClick={(e: any) => submitRestore(e)}
              disabled={restoring || !restoreCommentId.trim()}
            >
              {restoring ? 'Restoring…' : 'Restore'}
            </Button>
          </>
        }
      >
        <form onSubmit={submitRestore} style={{ display: 'grid', gap: 12 }}>
          <Field>
            <Label>Comment ID</Label>
            <Input
              value={restoreCommentId}
              onChange={(e: any) => setRestoreCommentId(e.target.value)}
              placeholder='Enter comment ID to restore'
            />
          </Field>
        </form>
      </Modal>
    </section>
  );
}
