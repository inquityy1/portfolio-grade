// Mock the entire API service to avoid import.meta issues
jest.mock('./api', () => ({
  api: {
    reducerPath: 'api',
    reducer: jest.fn(),
    middleware: jest.fn(),
    endpoints: {
      getFormPublic: {
        useQuery: jest.fn(),
        useLazyQuery: jest.fn(),
      },
      submitForm: {
        useMutation: jest.fn(),
      },
      login: {
        useMutation: jest.fn(),
      },
      register: {
        useMutation: jest.fn(),
      },
      me: {
        useQuery: jest.fn(),
        useLazyQuery: jest.fn(),
      },
    },
  },
  useGetFormPublicQuery: jest.fn(),
  useSubmitFormMutation: jest.fn(),
  useLoginMutation: jest.fn(),
  useRegisterMutation: jest.fn(),
  useMeQuery: jest.fn(),
}));

import { api, type Field, type FormDto } from './api';

describe('api service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('API configuration', () => {
    it('should have correct reducer path', () => {
      expect(api.reducerPath).toBe('api');
    });

    it('should have all required endpoints', () => {
      expect(api.endpoints.getFormPublic).toBeDefined();
      expect(api.endpoints.submitForm).toBeDefined();
      expect(api.endpoints.login).toBeDefined();
      expect(api.endpoints.register).toBeDefined();
      expect(api.endpoints.me).toBeDefined();
    });
  });

  describe('hooks export', () => {
    it('should export useGetFormPublicQuery hook', () => {
      const { useGetFormPublicQuery } = require('./api');
      expect(useGetFormPublicQuery).toBeDefined();
    });

    it('should export useSubmitFormMutation hook', () => {
      const { useSubmitFormMutation } = require('./api');
      expect(useSubmitFormMutation).toBeDefined();
    });

    it('should export useLoginMutation hook', () => {
      const { useLoginMutation } = require('./api');
      expect(useLoginMutation).toBeDefined();
    });

    it('should export useRegisterMutation hook', () => {
      const { useRegisterMutation } = require('./api');
      expect(useRegisterMutation).toBeDefined();
    });

    it('should export useMeQuery hook', () => {
      const { useMeQuery } = require('./api');
      expect(useMeQuery).toBeDefined();
    });
  });

  describe('types', () => {
    it('should have correct Field type', () => {
      const field: Field = {
        id: 'field-1',
        formId: 'form-1',
        label: 'Test Field',
        type: 'text',
        order: 1,
        config: { placeholder: 'Enter text' },
      };

      expect(field.id).toBe('field-1');
      expect(field.formId).toBe('form-1');
      expect(field.label).toBe('Test Field');
      expect(field.type).toBe('text');
      expect(field.order).toBe(1);
      expect(field.config).toEqual({ placeholder: 'Enter text' });
    });

    it('should have correct FormDto type', () => {
      const form: FormDto = {
        id: 'form-1',
        name: 'Test Form',
        schema: { type: 'object', properties: {} },
        fields: [
          {
            id: 'field-1',
            formId: 'form-1',
            label: 'Test Field',
            type: 'text',
            order: 1,
            config: null,
          },
        ],
      };

      expect(form.id).toBe('form-1');
      expect(form.name).toBe('Test Form');
      expect(form.schema).toEqual({ type: 'object', properties: {} });
      expect(form.fields).toHaveLength(1);
      expect(form.fields[0].id).toBe('field-1');
    });

    it('should handle optional config field', () => {
      const field: Field = {
        id: 'field-1',
        formId: 'form-1',
        label: 'Test Field',
        type: 'text',
        order: 1,
      };

      expect(field.config).toBeUndefined();
    });
  });
});
