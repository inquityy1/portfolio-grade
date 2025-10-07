import { validate } from 'class-validator';
import { CreateFormDto } from '../dto/create-form.dto';
import { UpdateFormDto } from '../dto/update-form.dto';

describe('Forms DTOs', () => {
  describe('CreateFormDto', () => {
    it('should pass validation with valid data', async () => {
      const dto = new CreateFormDto();
      dto.name = 'Contact Form';
      dto.schema = { title: 'Contact Us', fields: [] };

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with missing name', async () => {
      const dto = new CreateFormDto();
      dto.schema = { title: 'Contact Us', fields: [] };

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('name');
      expect(errors[0].constraints).toHaveProperty('isString');
    });

    it('should fail validation with missing schema', async () => {
      const dto = new CreateFormDto();
      dto.name = 'Contact Form';

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('schema');
      expect(errors[0].constraints).toHaveProperty('isObject');
    });

    it('should fail validation with non-string name', async () => {
      const dto = new CreateFormDto();
      dto.name = 123 as any;
      dto.schema = { title: 'Contact Us', fields: [] };

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('name');
      expect(errors[0].constraints).toHaveProperty('isString');
    });

    it('should fail validation with non-object schema', async () => {
      const dto = new CreateFormDto();
      dto.name = 'Contact Form';
      dto.schema = 'invalid schema' as any;

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('schema');
      expect(errors[0].constraints).toHaveProperty('isObject');
    });

    it('should fail validation with null schema', async () => {
      const dto = new CreateFormDto();
      dto.name = 'Contact Form';
      dto.schema = null as any;

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('schema');
      expect(errors[0].constraints).toHaveProperty('isObject');
    });

    it('should pass validation with empty string name', async () => {
      const dto = new CreateFormDto();
      dto.name = '';
      dto.schema = { title: 'Contact Us', fields: [] };

      const errors = await validate(dto);
      // @IsString() allows empty strings
      expect(errors).toHaveLength(0);
    });

    it('should pass validation with complex schema object', async () => {
      const dto = new CreateFormDto();
      dto.name = 'Survey Form';
      dto.schema = {
        title: 'Customer Survey',
        description: 'Help us improve our service',
        fields: [
          { type: 'text', label: 'Name', required: true },
          { type: 'email', label: 'Email', required: true },
          { type: 'textarea', label: 'Comments', required: false },
        ],
        settings: {
          allowMultipleSubmissions: false,
          requireAuthentication: true,
          customValidation: {
            email: { pattern: '^[\\w\\.-]+@[\\w\\.-]+\\.[a-zA-Z]{2,}$' },
          },
        },
      };

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });

  describe('UpdateFormDto', () => {
    it('should pass validation with valid data', async () => {
      const dto = new UpdateFormDto();
      dto.name = 'Updated Contact Form';
      dto.schema = { title: 'Updated Contact Us', fields: [] };

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation with only name', async () => {
      const dto = new UpdateFormDto();
      dto.name = 'Updated Contact Form';

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation with only schema', async () => {
      const dto = new UpdateFormDto();
      dto.schema = { title: 'Updated Contact Us', fields: [] };

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation with empty object', async () => {
      const dto = new UpdateFormDto();

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with non-string name', async () => {
      const dto = new UpdateFormDto();
      dto.name = 123 as any;
      dto.schema = { title: 'Contact Us', fields: [] };

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('name');
      expect(errors[0].constraints).toHaveProperty('isString');
    });

    it('should fail validation with non-object schema', async () => {
      const dto = new UpdateFormDto();
      dto.name = 'Contact Form';
      dto.schema = 'invalid schema' as any;

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('schema');
      expect(errors[0].constraints).toHaveProperty('isObject');
    });

    it('should pass validation with null schema', async () => {
      const dto = new UpdateFormDto();
      dto.name = 'Contact Form';
      dto.schema = null as any;

      const errors = await validate(dto);
      // @IsOptional() allows null values
      expect(errors).toHaveLength(0);
    });

    it('should pass validation with empty string name', async () => {
      const dto = new UpdateFormDto();
      dto.name = '';
      dto.schema = { title: 'Contact Us', fields: [] };

      const errors = await validate(dto);
      // @IsString() allows empty strings
      expect(errors).toHaveLength(0);
    });

    it('should pass validation with undefined values', async () => {
      const dto = new UpdateFormDto();
      dto.name = undefined;
      dto.schema = undefined;

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation with complex schema object', async () => {
      const dto = new UpdateFormDto();
      dto.name = 'Updated Survey Form';
      dto.schema = {
        title: 'Updated Customer Survey',
        description: 'Updated description',
        fields: [
          { type: 'text', label: 'Full Name', required: true },
          { type: 'email', label: 'Email Address', required: true },
          { type: 'textarea', label: 'Feedback', required: false },
        ],
        settings: {
          allowMultipleSubmissions: true,
          requireAuthentication: false,
          customValidation: {
            email: { pattern: '^[\\w\\.-]+@[\\w\\.-]+\\.[a-zA-Z]{2,}$' },
          },
        },
      };

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });
});
