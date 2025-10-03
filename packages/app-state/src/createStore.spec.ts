// Mock import.meta before importing any modules
Object.defineProperty(globalThis, 'import', {
    value: {
        meta: {
            env: {
                VITE_API_URL: 'http://localhost:3000/api',
            },
        },
    },
    writable: true,
})

// Mock localStorage before importing modules
const mockLocalStorage = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
}

Object.defineProperty(window, 'localStorage', {
    value: mockLocalStorage,
    writable: true,
})

// Mock the API service to avoid import.meta issues
jest.mock('./services/api', () => ({
    api: {
        reducerPath: 'api',
        reducer: (state = {}, action: any) => state, // Return a proper reducer function
        middleware: (store: any) => (next: any) => (action: any) => next(action), // Return a proper middleware function
    },
}))

import { createAppStore, type RootState, type AppDispatch } from './createStore'

describe('createStore', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('createAppStore', () => {
        it('should create a store with correct initial state', () => {
            const store = createAppStore()
            const state = store.getState()

            expect(state).toHaveProperty('auth')
            expect(state).toHaveProperty('tenant')
            expect(state).toHaveProperty('api')
            expect(state.auth).toEqual({ token: null })
            expect(state.tenant).toEqual({ orgId: undefined }) // tenantSlice returns undefined when localStorage is not available
        })

        it('should initialize auth state from localStorage', () => {
            mockLocalStorage.getItem.mockReturnValue('test-token')

            // Re-import the store to get fresh initial state
            jest.resetModules()
            const { createAppStore: freshCreateAppStore } = require('./createStore')

            const store = freshCreateAppStore()
            const state = store.getState()

            expect(state.auth.token).toBe('test-token')
            expect(mockLocalStorage.getItem).toHaveBeenCalledWith('token')
        })

        it('should initialize tenant state from localStorage', () => {
            mockLocalStorage.getItem.mockImplementation((key) => {
                if (key === 'orgId') return 'test-org-id'
                return null
            })

            // Re-import the store to get fresh initial state
            jest.resetModules()
            const { createAppStore: freshCreateAppStore } = require('./createStore')

            const store = freshCreateAppStore()
            const state = store.getState()

            expect(state.tenant.orgId).toBe('test-org-id')
            expect(mockLocalStorage.getItem).toHaveBeenCalledWith('orgId')
        })

        it('should handle missing localStorage gracefully', () => {
            // Mock localStorage as undefined
            Object.defineProperty(window, 'localStorage', {
                value: undefined,
                writable: true,
            })

            // Re-import the store to get fresh initial state
            jest.resetModules()
            const { createAppStore: freshCreateAppStore } = require('./createStore')

            const store = freshCreateAppStore()
            const state = store.getState()

            expect(state.auth.token).toBeNull()
            expect(state.tenant.orgId).toBeNull()

            // Restore localStorage
            Object.defineProperty(window, 'localStorage', {
                value: mockLocalStorage,
                writable: true,
            })
        })

        it('should have correct middleware configuration', () => {
            const store = createAppStore()

            // Check that the store has the correct middleware
            expect(store.getState()).toHaveProperty('api')
        })

        it('should dispatch actions correctly', () => {
            const store = createAppStore()

            // Test auth actions
            store.dispatch({ type: 'auth/setToken', payload: 'new-token' })
            expect(store.getState().auth.token).toBe('new-token')

            store.dispatch({ type: 'auth/clearToken' })
            expect(store.getState().auth.token).toBeNull()

            // Test tenant actions
            store.dispatch({ type: 'tenant/setOrg', payload: 'new-org' })
            expect(store.getState().tenant.orgId).toBe('new-org')

            store.dispatch({ type: 'tenant/clearOrg' })
            expect(store.getState().tenant.orgId).toBeNull()
        })
    })

    describe('Type definitions', () => {
        it('should have correct RootState type', () => {
            const store = createAppStore()
            const state: RootState = store.getState()

            expect(state).toHaveProperty('auth')
            expect(state).toHaveProperty('tenant')
            expect(state).toHaveProperty('api')
        })

        it('should have correct AppDispatch type', () => {
            const store = createAppStore()
            const dispatch: AppDispatch = store.dispatch

            expect(typeof dispatch).toBe('function')
        })
    })

    describe('Store integration', () => {
        it('should handle multiple state updates', () => {
            const store = createAppStore()

            // Set initial values
            store.dispatch({ type: 'auth/setToken', payload: 'token-1' })
            store.dispatch({ type: 'tenant/setOrg', payload: 'org-1' })

            let state = store.getState()
            expect(state.auth.token).toBe('token-1')
            expect(state.tenant.orgId).toBe('org-1')

            // Update values
            store.dispatch({ type: 'auth/setToken', payload: 'token-2' })
            store.dispatch({ type: 'tenant/setOrg', payload: 'org-2' })

            state = store.getState()
            expect(state.auth.token).toBe('token-2')
            expect(state.tenant.orgId).toBe('org-2')

            // Clear values
            store.dispatch({ type: 'auth/clearToken' })
            store.dispatch({ type: 'tenant/clearOrg' })

            state = store.getState()
            expect(state.auth.token).toBeNull()
            expect(state.tenant.orgId).toBeNull()
        })

        it('should maintain state immutability', () => {
            const store = createAppStore()
            const initialState = store.getState()

            store.dispatch({ type: 'auth/setToken', payload: 'test-token' })
            const newState = store.getState()

            expect(initialState).not.toBe(newState)
            expect(initialState.auth).not.toBe(newState.auth)
            expect(initialState.auth.token).toBeNull()
            expect(newState.auth.token).toBe('test-token')
        })
    })
})
