import { useMemo, useState } from 'react'
import type { Field as FieldModel } from '@portfolio-grade/app-state'
import { Button, Label, Input, Textarea, Select, Checkbox, Field } from '@portfolio-grade/ui-kit'

type Props = {
    fields: FieldModel[]
    onSubmit: (data: Record<string, unknown>) => void
    submitting?: boolean
}

export default function FormRenderer({ fields, onSubmit, submitting }: Props) {
    const [values, setValues] = useState<Record<string, unknown>>({})

    const ordered = useMemo(
        () => [...fields].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
        [fields]
    )

    function update(key: string, value: unknown) {
        setValues((prev) => ({ ...prev, [key]: value }))
    }

    return (
        <form
            onSubmit={(e) => { e.preventDefault(); onSubmit(values) }}
            style={{ display: 'grid', gap: 12, maxWidth: 560 }}
        >
            {ordered.map((f) => {
                const key = f.label // (later: use a stable "name" column)
                const conf = (f.config ?? {}) as any
                const placeholder = conf.placeholder ?? ''

                switch (f.type) {
                    case 'textarea':
                        return (
                            <Field key={f.id}>
                                <Label>{f.label}</Label>
                                <Textarea
                                    rows={conf.rows ?? 4}
                                    placeholder={placeholder}
                                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => update(key, e.target.value)}
                                />
                            </Field>
                        )
                    case 'checkbox':
                        return (
                            <Field key={f.id}>
                                <Label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Checkbox onChange={(e: React.ChangeEvent<HTMLInputElement>) => update(key, e.target.checked)} />
                                    {f.label}
                                </Label>
                            </Field>
                        )
                    case 'select': {
                        const options: string[] = Array.isArray(conf.options) ? conf.options : []
                        return (
                            <Field key={f.id}>
                                <Label>{f.label}</Label>
                                <Select onChange={(e: React.ChangeEvent<HTMLSelectElement>) => update(key, e.target.value)} defaultValue="">
                                    <option value="" disabled>Select…</option>
                                    {options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                                </Select>
                            </Field>
                        )
                    }
                    default:
                        return (
                            <Field key={f.id}>
                                <Label>{f.label}</Label>
                                <Input
                                    placeholder={placeholder}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => update(key, e.target.value)}
                                />
                            </Field>
                        )
                }
            })}

            <Button type="submit" disabled={submitting}>
                {submitting ? 'Submitting…' : 'Submit'}
            </Button>
        </form>
    )
}