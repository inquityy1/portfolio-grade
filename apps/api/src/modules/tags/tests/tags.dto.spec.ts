import { validate } from 'class-validator';
import { CreateTagDto } from '../dto/create-tag.dto';
import { UpdateTagDto } from '../dto/update-tag.dto';

describe('Tags DTOs', () => {
  describe('CreateTagDto', () => {
    it('should pass validation with valid name', async () => {
      const dto = new CreateTagDto();
      dto.name = 'javascript';

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation with minimum length name', async () => {
      const dto = new CreateTagDto();
      dto.name = 'js';

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with empty name', async () => {
      const dto = new CreateTagDto();
      dto.name = '';

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('name');
      expect(errors[0].constraints).toHaveProperty('minLength');
    });

    it('should fail validation with too short name', async () => {
      const dto = new CreateTagDto();
      dto.name = 'a';

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('name');
      expect(errors[0].constraints).toHaveProperty('minLength');
    });

    it('should fail validation with non-string name', async () => {
      const dto = new CreateTagDto();
      dto.name = 123 as any;

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('name');
      expect(errors[0].constraints).toHaveProperty('isString');
    });

    it('should fail validation with null name', async () => {
      const dto = new CreateTagDto();
      dto.name = null as any;

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('name');
      expect(errors[0].constraints).toHaveProperty('isString');
    });

    it('should fail validation with undefined name', async () => {
      const dto = new CreateTagDto();
      dto.name = undefined as any;

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('name');
      expect(errors[0].constraints).toHaveProperty('isString');
    });

    it('should pass validation with whitespace-only name', async () => {
      const dto = new CreateTagDto();
      dto.name = '   ';

      const errors = await validate(dto);
      // @MinLength(2) counts whitespace characters as valid characters
      // So "   " (3 spaces) passes the minLength validation
      expect(errors).toHaveLength(0);
    });

    it('should pass validation with long name', async () => {
      const dto = new CreateTagDto();
      dto.name = 'very-long-tag-name-with-many-characters';

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation with special characters in name', async () => {
      const dto = new CreateTagDto();
      dto.name = 'tag-with-special-chars-123';

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });

  describe('UpdateTagDto', () => {
    it('should pass validation with valid name', async () => {
      const dto = new UpdateTagDto();
      dto.name = 'typescript';

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation with minimum length name', async () => {
      const dto = new UpdateTagDto();
      dto.name = 'ts';

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation with undefined name', async () => {
      const dto = new UpdateTagDto();
      dto.name = undefined;

      const errors = await validate(dto);
      // @IsOptional() allows undefined values
      expect(errors).toHaveLength(0);
    });

    it('should pass validation with null name', async () => {
      const dto = new UpdateTagDto();
      dto.name = null as any;

      const errors = await validate(dto);
      // @IsOptional() allows null values
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with empty name', async () => {
      const dto = new UpdateTagDto();
      dto.name = '';

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('name');
      expect(errors[0].constraints).toHaveProperty('minLength');
    });

    it('should fail validation with too short name', async () => {
      const dto = new UpdateTagDto();
      dto.name = 'a';

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('name');
      expect(errors[0].constraints).toHaveProperty('minLength');
    });

    it('should fail validation with non-string name', async () => {
      const dto = new UpdateTagDto();
      dto.name = 123 as any;

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('name');
      expect(errors[0].constraints).toHaveProperty('isString');
    });

    it('should pass validation with whitespace-only name', async () => {
      const dto = new UpdateTagDto();
      dto.name = '   ';

      const errors = await validate(dto);
      // @MinLength(2) counts whitespace characters as valid characters
      // So "   " (3 spaces) passes the minLength validation
      expect(errors).toHaveLength(0);
    });

    it('should pass validation with long name', async () => {
      const dto = new UpdateTagDto();
      dto.name = 'very-long-tag-name-with-many-characters';

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation with special characters in name', async () => {
      const dto = new UpdateTagDto();
      dto.name = 'tag-with-special-chars-123';

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });
});
