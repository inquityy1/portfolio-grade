import { validate } from 'class-validator';
import { CreatePostDto } from '../dto/create-post.dto';
import { UpdatePostDto } from '../dto/update-post.dto';

describe('Posts DTOs', () => {
  describe('CreatePostDto', () => {
    it('should pass validation with valid data', async () => {
      const dto = new CreatePostDto();
      dto.title = 'My Post Title';
      dto.content = 'This is the post content';
      dto.tagIds = ['tag1', 'tag2'];

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation with minimal valid data', async () => {
      const dto = new CreatePostDto();
      dto.title = 'AB'; // minimum length
      dto.content = 'A'; // minimum length

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation without tagIds', async () => {
      const dto = new CreatePostDto();
      dto.title = 'My Post Title';
      dto.content = 'This is the post content';

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with missing title', async () => {
      const dto = new CreatePostDto();
      dto.content = 'This is the post content';

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('title');
      expect(errors[0].constraints).toHaveProperty('isString');
    });

    it('should fail validation with missing content', async () => {
      const dto = new CreatePostDto();
      dto.title = 'My Post Title';

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('content');
      expect(errors[0].constraints).toHaveProperty('isString');
    });

    it('should fail validation with empty title', async () => {
      const dto = new CreatePostDto();
      dto.title = '';
      dto.content = 'This is the post content';

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('title');
      expect(errors[0].constraints).toHaveProperty('minLength');
    });

    it('should fail validation with title too short', async () => {
      const dto = new CreatePostDto();
      dto.title = 'A'; // less than minimum length of 2
      dto.content = 'This is the post content';

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('title');
      expect(errors[0].constraints).toHaveProperty('minLength');
    });

    it('should fail validation with empty content', async () => {
      const dto = new CreatePostDto();
      dto.title = 'My Post Title';
      dto.content = '';

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('content');
      expect(errors[0].constraints).toHaveProperty('minLength');
    });

    it('should fail validation with non-string title', async () => {
      const dto = new CreatePostDto();
      (dto as any).title = 123;
      dto.content = 'This is the post content';

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('title');
      expect(errors[0].constraints).toHaveProperty('isString');
    });

    it('should fail validation with non-string content', async () => {
      const dto = new CreatePostDto();
      dto.title = 'My Post Title';
      (dto as any).content = 123;

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('content');
      expect(errors[0].constraints).toHaveProperty('isString');
    });

    it('should fail validation with non-array tagIds', async () => {
      const dto = new CreatePostDto();
      dto.title = 'My Post Title';
      dto.content = 'This is the post content';
      (dto as any).tagIds = 'not-an-array';

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('tagIds');
      expect(errors[0].constraints).toHaveProperty('isArray');
    });

    it('should pass validation with empty tagIds array', async () => {
      const dto = new CreatePostDto();
      dto.title = 'My Post Title';
      dto.content = 'This is the post content';
      dto.tagIds = [];

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation with whitespace-only title', async () => {
      const dto = new CreatePostDto();
      dto.title = '   '; // 3 spaces - meets minLength(2)
      dto.content = 'This is the post content';

      const errors = await validate(dto);
      // @MinLength(2) counts whitespace characters as valid characters
      // So "   " (3 spaces) passes the minLength validation
      expect(errors).toHaveLength(0);
    });

    it('should pass validation with whitespace-only content', async () => {
      const dto = new CreatePostDto();
      dto.title = 'My Post Title';
      dto.content = ' '; // 1 space - meets minLength(1)

      const errors = await validate(dto);
      // @MinLength(1) counts whitespace characters as valid characters
      // So " " (1 space) passes the minLength validation
      expect(errors).toHaveLength(0);
    });
  });

  describe('UpdatePostDto', () => {
    it('should pass validation with valid data', async () => {
      const dto = new UpdatePostDto();
      dto.version = 1;
      dto.title = 'Updated Post Title';
      dto.content = 'Updated post content';
      dto.tagIds = ['tag1', 'tag2'];

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation with only version', async () => {
      const dto = new UpdatePostDto();
      dto.version = 1;

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation with version and title only', async () => {
      const dto = new UpdatePostDto();
      dto.version = 1;
      dto.title = 'Updated Title';

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation with version and content only', async () => {
      const dto = new UpdatePostDto();
      dto.version = 1;
      dto.content = 'Updated content';

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation with version and tagIds only', async () => {
      const dto = new UpdatePostDto();
      dto.version = 1;
      dto.tagIds = ['tag1', 'tag2'];

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with missing version', async () => {
      const dto = new UpdatePostDto();
      dto.title = 'Updated Title';

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('version');
      expect(errors[0].constraints).toHaveProperty('isNumber');
    });

    it('should fail validation with non-number version', async () => {
      const dto = new UpdatePostDto();
      (dto as any).version = 'not-a-number';

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('version');
      expect(errors[0].constraints).toHaveProperty('isNumber');
    });

    it('should fail validation with version less than 1', async () => {
      const dto = new UpdatePostDto();
      dto.version = 0;

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('version');
      expect(errors[0].constraints).toHaveProperty('min');
    });

    it('should fail validation with negative version', async () => {
      const dto = new UpdatePostDto();
      dto.version = -1;

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('version');
      expect(errors[0].constraints).toHaveProperty('min');
    });

    it('should fail validation with empty title', async () => {
      const dto = new UpdatePostDto();
      dto.version = 1;
      dto.title = '';

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('title');
      expect(errors[0].constraints).toHaveProperty('minLength');
    });

    it('should fail validation with title too short', async () => {
      const dto = new UpdatePostDto();
      dto.version = 1;
      dto.title = 'A'; // less than minimum length of 2

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('title');
      expect(errors[0].constraints).toHaveProperty('minLength');
    });

    it('should fail validation with empty content', async () => {
      const dto = new UpdatePostDto();
      dto.version = 1;
      dto.content = '';

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('content');
      expect(errors[0].constraints).toHaveProperty('minLength');
    });

    it('should fail validation with non-string title', async () => {
      const dto = new UpdatePostDto();
      dto.version = 1;
      (dto as any).title = 123;

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('title');
      expect(errors[0].constraints).toHaveProperty('isString');
    });

    it('should fail validation with non-string content', async () => {
      const dto = new UpdatePostDto();
      dto.version = 1;
      (dto as any).content = 123;

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('content');
      expect(errors[0].constraints).toHaveProperty('isString');
    });

    it('should fail validation with non-array tagIds', async () => {
      const dto = new UpdatePostDto();
      dto.version = 1;
      (dto as any).tagIds = 'not-an-array';

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('tagIds');
      expect(errors[0].constraints).toHaveProperty('isArray');
    });

    it('should pass validation with empty tagIds array', async () => {
      const dto = new UpdatePostDto();
      dto.version = 1;
      dto.tagIds = [];

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation with whitespace-only title', async () => {
      const dto = new UpdatePostDto();
      dto.version = 1;
      dto.title = '   '; // 3 spaces - meets minLength(2)

      const errors = await validate(dto);
      // @MinLength(2) counts whitespace characters as valid characters
      // So "   " (3 spaces) passes the minLength validation
      expect(errors).toHaveLength(0);
    });

    it('should pass validation with whitespace-only content', async () => {
      const dto = new UpdatePostDto();
      dto.version = 1;
      dto.content = ' '; // 1 space - meets minLength(1)

      const errors = await validate(dto);
      // @MinLength(1) counts whitespace characters as valid characters
      // So " " (1 space) passes the minLength validation
      expect(errors).toHaveLength(0);
    });

    it('should pass validation with large version number', async () => {
      const dto = new UpdatePostDto();
      dto.version = 999999;

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation with decimal version number', async () => {
      const dto = new UpdatePostDto();
      dto.version = 1.5;

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });
});
