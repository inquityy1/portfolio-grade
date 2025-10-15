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
