import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

const API_BASE = (import.meta as any)?.env?.VITE_API_URL ?? 'http://localhost:3000/api'

export type Field = {
    id: string
    formId: string
    label: string
    type: string
    order: number
    config?: Record<string, unknown> | null
}

export type FormDto = {
    id: string
    name: string
    schema: Record<string, unknown>
    fields: Field[]
}

const getToken = () => (typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null)
const getOrgId = () => (typeof localStorage !== 'undefined' ? localStorage.getItem('orgId') || 'org-a' : 'org-a')

export const api = createApi({
    reducerPath: 'api',
    baseQuery: fetchBaseQuery({
        baseUrl: API_BASE,
        prepareHeaders: (headers) => {
            const token = getToken()
            const orgId = getOrgId()
            if (orgId) headers.set('X-Org-Id', orgId)
            if (token) headers.set('Authorization', `Bearer ${token}`)
            headers.set('Content-Type', 'application/json')
            return headers
        },
    }),
    tagTypes: ['Form', 'Submission'],
    endpoints: (builder) => ({
        getFormPublic: builder.query<FormDto, string>({
            query: (id) => `/public/forms/${id}`,
            providesTags: (_res, _err, id) => [{ type: 'Form', id }],
        }),
        submitForm: builder.mutation<{ id: string }, { id: string; data: Record<string, unknown> }>({
            query: ({ id, data }) => ({
                url: `/public/forms/${id}/submit`,
                method: 'POST',
                body: { data },
            }),
            invalidatesTags: (_res, _err, { id }) => [{ type: 'Form', id }],
        }),

        login: builder.mutation<{ access_token: string }, { email: string; password: string }>({
            query: (body) => ({ url: '/auth/login', method: 'POST', body }),
        }),
        register: builder.mutation<{ access_token: string }, { email: string; password: string; name?: string }>({
            query: (body) => ({ url: '/auth/register', method: 'POST', body }),
        }),
        me: builder.query<{
            id: string;
            email: string;
            memberships: { organizationId: string; role: string; organization: { name: string } }[];
        }, void>({
            query: () => '/auth/me',
        }),
    }),
})

export const { useGetFormPublicQuery, useSubmitFormMutation, useLoginMutation, useRegisterMutation, useMeQuery } = api