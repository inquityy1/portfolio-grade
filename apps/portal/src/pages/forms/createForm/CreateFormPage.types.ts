export type CreateFormData = {
  name: string;
  schema: Record<string, unknown>;
};

export type CreateFormResponse = {
  id: string;
  name: string;
  schema: Record<string, unknown>;
};

export type FormValidationError = {
  message: string;
  field?: string;
};
