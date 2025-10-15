export type FieldModel = {
  id: string;
  label: string;
  type: 'input' | 'textarea' | 'select' | 'checkbox' | string;
  order?: number | null;
  config?: Record<string, unknown> | null;
};

export type FormRendererProps = {
  fields: FieldModel[];
  onSubmit: (values: Record<string, unknown>) => void;
  submitting?: boolean;
};
