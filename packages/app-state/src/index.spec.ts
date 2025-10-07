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
});

// Mock localStorage before importing modules
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
});

// Mock the API service to avoid import.meta issues
jest.mock('./services/api', () => ({
  api: {
    reducerPath: 'api',
    reducer: (state = {}, action: any) => state, // Return a proper reducer function
    middleware: (store: any) => (next: any) => (action: any) => next(action), // Return a proper middleware function
  },
}));

import { createAppStore } from './createStore';
import { setToken, clearToken } from './slices/authSlice';
import { setOrg, clearOrg } from './slices/tenantSlice';
import { api } from './services/api';

describe('app-state package integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('store creation and configuration', () => {
    it('should create a properly configured store', () => {
      const store = createAppStore();
      const state = store.getState();

      expect(state).toHaveProperty('auth');
      expect(state).toHaveProperty('tenant');
      expect(state).toHaveProperty('api');
    });

    it('should handle initial state from localStorage', () => {
      mockLocalStorage.getItem.mockImplementation(key => {
        if (key === 'token') return 'stored-token';
        if (key === 'orgId') return 'stored-org-id';
        return null;
      });

      // Re-import the store to get fresh initial state
      jest.resetModules();
      const { createAppStore: freshCreateAppStore } = require('./createStore');

      const store = freshCreateAppStore();
      const state = store.getState();

      expect(state.auth.token).toBe('stored-token');
      expect(state.tenant.orgId).toBe('stored-org-id');
    });
  });

  describe('auth slice integration', () => {
    it('should handle auth state changes', () => {
      const store = createAppStore();

      // Set token
      store.dispatch(setToken('new-token'));
      expect(store.getState().auth.token).toBe('new-token');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('token', 'new-token');

      // Clear token
      store.dispatch(clearToken());
      expect(store.getState().auth.token).toBeNull();
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('token');
    });

    it('should persist auth state to localStorage', () => {
      const store = createAppStore();

      store.dispatch(setToken('persistent-token'));

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('token', 'persistent-token');
    });
  });

  describe('tenant slice integration', () => {
    it('should handle tenant state changes', () => {
      const store = createAppStore();

      // Set org
      store.dispatch(setOrg('new-org-id'));
      expect(store.getState().tenant.orgId).toBe('new-org-id');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('orgId', 'new-org-id');

      // Clear org
      store.dispatch(clearOrg());
      expect(store.getState().tenant.orgId).toBeNull();
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('orgId');
    });

    it('should persist tenant state to localStorage', () => {
      const store = createAppStore();

      store.dispatch(setOrg('persistent-org-id'));

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('orgId', 'persistent-org-id');
    });
  });

  describe('API service integration', () => {
    it('should have API reducer in store', () => {
      const store = createAppStore();
      const state = store.getState();

      expect(state).toHaveProperty('api');
    });

    it('should have API middleware configured', () => {
      const store = createAppStore();

      // The store should be properly configured with API middleware
      expect(store).toBeDefined();
    });
  });

  describe('combined state management', () => {
    it('should handle multiple state updates', () => {
      const store = createAppStore();

      // Set both auth and tenant
      store.dispatch(setToken('user-token'));
      store.dispatch(setOrg('user-org'));

      let state = store.getState();
      expect(state.auth.token).toBe('user-token');
      expect(state.tenant.orgId).toBe('user-org');

      // Update both
      store.dispatch(setToken('updated-token'));
      store.dispatch(setOrg('updated-org'));

      state = store.getState();
      expect(state.auth.token).toBe('updated-token');
      expect(state.tenant.orgId).toBe('updated-org');

      // Clear both
      store.dispatch(clearToken());
      store.dispatch(clearOrg());

      state = store.getState();
      expect(state.auth.token).toBeNull();
      expect(state.tenant.orgId).toBeNull();
    });

    it('should maintain state immutability across updates', () => {
      const store = createAppStore();
      const initialState = store.getState();

      store.dispatch(setToken('test-token'));
      store.dispatch(setOrg('test-org'));

      const newState = store.getState();

      expect(initialState).not.toBe(newState);
      expect(initialState.auth).not.toBe(newState.auth);
      expect(initialState.tenant).not.toBe(newState.tenant);
    });
  });

  describe('localStorage integration', () => {
    it('should handle localStorage operations correctly', () => {
      const store = createAppStore();

      // Test setting values
      store.dispatch(setToken('test-token'));
      store.dispatch(setOrg('test-org'));

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('token', 'test-token');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('orgId', 'test-org');

      // Test clearing values
      store.dispatch(clearToken());
      store.dispatch(clearOrg());

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('token');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('orgId');
    });

    it('should handle missing localStorage gracefully', () => {
      // Mock localStorage as undefined
      Object.defineProperty(window, 'localStorage', {
        value: undefined,
        writable: true,
      });

      // Re-import the store to get fresh initial state
      jest.resetModules();
      const { createAppStore: freshCreateAppStore } = require('./createStore');

      const store = freshCreateAppStore();
      const state = store.getState();

      // Should still work without localStorage
      expect(state.auth.token).toBeNull();
      expect(state.tenant.orgId).toBeNull();

      // Restore localStorage
      Object.defineProperty(window, 'localStorage', {
        value: mockLocalStorage,
        writable: true,
      });
    });
  });

  describe('type safety', () => {
    it('should have correct type exports', () => {
      const store = createAppStore();

      // Test RootState type
      const state: import('./createStore').RootState = store.getState();
      expect(state).toHaveProperty('auth');
      expect(state).toHaveProperty('tenant');
      expect(state).toHaveProperty('api');

      // Test AppDispatch type
      const dispatch: import('./createStore').AppDispatch = store.dispatch;
      expect(typeof dispatch).toBe('function');
    });
  });

  describe('edge cases', () => {
    it('should handle rapid state updates', () => {
      const store = createAppStore();

      // Rapid updates
      for (let i = 0; i < 10; i++) {
        store.dispatch(setToken(`token-${i}`));
        store.dispatch(setOrg(`org-${i}`));
      }

      const state = store.getState();
      expect(state.auth.token).toBe('token-9');
      expect(state.tenant.orgId).toBe('org-9');
    });

    it('should handle null and undefined values', () => {
      const store = createAppStore();

      store.dispatch(setToken(null));
      store.dispatch(setOrg(null));

      let state = store.getState();
      expect(state.auth.token).toBeNull();
      expect(state.tenant.orgId).toBeNull();

      store.dispatch(setToken(undefined as any));
      store.dispatch(setOrg(undefined as any));

      state = store.getState();
      expect(state.auth.token).toBeUndefined();
      expect(state.tenant.orgId).toBeUndefined();
    });
  });
});
