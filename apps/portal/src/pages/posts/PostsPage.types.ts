export type Membership = {
  organizationId: string;
  role: string;
  organization: { name: string };
};

export type UserWithMemberships = {
  id: string;
  email: string;
  memberships: Membership[];
};

export type Post = {
  id: string;
  title?: string | null;
  content?: string | null;
  authorName?: string | null;
  updatedAt?: string | null;
  createdAt?: string | null;
  version?: number;
  tags?: { id: string; name: string }[];
};

export type Comment = {
  id: string;
  content: string;
  authorId?: string | null;
  authorName?: string | null;
  createdAt?: string | null;
};

export type Tag = {
  id: string;
  name: string;
};
