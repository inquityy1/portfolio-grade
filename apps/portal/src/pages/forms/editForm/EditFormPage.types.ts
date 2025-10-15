export type FormData = {
  id: string;
  name: string;
  schema: Record<string, unknown>;
};

export type UpdateFormData = {
  name: string;
  schema: Record<string, unknown>;
};

export type UpdateFormResponse = {
  id: string;
  name: string;
  schema: Record<string, unknown>;
};

export type FormValidationError = {
  message: string;
  field?: string;
};
