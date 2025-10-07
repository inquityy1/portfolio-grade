import { validate } from 'class-validator';
import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/register.dto';

describe('LoginDto', () => {
  it('should pass validation with valid data', async () => {
    const dto = new LoginDto();
    dto.email = 'test@example.com';
    dto.password = 'password123';

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should fail validation with invalid email', async () => {
    const dto = new LoginDto();
    dto.email = 'invalid-email';
    dto.password = 'password123';

    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('email');
    expect(errors[0].constraints).toHaveProperty('isEmail');
  });

  it('should fail validation with empty email', async () => {
    const dto = new LoginDto();
    dto.email = '';
    dto.password = 'password123';

    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('email');
    expect(errors[0].constraints).toHaveProperty('isEmail');
  });

  it('should fail validation with missing email', async () => {
    const dto = new LoginDto();
    dto.password = 'password123';

    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('email');
    expect(errors[0].constraints).toHaveProperty('isEmail');
  });

  it('should pass validation with empty password', async () => {
    const dto = new LoginDto();
    dto.email = 'test@example.com';
    dto.password = '';

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should fail validation with missing password', async () => {
    const dto = new LoginDto();
    dto.email = 'test@example.com';

    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('password');
    expect(errors[0].constraints).toHaveProperty('isString');
  });

  it('should fail validation with non-string password', async () => {
    const dto = new LoginDto();
    dto.email = 'test@example.com';
    dto.password = 123 as any;

    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('password');
    expect(errors[0].constraints).toHaveProperty('isString');
  });

  it('should fail validation with multiple errors', async () => {
    const dto = new LoginDto();
    dto.email = 'invalid-email';
    dto.password = '';

    const errors = await validate(dto);
    expect(errors).toHaveLength(1);

    const emailError = errors.find(e => e.property === 'email');

    expect(emailError).toBeDefined();
    expect(emailError.constraints).toHaveProperty('isEmail');
  });

  it('should pass validation with edge case email formats', async () => {
    const validEmails = [
      'test@example.com',
      'user.name@domain.co.uk',
      'test+tag@example.org',
      'a@b.co',
    ];

    for (const email of validEmails) {
      const dto = new LoginDto();
      dto.email = email;
      dto.password = 'password123';

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    }
  });
});

describe('RegisterDto', () => {
  it('should pass validation with valid data', async () => {
    const dto = new RegisterDto();
    dto.email = 'test@example.com';
    dto.password = 'password123';
    dto.name = 'Test User';

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should fail validation with invalid email', async () => {
    const dto = new RegisterDto();
    dto.email = 'invalid-email';
    dto.password = 'password123';
    dto.name = 'Test User';

    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('email');
    expect(errors[0].constraints).toHaveProperty('isEmail');
  });

  it('should fail validation with empty email', async () => {
    const dto = new RegisterDto();
    dto.email = '';
    dto.password = 'password123';
    dto.name = 'Test User';

    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('email');
    expect(errors[0].constraints).toHaveProperty('isEmail');
  });

  it('should fail validation with missing email', async () => {
    const dto = new RegisterDto();
    dto.password = 'password123';
    dto.name = 'Test User';

    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('email');
    expect(errors[0].constraints).toHaveProperty('isEmail');
  });

  it('should fail validation with password too short', async () => {
    const dto = new RegisterDto();
    dto.email = 'test@example.com';
    dto.password = '12345'; // Less than 6 characters
    dto.name = 'Test User';

    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('password');
    expect(errors[0].constraints).toHaveProperty('minLength');
  });

  it('should pass validation with password exactly 6 characters', async () => {
    const dto = new RegisterDto();
    dto.email = 'test@example.com';
    dto.password = '123456'; // Exactly 6 characters
    dto.name = 'Test User';

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should fail validation with empty password', async () => {
    const dto = new RegisterDto();
    dto.email = 'test@example.com';
    dto.password = '';
    dto.name = 'Test User';

    const errors = await validate(dto);
    expect(errors).toHaveLength(1);

    const passwordError = errors.find(e => e.property === 'password');
    expect(passwordError).toBeDefined();
    expect(passwordError.constraints).toHaveProperty('minLength');
  });

  it('should fail validation with missing password', async () => {
    const dto = new RegisterDto();
    dto.email = 'test@example.com';
    dto.name = 'Test User';

    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('password');
    expect(errors[0].constraints).toHaveProperty('isString');
  });

  it('should fail validation with non-string password', async () => {
    const dto = new RegisterDto();
    dto.email = 'test@example.com';
    dto.password = 123 as any;
    dto.name = 'Test User';

    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('password');
    expect(errors[0].constraints).toHaveProperty('isString');
  });

  it('should pass validation with empty name', async () => {
    const dto = new RegisterDto();
    dto.email = 'test@example.com';
    dto.password = 'password123';
    dto.name = '';

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should fail validation with missing name', async () => {
    const dto = new RegisterDto();
    dto.email = 'test@example.com';
    dto.password = 'password123';

    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('name');
    expect(errors[0].constraints).toHaveProperty('isString');
  });

  it('should fail validation with non-string name', async () => {
    const dto = new RegisterDto();
    dto.email = 'test@example.com';
    dto.password = 'password123';
    dto.name = 123 as any;

    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('name');
    expect(errors[0].constraints).toHaveProperty('isString');
  });

  it('should fail validation with multiple errors', async () => {
    const dto = new RegisterDto();
    dto.email = 'invalid-email';
    dto.password = '12345'; // Too short
    dto.name = ''; // Empty name

    const errors = await validate(dto);
    expect(errors).toHaveLength(2);

    const emailError = errors.find(e => e.property === 'email');
    const passwordError = errors.find(e => e.property === 'password');

    expect(emailError).toBeDefined();
    expect(passwordError).toBeDefined();
    expect(emailError.constraints).toHaveProperty('isEmail');
    expect(passwordError.constraints).toHaveProperty('minLength');
  });

  it('should pass validation with edge case values', async () => {
    const dto = new RegisterDto();
    dto.email = 'a@b.co'; // Minimal valid email
    dto.password = '123456'; // Minimal valid password
    dto.name = 'A'; // Minimal valid name

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should pass validation with long valid values', async () => {
    const dto = new RegisterDto();
    dto.email = 'very.long.email.address.with.many.parts@very.long.domain.name.com';
    dto.password = 'verylongpassword123456789';
    dto.name = 'Very Long User Name With Many Words';

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should pass validation with special characters in name', async () => {
    const dto = new RegisterDto();
    dto.email = 'test@example.com';
    dto.password = 'password123';
    dto.name = "John O'Connor-Smith";

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });
});
