// Mock localStorage before importing the slice
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

import tenantReducer, { setOrg, clearOrg } from './tenantSlice';

describe('tenantSlice', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initial state', () => {
    it('should have correct initial state when localStorage is empty', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      // Re-import the slice to get fresh initial state
      jest.resetModules();
      const { default: freshTenantReducer } = require('./tenantSlice');

      const state = freshTenantReducer(undefined, { type: 'unknown' });

      expect(state).toEqual({ orgId: null });
    });

    it('should initialize with orgId from localStorage', () => {
      mockLocalStorage.getItem.mockReturnValue('stored-org-id');

      // Re-import the slice to get fresh initial state
      jest.resetModules();
      const { default: freshTenantReducer } = require('./tenantSlice');

      const state = freshTenantReducer(undefined, { type: 'unknown' });

      expect(state).toEqual({ orgId: 'stored-org-id' });
    });

    it('should handle missing localStorage gracefully', () => {
      // Mock localStorage as undefined
      Object.defineProperty(window, 'localStorage', {
        value: undefined,
        writable: true,
      });

      // Re-import the slice to get fresh initial state
      jest.resetModules();
      const { default: freshTenantReducer } = require('./tenantSlice');

      const state = freshTenantReducer(undefined, { type: 'unknown' });

      expect(state).toEqual({ orgId: null });

      // Restore localStorage
      Object.defineProperty(window, 'localStorage', {
        value: mockLocalStorage,
        writable: true,
      });
    });
  });

  describe('setOrg action', () => {
    it('should set orgId in state and localStorage', () => {
      const initialState = { orgId: null };
      const action = setOrg('new-org-id');

      const newState = tenantReducer(initialState, action);

      expect(newState.orgId).toBe('new-org-id');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('orgId', 'new-org-id');
    });

    it('should update existing orgId', () => {
      const initialState = { orgId: 'old-org-id' };
      const action = setOrg('new-org-id');

      const newState = tenantReducer(initialState, action);

      expect(newState.orgId).toBe('new-org-id');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('orgId', 'new-org-id');
    });

    it('should set orgId to null and remove from localStorage', () => {
      const initialState = { orgId: 'existing-org-id' };
      const action = setOrg(null);

      const newState = tenantReducer(initialState, action);

      expect(newState.orgId).toBeNull();
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('orgId');
    });

    it('should handle empty string orgId', () => {
      const initialState = { orgId: null };
      const action = setOrg('');

      const newState = tenantReducer(initialState, action);

      expect(newState.orgId).toBe('');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('orgId');
    });

    it('should handle missing localStorage gracefully', () => {
      // Mock localStorage as undefined
      Object.defineProperty(window, 'localStorage', {
        value: undefined,
        writable: true,
      });

      const initialState = { orgId: null };
      const action = setOrg('test-org-id');

      const newState = tenantReducer(initialState, action);

      expect(newState.orgId).toBe('test-org-id');

      // Restore localStorage
      Object.defineProperty(window, 'localStorage', {
        value: mockLocalStorage,
        writable: true,
      });
    });
  });

  describe('clearOrg action', () => {
    it('should clear orgId from state and localStorage', () => {
      const initialState = { orgId: 'existing-org-id' };
      const action = clearOrg();

      const newState = tenantReducer(initialState, action);

      expect(newState.orgId).toBeNull();
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('orgId');
    });

    it('should handle clearing already null orgId', () => {
      const initialState = { orgId: null };
      const action = clearOrg();

      const newState = tenantReducer(initialState, action);

      expect(newState.orgId).toBeNull();
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('orgId');
    });

    it('should handle missing localStorage gracefully', () => {
      // Mock localStorage as undefined
      Object.defineProperty(window, 'localStorage', {
        value: undefined,
        writable: true,
      });

      const initialState = { orgId: 'existing-org-id' };
      const action = clearOrg();

      const newState = tenantReducer(initialState, action);

      expect(newState.orgId).toBeNull();

      // Restore localStorage
      Object.defineProperty(window, 'localStorage', {
        value: mockLocalStorage,
        writable: true,
      });
    });
  });

  describe('action creators', () => {
    it('should create setOrg action with correct payload', () => {
      const action = setOrg('test-org-id');

      expect(action).toEqual({
        type: 'tenant/setOrg',
        payload: 'test-org-id',
      });
    });

    it('should create clearOrg action', () => {
      const action = clearOrg();

      expect(action).toEqual({
        type: 'tenant/clearOrg',
      });
    });
  });

  describe('state immutability', () => {
    it('should not mutate original state', () => {
      const initialState = { orgId: 'original-org-id' };
      const action = setOrg('new-org-id');

      const newState = tenantReducer(initialState, action);

      expect(initialState).not.toBe(newState);
      expect(initialState.orgId).toBe('original-org-id');
      expect(newState.orgId).toBe('new-org-id');
    });

    it('should handle multiple state updates', () => {
      let state = tenantReducer(undefined, { type: 'unknown' });

      state = tenantReducer(state, setOrg('org-1'));
      expect(state.orgId).toBe('org-1');

      state = tenantReducer(state, setOrg('org-2'));
      expect(state.orgId).toBe('org-2');

      state = tenantReducer(state, clearOrg());
      expect(state.orgId).toBeNull();
    });
  });

  describe('edge cases', () => {
    it('should handle unknown action types', () => {
      const initialState = { orgId: 'test-org-id' };
      const action = { type: 'unknown/action' };

      const newState = tenantReducer(initialState, action);

      expect(newState).toBe(initialState);
    });
  });
});
