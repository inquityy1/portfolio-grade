import { useMemo, useState } from 'react';
import { Button, Label, Input, Textarea, Select, Checkbox, Field } from '@portfolio-grade/ui-kit';
import { useNavigate } from 'react-router-dom';

type FieldModel = {
  id: string;
  label: string;
  type: 'input' | 'textarea' | 'select' | 'checkbox' | string;
  order?: number | null;
  config?: Record<string, unknown> | null;
};

type Props = {
  fields: FieldModel[];
  onSubmit: (values: Record<string, unknown>) => void;
  submitting?: boolean;
};

export default function FormRenderer({ fields, onSubmit, submitting }: Props) {
  const [values, setValues] = useState<Record<string, unknown>>({});
  const navigate = useNavigate();

  const ordered = useMemo(
    () => [...fields].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [fields],
  );
  const keyFor = (f: FieldModel) => (f.config as any)?.name || f.label;

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
        const key = keyFor(f);
        const conf = (f.config ?? {}) as any;
        const placeholder = conf.placeholder ?? '';
        const required = !!conf.required;

        switch (String(f.type).toLowerCase()) {
          case 'textarea':
            return (
              <Field key={f.id}>
                <Label>{f.label}</Label>
                <Textarea
                  rows={conf.rows ?? 4}
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
            const options: string[] = Array.isArray(conf.options) ? conf.options : [];
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
