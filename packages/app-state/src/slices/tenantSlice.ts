import { createSlice, PayloadAction } from '@reduxjs/toolkit'

type TenantState = { orgId: string }
const initialState: TenantState = {
    orgId: (typeof localStorage !== 'undefined' && localStorage.getItem('orgId')) || 'org-a',
}

const slice = createSlice({
    name: 'tenant',
    initialState,
    reducers: {
        setOrg(state, action: PayloadAction<string>) {
            state.orgId = action.payload
            if (typeof localStorage !== 'undefined') localStorage.setItem('orgId', action.payload)
        },
    },
})

export const { setOrg } = slice.actions
export default slice.reducer