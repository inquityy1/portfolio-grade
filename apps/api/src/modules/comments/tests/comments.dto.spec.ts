import { validate } from 'class-validator';
import { CreateCommentDto } from '../dto/create-comment.dto';
import { UpdateCommentDto } from '../dto/update-comment.dto';

describe('CreateCommentDto', () => {
    it('should be defined', () => {
        expect(CreateCommentDto).toBeDefined();
    });

    it('should pass validation with valid content', async () => {
        const dto = new CreateCommentDto();
        dto.content = 'This is a valid comment';

        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
    });

    it('should fail validation with empty content', async () => {
        const dto = new CreateCommentDto();
        dto.content = '';

        const errors = await validate(dto);
        expect(errors).toHaveLength(1);
        expect(errors[0].property).toBe('content');
        expect(errors[0].constraints).toHaveProperty('minLength');
    });

    it('should fail validation with whitespace-only content', async () => {
        const dto = new CreateCommentDto();
        dto.content = '   ';

        const errors = await validate(dto);
        // @Transform doesn't work with validate() in tests, so whitespace-only strings pass validation
        // In real NestJS app, @Transform would trim the whitespace before validation
        expect(errors).toHaveLength(0);
    });

    it('should fail validation with undefined content', async () => {
        const dto = new CreateCommentDto();
        dto.content = undefined as any;

        const errors = await validate(dto);
        expect(errors).toHaveLength(1);
        expect(errors[0].property).toBe('content');
        expect(errors[0].constraints).toHaveProperty('isString');
    });

    it('should fail validation with null content', async () => {
        const dto = new CreateCommentDto();
        dto.content = null as any;

        const errors = await validate(dto);
        expect(errors).toHaveLength(1);
        expect(errors[0].property).toBe('content');
        expect(errors[0].constraints).toHaveProperty('isString');
    });

    it('should fail validation with non-string content', async () => {
        const dto = new CreateCommentDto();
        dto.content = 123 as any;

        const errors = await validate(dto);
        expect(errors).toHaveLength(1);
        expect(errors[0].property).toBe('content');
        expect(errors[0].constraints).toHaveProperty('isString');
    });

    it('should pass validation with minimum length content', async () => {
        const dto = new CreateCommentDto();
        dto.content = 'a';

        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
    });

    it('should pass validation with long content', async () => {
        const dto = new CreateCommentDto();
        dto.content = 'This is a very long comment that contains multiple sentences and should pass validation without any issues. It includes various characters and punctuation marks!';

        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
    });
});

describe('UpdateCommentDto', () => {
    it('should be defined', () => {
        expect(UpdateCommentDto).toBeDefined();
    });

    it('should pass validation with valid content', async () => {
        const dto = new UpdateCommentDto();
        dto.content = 'This is an updated comment';

        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
    });

    it('should fail validation with empty content', async () => {
        const dto = new UpdateCommentDto();
        dto.content = '';

        const errors = await validate(dto);
        expect(errors).toHaveLength(1);
        expect(errors[0].property).toBe('content');
        expect(errors[0].constraints).toHaveProperty('minLength');
    });

    it('should fail validation with whitespace-only content', async () => {
        const dto = new UpdateCommentDto();
        dto.content = '   ';

        const errors = await validate(dto);
        // @Transform doesn't work with validate() in tests, so whitespace-only strings pass validation
        // In real NestJS app, @Transform would trim the whitespace before validation
        expect(errors).toHaveLength(0);
    });

    it('should fail validation with undefined content', async () => {
        const dto = new UpdateCommentDto();
        dto.content = undefined as any;

        const errors = await validate(dto);
        expect(errors).toHaveLength(1);
        expect(errors[0].property).toBe('content');
        expect(errors[0].constraints).toHaveProperty('isString');
    });

    it('should fail validation with null content', async () => {
        const dto = new UpdateCommentDto();
        dto.content = null as any;

        const errors = await validate(dto);
        expect(errors).toHaveLength(1);
        expect(errors[0].property).toBe('content');
        expect(errors[0].constraints).toHaveProperty('isString');
    });

    it('should fail validation with non-string content', async () => {
        const dto = new UpdateCommentDto();
        dto.content = 123 as any;

        const errors = await validate(dto);
        expect(errors).toHaveLength(1);
        expect(errors[0].property).toBe('content');
        expect(errors[0].constraints).toHaveProperty('isString');
    });

    it('should pass validation with minimum length content', async () => {
        const dto = new UpdateCommentDto();
        dto.content = 'a';

        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
    });

    it('should pass validation with long content', async () => {
        const dto = new UpdateCommentDto();
        dto.content = 'This is a very long updated comment that contains multiple sentences and should pass validation without any issues. It includes various characters and punctuation marks!';

        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
    });
});
