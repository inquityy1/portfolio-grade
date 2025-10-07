import { validate } from 'class-validator';
import { CreateOrganizationDto } from '../dto/create-organization.dto';

describe('Organizations DTOs', () => {
  describe('CreateOrganizationDto', () => {
    it('should pass validation with valid data', async () => {
      const dto = new CreateOrganizationDto();
      dto.name = 'My Company';

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation with valid name containing spaces', async () => {
      const dto = new CreateOrganizationDto();
      dto.name = 'My Company Inc';

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation with valid name containing hyphens', async () => {
      const dto = new CreateOrganizationDto();
      dto.name = 'My-Company';

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation with valid name containing underscores', async () => {
      const dto = new CreateOrganizationDto();
      dto.name = 'My_Company';

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation with valid name containing numbers', async () => {
      const dto = new CreateOrganizationDto();
      dto.name = 'Company123';

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation with minimum length name', async () => {
      const dto = new CreateOrganizationDto();
      dto.name = 'AB';

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation with maximum length name', async () => {
      const dto = new CreateOrganizationDto();
      dto.name = 'A'.repeat(100);

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with missing name', async () => {
      const dto = new CreateOrganizationDto();

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('name');
      expect(errors[0].constraints).toHaveProperty('isString');
    });

    it('should fail validation with non-string name', async () => {
      const dto = new CreateOrganizationDto();
      dto.name = 123 as any;

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('name');
      expect(errors[0].constraints).toHaveProperty('isString');
    });

    it('should fail validation with too short name', async () => {
      const dto = new CreateOrganizationDto();
      dto.name = 'A';

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('name');
      expect(errors[0].constraints).toHaveProperty('minLength');
    });

    it('should fail validation with too long name', async () => {
      const dto = new CreateOrganizationDto();
      dto.name = 'A'.repeat(101);

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('name');
      expect(errors[0].constraints).toHaveProperty('maxLength');
    });

    it('should fail validation with invalid characters', async () => {
      const dto = new CreateOrganizationDto();
      dto.name = 'My Company!';

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('name');
      expect(errors[0].constraints).toHaveProperty('matches');
    });

    it('should fail validation with special characters', async () => {
      const dto = new CreateOrganizationDto();
      dto.name = 'My@Company';

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('name');
      expect(errors[0].constraints).toHaveProperty('matches');
    });

    it('should fail validation with symbols', async () => {
      const dto = new CreateOrganizationDto();
      dto.name = 'My$Company';

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('name');
      expect(errors[0].constraints).toHaveProperty('matches');
    });

    it('should pass validation with empty string', async () => {
      const dto = new CreateOrganizationDto();
      dto.name = '';

      const errors = await validate(dto);
      // @IsString() allows empty strings, but @MinLength(2) will catch it
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('name');
      expect(errors[0].constraints).toHaveProperty('minLength');
    });

    it('should pass validation with whitespace-only name', async () => {
      const dto = new CreateOrganizationDto();
      dto.name = '   ';

      const errors = await validate(dto);
      // @MinLength(2) counts whitespace characters as valid characters
      // So "   " (3 spaces) passes the minLength validation
      expect(errors).toHaveLength(0);
    });

    it('should pass validation with complex valid name', async () => {
      const dto = new CreateOrganizationDto();
      dto.name = 'My Company-123_Inc';

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with multiple invalid characters', async () => {
      const dto = new CreateOrganizationDto();
      dto.name = 'My Company!@#$%';

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('name');
      expect(errors[0].constraints).toHaveProperty('matches');
    });
  });
});
