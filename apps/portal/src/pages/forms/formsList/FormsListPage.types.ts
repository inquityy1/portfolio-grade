export type FormSummary = {
  id: string;
  name: string;
  description?: string | null;
  status?: string | null;
  updatedAt?: string | null;
};

export type UserMembership = {
  organizationId: string;
  role: string;
  organization: { name: string };
};

export type UserWithMemberships = {
  id: string;
  email: string;
  memberships: UserMembership[];
};

export type FormsListProps = {
  flashMessage?: string;
};
