import { useMemo, useState } from 'react'
import type { Field } from '@portfolio-grade/app-state'
import { Button } from '@portfolio-grade/ui-kit'

type Props = {
    fields: Field[]
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
            onSubmit={(e) => {
                e.preventDefault()
                onSubmit(values)
            }}
            style={{ display: 'grid', gap: 12, maxWidth: 560 }}
        >
            {ordered.map((f) => {
                const key = f.label
                if (f.type === 'textarea') {
                    return (
                        <div key={f.id} style={{ display: 'flex', flexDirection: 'column' }}>
                            <label style={{ marginBottom: 4 }}>{f.label}</label>
                            <textarea
                                rows={4}
                                style={{ padding: 8 }}
                                onChange={(e) => update(key, e.target.value)}
                            />
                        </div>
                    )
                }
                return (
                    <div key={f.id} style={{ display: 'flex', flexDirection: 'column' }}>
                        <label style={{ marginBottom: 4 }}>{f.label}</label>
                        <input
                            type="text"
                            style={{ padding: 8 }}
                            onChange={(e) => update(key, e.target.value)}
                        />
                    </div>
                )
            })}

            <Button type="submit" disabled={submitting}>
                {submitting ? 'Submitting…' : 'Submit'}
            </Button>
        </form>
    )
}