import axios from 'axios';
import { createApiUrl } from '@portfolio-grade/shared';
import type { UserWithMemberships, Post, Comment, Tag } from './PostsPage.types';

/**
 * Generate idempotency key for API requests
 */
export function generateIdempotencyKey(prefix: string): string {
  return `${prefix}:${Date.now()}:${Math.random().toString(36).slice(2)}`;
}

/**
 * Get authentication tokens from localStorage
 */
export function getAuthTokens(): { token: string; orgId: string } {
  return {
    token: localStorage.getItem('token') || localStorage.getItem('accessToken') || '',
    orgId: localStorage.getItem('orgId') || localStorage.getItem('orgid') || '',
  };
}

/**
 * Create authentication headers for API requests
 */
export function createAuthHeaders(): Record<string, string> {
  const { token, orgId } = getAuthTokens();
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (orgId) headers['x-org-id'] = orgId;
  return headers;
}

/**
 * Fetch user roles and memberships
 */
export async function fetchUserRoles(
  token: string | null,
  signal?: AbortSignal,
): Promise<UserWithMemberships | null> {
  if (!token) return null;
  try {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;

    const orgId = typeof localStorage !== 'undefined' ? localStorage.getItem('orgId') : null;
    if (orgId) headers['x-org-id'] = orgId;

    const { data } = await axios.get(createApiUrl('/auth/me'), {
      headers,
      signal,
    });
    return data;
  } catch {
    return null;
  }
}

/**
 * Check if user has editor or admin rights
 */
export function hasEditorRights(memberships: Array<{ role: string }> | undefined): boolean {
  if (!memberships) return false;
  const roles = new Set(memberships.map(m => m.role));
  return roles.has('Editor') || roles.has('OrgAdmin');
}

/**
 * Load tags from API
 */
export async function loadTags(): Promise<Tag[]> {
  try {
    const { data } = await axios.get(createApiUrl('/tags'), { headers: createAuthHeaders() });
    const arr = Array.isArray(data) ? data : [];
    return arr.map((t: any) => ({
      id: String(t.id),
      name: String(t.name),
    }));
  } catch (e: any) {
    console.error('Failed to load tags:', e);
    return [];
  }
}

/**
 * Load posts from API
 */
export async function loadPosts(
  selectedTagId?: string,
): Promise<{ posts: Post[]; error: string | null }> {
  try {
    const url = selectedTagId
      ? createApiUrl(`/posts?tagId=${selectedTagId}`)
      : createApiUrl('/posts');
    const { data } = await axios.get(url, { headers: createAuthHeaders() });
    const arr = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
    const posts: Post[] = arr.map((p: any) => ({
      id: String(p.id),
      title: p.title ?? null,
      content: p.content ?? null,
      authorName: p.author?.name ?? null,
      createdAt: p.createdAt ?? null,
      updatedAt: p.updatedAt ?? null,
      version: p.version ?? 1,
      tags: Array.isArray(p.tags)
        ? p.tags.map((t: any) => ({
            id: String(t.id ?? t.tagId ?? t.name),
            name: String(t.name ?? t.tag?.name ?? ''),
          }))
        : [],
    }));
    return { posts, error: null };
  } catch (e: any) {
    return {
      posts: [],
      error: e?.response?.data?.message || e.message || 'Failed to load posts',
    };
  }
}

/**
 * Load comments for a specific post
 */
export async function loadComments(postId: string): Promise<Comment[]> {
  try {
    const { data } = await axios.get(createApiUrl(`/posts/${postId}/comments`), {
      headers: createAuthHeaders(),
    });
    const arr: Comment[] = (
      Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : []
    ).map((c: any) => ({
      id: String(c.id),
      content: String(c.content ?? ''),
      authorId: c.authorId ?? c.author?.id ?? null,
      authorName: c.author?.name ?? null,
      createdAt: c.createdAt ?? null,
    }));
    return arr;
  } catch {
    return [];
  }
}

/**
 * Add a comment to a post
 */
export async function addComment(postId: string, content: string): Promise<void> {
  if (!content.trim()) return;

  await axios.post(
    createApiUrl(`/posts/${postId}/comments`),
    { content },
    {
      headers: {
        ...createAuthHeaders(),
        'Content-Type': 'application/json',
        'Idempotency-Key': generateIdempotencyKey(`comment:create:${postId}`),
      },
    },
  );
}

/**
 * Update a comment
 */
export async function updateComment(commentId: string, content: string): Promise<void> {
  await axios.patch(
    createApiUrl(`/comments/${commentId}`),
    { content },
    {
      headers: {
        ...createAuthHeaders(),
        'Content-Type': 'application/json',
        'Idempotency-Key': generateIdempotencyKey(`comment:update:${commentId}`),
      },
    },
  );
}

/**
 * Delete a comment
 */
export async function deleteComment(commentId: string): Promise<void> {
  await axios.delete(createApiUrl(`/comments/${commentId}`), {
    headers: {
      ...createAuthHeaders(),
      'Idempotency-Key': generateIdempotencyKey(`comment:delete:${commentId}`),
    },
  });
}

/**
 * Restore a deleted comment
 */
export async function restoreComment(commentId: string): Promise<{ postId?: string }> {
  const { data } = await axios.post(
    createApiUrl(`/comments/${commentId}/restore`),
    {},
    {
      headers: {
        ...createAuthHeaders(),
        'Content-Type': 'application/json',
        'Idempotency-Key': generateIdempotencyKey(`comment:restore:${commentId}`),
      },
    },
  );
  return data;
}

/**
 * Delete a post
 */
export async function deletePost(postId: string): Promise<void> {
  await axios.delete(createApiUrl(`/posts/${postId}`), {
    headers: {
      ...createAuthHeaders(),
      'Idempotency-Key': generateIdempotencyKey(`post:delete:${postId}`),
    },
  });
}

/**
 * Create a new post
 */
export async function createPost(title: string, content: string, tagIds: string[]): Promise<void> {
  await axios.post(
    createApiUrl('/posts'),
    { title, content, tagIds },
    {
      headers: {
        ...createAuthHeaders(),
        'Content-Type': 'application/json',
        'Idempotency-Key': generateIdempotencyKey('post:create'),
      },
    },
  );
}

/**
 * Update an existing post
 */
export async function updatePost(
  postId: string,
  title: string,
  content: string,
  version: number,
): Promise<void> {
  await axios.patch(
    createApiUrl(`/posts/${postId}`),
    { title, content, version },
    {
      headers: {
        ...createAuthHeaders(),
        'Content-Type': 'application/json',
        'Idempotency-Key': generateIdempotencyKey(`post:update:${postId}`),
      },
    },
  );
}
