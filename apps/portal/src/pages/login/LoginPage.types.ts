export type LoginCredentials = {
  email: string;
  password: string;
};

export type LoginResponse = {
  access_token: string;
};

export type UserMembership = {
  organizationId: string;
  role: string;
  organization: { name: string };
};

export type UserProfile = {
  id: string;
  email: string;
  memberships: UserMembership[];
};
