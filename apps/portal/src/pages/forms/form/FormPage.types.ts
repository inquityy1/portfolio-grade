export type FieldModel = {
  id: string;
  label: string;
  type: 'input' | 'textarea' | 'select' | 'checkbox' | string;
  order?: number | null;
  config?: Record<string, unknown> | null;
};

export type FormData = {
  id: string;
  name: string;
  schema: Record<string, unknown>;
};

export type FormSubmissionData = Record<string, unknown>;

export type FormSubmissionResponse = {
  id: string;
  formId: string;
  data: FormSubmissionData;
};
