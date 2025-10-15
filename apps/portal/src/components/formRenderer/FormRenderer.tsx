import { useMemo, useState } from 'react';
import { Button, Label, Input, Textarea, Select, Checkbox, Field } from '@portfolio-grade/ui-kit';
import { useNavigate } from 'react-router-dom';
import type { FormRendererProps } from './FormRenderer.types';
import {
  sortFieldsByOrder,
  getFieldKey,
  getFieldConfig,
  getFieldPlaceholder,
  isFieldRequired,
  getSelectOptions,
} from './FormRenderer.utils';

export default function FormRenderer({ fields, onSubmit, submitting }: FormRendererProps) {
  const [values, setValues] = useState<Record<string, unknown>>({});
  const navigate = useNavigate();

  const ordered = useMemo(() => sortFieldsByOrder(fields), [fields]);

  function update(key: string, value: unknown) {
    setValues(v => ({ ...v, [key]: value }));
  }

  return (
    <form
      onSubmit={e => {
        e.preventDefault();
        onSubmit(values);
      }}
      style={{ display: 'grid', gap: 12, maxWidth: 560 }}
    >
      {ordered.map(f => {
        const key = getFieldKey(f);
        const placeholder = getFieldPlaceholder(f);
        const required = isFieldRequired(f);

        switch (String(f.type).toLowerCase()) {
          case 'textarea':
            return (
              <Field key={f.id}>
                <Label>{f.label}</Label>
                <Textarea
                  rows={getFieldConfig(f).rows ?? 4}
                  placeholder={placeholder}
                  required={required}
                  value={(values[key] as string) ?? ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    update(key, e.target.value)
                  }
                />
              </Field>
            );
          case 'checkbox':
            return (
              <Field key={f.id}>
                <Label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Checkbox
                    checked={!!values[key]}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      update(key, e.target.checked)
                    }
                  />
                  {f.label}
                </Label>
              </Field>
            );
          case 'select': {
            const options = getSelectOptions(f);
            return (
              <Field key={f.id}>
                <Label>{f.label}</Label>
                <Select
                  value={(values[key] as string) ?? ''}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    update(key, e.target.value)
                  }
                  required={required}
                >
                  <option value='' disabled>
                    Select…
                  </option>
                  {options.map(opt => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </Select>
              </Field>
            );
          }
          default:
            return (
              <Field key={f.id}>
                <Label>{f.label}</Label>
                <Input
                  placeholder={placeholder}
                  required={required}
                  value={(values[key] as string) ?? ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => update(key, e.target.value)}
                />
              </Field>
            );
        }
      })}

      <div style={{ display: 'flex', gap: 12 }}>
        <Button type='submit' disabled={submitting}>
          {submitting ? 'Submitting…' : 'Submit'}
        </Button>
        <Button onClick={() => navigate('/')}>Back to Forms</Button>
      </div>
    </form>
  );
}
