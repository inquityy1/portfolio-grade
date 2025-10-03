// Mock localStorage before importing the slice
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

import authReducer, { setToken, clearToken } from './authSlice'

describe('authSlice', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('initial state', () => {
        it('should have correct initial state when localStorage is empty', () => {
            mockLocalStorage.getItem.mockReturnValue(null)

            // Re-import the slice to get fresh initial state
            jest.resetModules()
            const { default: freshAuthReducer } = require('./authSlice')

            const state = freshAuthReducer(undefined, { type: 'unknown' })

            expect(state).toEqual({ token: null })
        })

        it('should initialize with token from localStorage', () => {
            mockLocalStorage.getItem.mockReturnValue('stored-token')

            // Re-import the slice to get fresh initial state
            jest.resetModules()
            const { default: freshAuthReducer } = require('./authSlice')

            const state = freshAuthReducer(undefined, { type: 'unknown' })

            expect(state).toEqual({ token: 'stored-token' })
        })

        it('should handle missing localStorage gracefully', () => {
            // Mock localStorage as undefined
            Object.defineProperty(window, 'localStorage', {
                value: undefined,
                writable: true,
            })

            // Re-import the slice to get fresh initial state
            jest.resetModules()
            const { default: freshAuthReducer } = require('./authSlice')

            const state = freshAuthReducer(undefined, { type: 'unknown' })

            expect(state).toEqual({ token: null })

            // Restore localStorage
            Object.defineProperty(window, 'localStorage', {
                value: mockLocalStorage,
                writable: true,
            })
        })
    })

    describe('setToken action', () => {
        it('should set token in state and localStorage', () => {
            const initialState = { token: null }
            const action = setToken('new-token')

            const newState = authReducer(initialState, action)

            expect(newState.token).toBe('new-token')
            expect(mockLocalStorage.setItem).toHaveBeenCalledWith('token', 'new-token')
        })

        it('should update existing token', () => {
            const initialState = { token: 'old-token' }
            const action = setToken('new-token')

            const newState = authReducer(initialState, action)

            expect(newState.token).toBe('new-token')
            expect(mockLocalStorage.setItem).toHaveBeenCalledWith('token', 'new-token')
        })

        it('should set token to null and remove from localStorage', () => {
            const initialState = { token: 'existing-token' }
            const action = setToken(null)

            const newState = authReducer(initialState, action)

            expect(newState.token).toBeNull()
            expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('token')
        })

        it('should handle empty string token', () => {
            const initialState = { token: null }
            const action = setToken('')

            const newState = authReducer(initialState, action)

            expect(newState.token).toBe('')
            expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('token')
        })

        it('should handle missing localStorage gracefully', () => {
            // Mock localStorage as undefined
            Object.defineProperty(window, 'localStorage', {
                value: undefined,
                writable: true,
            })

            const initialState = { token: null }
            const action = setToken('test-token')

            const newState = authReducer(initialState, action)

            expect(newState.token).toBe('test-token')

            // Restore localStorage
            Object.defineProperty(window, 'localStorage', {
                value: mockLocalStorage,
                writable: true,
            })
        })
    })

    describe('clearToken action', () => {
        it('should clear token from state and localStorage', () => {
            const initialState = { token: 'existing-token' }
            const action = clearToken()

            const newState = authReducer(initialState, action)

            expect(newState.token).toBeNull()
            expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('token')
        })

        it('should handle clearing already null token', () => {
            const initialState = { token: null }
            const action = clearToken()

            const newState = authReducer(initialState, action)

            expect(newState.token).toBeNull()
            expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('token')
        })

        it('should handle missing localStorage gracefully', () => {
            // Mock localStorage as undefined
            Object.defineProperty(window, 'localStorage', {
                value: undefined,
                writable: true,
            })

            const initialState = { token: 'existing-token' }
            const action = clearToken()

            const newState = authReducer(initialState, action)

            expect(newState.token).toBeNull()

            // Restore localStorage
            Object.defineProperty(window, 'localStorage', {
                value: mockLocalStorage,
                writable: true,
            })
        })
    })

    describe('action creators', () => {
        it('should create setToken action with correct payload', () => {
            const action = setToken('test-token')

            expect(action).toEqual({
                type: 'auth/setToken',
                payload: 'test-token',
            })
        })

        it('should create clearToken action', () => {
            const action = clearToken()

            expect(action).toEqual({
                type: 'auth/clearToken',
            })
        })
    })

    describe('state immutability', () => {
        it('should not mutate original state', () => {
            const initialState = { token: 'original-token' }
            const action = setToken('new-token')

            const newState = authReducer(initialState, action)

            expect(initialState).not.toBe(newState)
            expect(initialState.token).toBe('original-token')
            expect(newState.token).toBe('new-token')
        })

        it('should handle multiple state updates', () => {
            let state = authReducer(undefined, { type: 'unknown' })

            state = authReducer(state, setToken('token-1'))
            expect(state.token).toBe('token-1')

            state = authReducer(state, setToken('token-2'))
            expect(state.token).toBe('token-2')

            state = authReducer(state, clearToken())
            expect(state.token).toBeNull()
        })
    })

    describe('edge cases', () => {
        it('should handle unknown action types', () => {
            const initialState = { token: 'test-token' }
            const action = { type: 'unknown/action' }

            const newState = authReducer(initialState, action)

            expect(newState).toBe(initialState)
        })
    })
})
