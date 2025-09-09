import { useParams } from 'react-router-dom'
import { useGetFormPublicQuery, useSubmitFormMutation } from '@portfolio-grade/app-state'
import FormRenderer from '../components/formRenderer/FormRenderer'

export default function FormPage() {
    const { id = '' } = useParams()
    const { data, isLoading, isError } = useGetFormPublicQuery(id, { skip: !id })
    const [submit, { isLoading: submitting }] = useSubmitFormMutation()

    if (!id) return <div style={{ padding: 24 }}>Missing form id</div>
    if (isLoading) return <div style={{ padding: 24 }}>Loading…</div>
    if (isError || !data) return <div style={{ padding: 24 }}>Form not found</div>

    return (
        <div style={{ padding: 24 }}>
            <h1 style={{ marginBottom: 16 }}>{data.name}</h1>
            <FormRenderer
                fields={data.fields ?? []}
                submitting={submitting}
                onSubmit={(payload) =>
                    submit({ id, data: payload })
                        .unwrap()
                        .then(() => alert('Thanks! Submission saved.'))
                        .catch((e) => alert(e?.data?.message ?? 'Submit failed'))
                }
            />
        </div>
    )
}