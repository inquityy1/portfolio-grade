import { createSlice, PayloadAction } from '@reduxjs/toolkit'

type TenantState = { orgId: string | null }

const initialState: TenantState = {
    orgId: typeof localStorage !== 'undefined' ? localStorage.getItem('orgId') : null,
}

const tenantSlice = createSlice({
    name: 'tenant',
    initialState,
    reducers: {
        setOrg(state, action: PayloadAction<string | null>) {
            state.orgId = action.payload
            if (typeof localStorage !== 'undefined') {
                if (action.payload) localStorage.setItem('orgId', action.payload)
                else localStorage.removeItem('orgId')
            }
        },
        clearOrg(state) {
            state.orgId = null
            if (typeof localStorage !== 'undefined') localStorage.removeItem('orgId')
        },
    },
})

export const { setOrg, clearOrg } = tenantSlice.actions
export default tenantSlice.reducer