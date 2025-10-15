import type { FieldModel } from './FormRenderer.types';

export function sortFieldsByOrder(fields: FieldModel[]): FieldModel[] {
  return [...fields].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

export function getFieldKey(field: FieldModel): string {
  return (field.config as any)?.name || field.label;
}

export function getFieldConfig(field: FieldModel) {
  return (field.config ?? {}) as any;
}

export function getFieldPlaceholder(field: FieldModel): string {
  const conf = getFieldConfig(field);
  return conf.placeholder ?? '';
}

export function isFieldRequired(field: FieldModel): boolean {
  const conf = getFieldConfig(field);
  return !!conf.required;
}

export function getSelectOptions(field: FieldModel): string[] {
  const conf = getFieldConfig(field);
  return Array.isArray(conf.options) ? conf.options : [];
}
