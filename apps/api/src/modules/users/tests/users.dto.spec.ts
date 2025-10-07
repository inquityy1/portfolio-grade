import { validate } from 'class-validator';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';

describe('Users DTOs', () => {
  describe('CreateUserDto', () => {
    it('should pass validation with valid data', async () => {
      const dto = new CreateUserDto();
      dto.email = 'user@example.com';
      dto.password = 'password123';
      dto.name = 'John Doe';
      dto.role = 'Editor';
      dto.organizationId = 'org-123';

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation without optional organizationId', async () => {
      const dto = new CreateUserDto();
      dto.email = 'user@example.com';
      dto.password = 'password123';
      dto.name = 'John Doe';
      dto.role = 'Viewer';

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with invalid email', async () => {
      const dto = new CreateUserDto();
      dto.email = 'invalid-email';
      dto.password = 'password123';
      dto.name = 'John Doe';
      dto.role = 'Editor';

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('email');
      expect(errors[0].constraints).toHaveProperty('isEmail');
    });

    it('should fail validation with empty email', async () => {
      const dto = new CreateUserDto();
      dto.email = '';
      dto.password = 'password123';
      dto.name = 'John Doe';
      dto.role = 'Editor';

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('email');
      expect(errors[0].constraints).toHaveProperty('isEmail');
    });

    it('should fail validation with password too short', async () => {
      const dto = new CreateUserDto();
      dto.email = 'user@example.com';
      dto.password = '12345';
      dto.name = 'John Doe';
      dto.role = 'Editor';

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('password');
      expect(errors[0].constraints).toHaveProperty('minLength');
    });

    it('should pass validation with minimum length password', async () => {
      const dto = new CreateUserDto();
      dto.email = 'user@example.com';
      dto.password = '123456';
      dto.name = 'John Doe';
      dto.role = 'Editor';

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation with empty name', async () => {
      const dto = new CreateUserDto();
      dto.email = 'user@example.com';
      dto.password = 'password123';
      dto.name = '';
      dto.role = 'Editor';

      const errors = await validate(dto);
      // Empty string is still a valid string, so it passes @IsString validation
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with invalid role', async () => {
      const dto = new CreateUserDto();
      dto.email = 'user@example.com';
      dto.password = 'password123';
      dto.name = 'John Doe';
      dto.role = 'InvalidRole' as any;

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('role');
      expect(errors[0].constraints).toHaveProperty('isEnum');
    });

    it('should pass validation with all valid roles', async () => {
      const validRoles = ['OrgAdmin', 'Editor', 'Viewer'];

      for (const role of validRoles) {
        const dto = new CreateUserDto();
        dto.email = 'user@example.com';
        dto.password = 'password123';
        dto.name = 'John Doe';
        dto.role = role as any;

        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
      }
    });

    it('should fail validation with non-string password', async () => {
      const dto = new CreateUserDto();
      dto.email = 'user@example.com';
      dto.password = 123456 as any;
      dto.name = 'John Doe';
      dto.role = 'Editor';

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('password');
      expect(errors[0].constraints).toHaveProperty('isString');
    });

    it('should fail validation with non-string name', async () => {
      const dto = new CreateUserDto();
      dto.email = 'user@example.com';
      dto.password = 'password123';
      dto.name = 123 as any;
      dto.role = 'Editor';

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('name');
      expect(errors[0].constraints).toHaveProperty('isString');
    });
  });

  describe('UpdateUserDto', () => {
    it('should pass validation with valid name', async () => {
      const dto = new UpdateUserDto();
      dto.name = 'John Updated Doe';

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation with valid email', async () => {
      const dto = new UpdateUserDto();
      dto.email = 'updated@example.com';

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation with valid password', async () => {
      const dto = new UpdateUserDto();
      dto.password = 'newpassword123';

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation with all fields', async () => {
      const dto = new UpdateUserDto();
      dto.name = 'John Updated Doe';
      dto.email = 'updated@example.com';
      dto.password = 'newpassword123';

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation with undefined fields', async () => {
      const dto = new UpdateUserDto();
      dto.name = undefined;
      dto.email = undefined;
      dto.password = undefined;

      const errors = await validate(dto);
      // @IsOptional() allows undefined values
      expect(errors).toHaveLength(0);
    });

    it('should pass validation with null fields', async () => {
      const dto = new UpdateUserDto();
      dto.name = null as any;
      dto.email = null as any;
      dto.password = null as any;

      const errors = await validate(dto);
      // @IsOptional() allows null values
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with invalid email', async () => {
      const dto = new UpdateUserDto();
      dto.email = 'invalid-email';

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('email');
      expect(errors[0].constraints).toHaveProperty('isEmail');
    });

    it('should fail validation with password too short', async () => {
      const dto = new UpdateUserDto();
      dto.password = '12345';

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('password');
      expect(errors[0].constraints).toHaveProperty('minLength');
    });

    it('should pass validation with minimum length password', async () => {
      const dto = new UpdateUserDto();
      dto.password = '123456';

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with non-string name', async () => {
      const dto = new UpdateUserDto();
      dto.name = 123 as any;

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('name');
      expect(errors[0].constraints).toHaveProperty('isString');
    });

    it('should fail validation with non-string password', async () => {
      const dto = new UpdateUserDto();
      dto.password = 123456 as any;

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('password');
      expect(errors[0].constraints).toHaveProperty('isString');
    });
  });
});
