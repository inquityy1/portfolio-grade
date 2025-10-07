import { validate } from 'class-validator';
import { CreateSubmissionDto } from '../dto/create-submission.dto';

describe('Submissions DTOs', () => {
  describe('CreateSubmissionDto', () => {
    it('should pass validation with valid data object', async () => {
      const dto = new CreateSubmissionDto();
      dto.data = {
        name: 'John Doe',
        email: 'john@example.com',
        message: 'Hello, this is a test submission!',
        phone: '+1234567890',
        company: 'Acme Corp',
      };

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation with empty data object', async () => {
      const dto = new CreateSubmissionDto();
      dto.data = {};

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation with nested data object', async () => {
      const dto = new CreateSubmissionDto();
      dto.data = {
        personalInfo: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
        },
        preferences: {
          newsletter: true,
          notifications: false,
        },
        metadata: {
          source: 'website',
          timestamp: '2024-01-15T10:30:00Z',
        },
      };

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation with array data', async () => {
      const dto = new CreateSubmissionDto();
      dto.data = {
        items: ['item1', 'item2', 'item3'],
        scores: [85, 92, 78],
        tags: ['urgent', 'important', 'follow-up'],
      };

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation with mixed data types', async () => {
      const dto = new CreateSubmissionDto();
      dto.data = {
        stringField: 'Hello World',
        numberField: 42,
        booleanField: true,
        nullField: null,
        arrayField: [1, 2, 3],
        objectField: { nested: 'value' },
      };

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with missing data', async () => {
      const dto = new CreateSubmissionDto();
      // data is undefined

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('data');
      expect(errors[0].constraints).toHaveProperty('isObject');
    });

    it('should fail validation with null data', async () => {
      const dto = new CreateSubmissionDto();
      dto.data = null as any;

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('data');
      expect(errors[0].constraints).toHaveProperty('isObject');
    });

    it('should fail validation with string data', async () => {
      const dto = new CreateSubmissionDto();
      dto.data = 'not an object' as any;

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('data');
      expect(errors[0].constraints).toHaveProperty('isObject');
    });

    it('should fail validation with number data', async () => {
      const dto = new CreateSubmissionDto();
      dto.data = 123 as any;

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('data');
      expect(errors[0].constraints).toHaveProperty('isObject');
    });

    it('should fail validation with boolean data', async () => {
      const dto = new CreateSubmissionDto();
      dto.data = true as any;

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('data');
      expect(errors[0].constraints).toHaveProperty('isObject');
    });

    it('should fail validation with array data', async () => {
      const dto = new CreateSubmissionDto();
      dto.data = ['item1', 'item2'] as any;

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('data');
      expect(errors[0].constraints).toHaveProperty('isObject');
    });

    it('should pass validation with Date object in data', async () => {
      const dto = new CreateSubmissionDto();
      dto.data = {
        timestamp: new Date('2024-01-15T10:30:00Z'),
        createdAt: new Date(),
        metadata: {
          lastModified: new Date('2024-01-14T15:45:00Z'),
        },
      };

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation with function in data', async () => {
      const dto = new CreateSubmissionDto();
      dto.data = {
        callback: () => console.log('test'),
        handler: function () {
          return 'test';
        },
        data: { value: 'test' },
      };

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation with undefined values in data', async () => {
      const dto = new CreateSubmissionDto();
      dto.data = {
        definedValue: 'test',
        undefinedValue: undefined,
        nullValue: null,
        emptyString: '',
        zeroValue: 0,
        falseValue: false,
      };

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation with complex nested structure', async () => {
      const dto = new CreateSubmissionDto();
      dto.data = {
        user: {
          profile: {
            personal: {
              name: 'John Doe',
              age: 30,
              address: {
                street: '123 Main St',
                city: 'Anytown',
                country: 'USA',
              },
            },
            preferences: {
              theme: 'dark',
              language: 'en',
              notifications: {
                email: true,
                sms: false,
                push: true,
              },
            },
          },
          settings: {
            privacy: 'public',
            visibility: 'friends',
            security: {
              twoFactor: true,
              loginAlerts: false,
            },
          },
        },
        submission: {
          formId: 'form-123',
          version: '1.0.0',
          fields: [
            { name: 'name', value: 'John Doe', type: 'text' },
            { name: 'email', value: 'john@example.com', type: 'email' },
            { name: 'message', value: 'Hello!', type: 'textarea' },
          ],
          metadata: {
            ip: '192.168.1.1',
            userAgent: 'Mozilla/5.0...',
            timestamp: new Date(),
            source: 'web',
          },
        },
      };

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });
});
