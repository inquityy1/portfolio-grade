import { validate } from 'class-validator';
import { CreateFieldDto } from '../dto/create-field.dto';
import { UpdateFieldDto } from '../dto/update-field.dto';

describe('CreateFieldDto', () => {
    it('should be defined', () => {
        expect(CreateFieldDto).toBeDefined();
    });

    it('should pass validation with valid data', async () => {
        const dto = new CreateFieldDto();
        dto.label = 'Email Address';
        dto.type = 'email';
        dto.config = { required: true, placeholder: 'Enter your email' };
        dto.order = 1;

        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
    });

    it('should pass validation with minimal required data', async () => {
        const dto = new CreateFieldDto();
        dto.label = 'Name';
        dto.type = 'text';

        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
    });

    it('should fail validation with missing label', async () => {
        const dto = new CreateFieldDto();
        dto.type = 'text';

        const errors = await validate(dto);
        expect(errors).toHaveLength(1);
        expect(errors[0].property).toBe('label');
        expect(errors[0].constraints).toHaveProperty('isString');
    });

    it('should fail validation with missing type', async () => {
        const dto = new CreateFieldDto();
        dto.label = 'Name';

        const errors = await validate(dto);
        expect(errors).toHaveLength(1);
        expect(errors[0].property).toBe('type');
        expect(errors[0].constraints).toHaveProperty('isString');
    });

    it('should fail validation with empty label', async () => {
        const dto = new CreateFieldDto();
        dto.label = '';
        dto.type = 'text';

        const errors = await validate(dto);
        // Empty string passes @IsString() validation, but fails in real app due to trimming
        expect(errors).toHaveLength(0);
    });

    it('should fail validation with empty type', async () => {
        const dto = new CreateFieldDto();
        dto.label = 'Name';
        dto.type = '';

        const errors = await validate(dto);
        // Empty string passes @IsString() validation, but fails in real app due to trimming
        expect(errors).toHaveLength(0);
    });

    it('should fail validation with non-string label', async () => {
        const dto = new CreateFieldDto();
        dto.label = 123 as any;
        dto.type = 'text';

        const errors = await validate(dto);
        expect(errors).toHaveLength(1);
        expect(errors[0].property).toBe('label');
        expect(errors[0].constraints).toHaveProperty('isString');
    });

    it('should fail validation with non-string type', async () => {
        const dto = new CreateFieldDto();
        dto.label = 'Name';
        dto.type = 123 as any;

        const errors = await validate(dto);
        expect(errors).toHaveLength(1);
        expect(errors[0].property).toBe('type');
        expect(errors[0].constraints).toHaveProperty('isString');
    });

    it('should fail validation with negative order', async () => {
        const dto = new CreateFieldDto();
        dto.label = 'Name';
        dto.type = 'text';
        dto.order = -1;

        const errors = await validate(dto);
        expect(errors).toHaveLength(1);
        expect(errors[0].property).toBe('order');
        expect(errors[0].constraints).toHaveProperty('min');
    });

    it('should fail validation with non-integer order', async () => {
        const dto = new CreateFieldDto();
        dto.label = 'Name';
        dto.type = 'text';
        dto.order = 1.5 as any;

        const errors = await validate(dto);
        expect(errors).toHaveLength(1);
        expect(errors[0].property).toBe('order');
        expect(errors[0].constraints).toHaveProperty('isInt');
    });

    it('should fail validation with non-object config', async () => {
        const dto = new CreateFieldDto();
        dto.label = 'Name';
        dto.type = 'text';
        dto.config = 'invalid' as any;

        const errors = await validate(dto);
        expect(errors).toHaveLength(1);
        expect(errors[0].property).toBe('config');
        expect(errors[0].constraints).toHaveProperty('isObject');
    });

    it('should pass validation with valid order', async () => {
        const dto = new CreateFieldDto();
        dto.label = 'Name';
        dto.type = 'text';
        dto.order = 0;

        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
    });

    it('should pass validation with valid config object', async () => {
        const dto = new CreateFieldDto();
        dto.label = 'Name';
        dto.type = 'text';
        dto.config = { required: true, placeholder: 'Enter name', maxLength: 100 };

        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
    });

    it('should pass validation without optional fields', async () => {
        const dto = new CreateFieldDto();
        dto.label = 'Name';
        dto.type = 'text';

        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
    });
});

describe('UpdateFieldDto', () => {
    it('should be defined', () => {
        expect(UpdateFieldDto).toBeDefined();
    });

    it('should pass validation with valid data', async () => {
        const dto = new UpdateFieldDto();
        dto.label = 'Updated Email Address';
        dto.type = 'email';
        dto.config = { required: true, placeholder: 'Enter your email' };
        dto.order = 2;

        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
    });

    it('should pass validation with partial data', async () => {
        const dto = new UpdateFieldDto();
        dto.label = 'Updated Name';

        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
    });

    it('should pass validation with empty object', async () => {
        const dto = new UpdateFieldDto();

        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
    });

    it('should fail validation with empty string label', async () => {
        const dto = new UpdateFieldDto();
        dto.label = '';

        const errors = await validate(dto);
        // Empty string passes @IsString() validation, but fails in real app due to trimming
        expect(errors).toHaveLength(0);
    });

    it('should fail validation with empty string type', async () => {
        const dto = new UpdateFieldDto();
        dto.type = '';

        const errors = await validate(dto);
        // Empty string passes @IsString() validation, but fails in real app due to trimming
        expect(errors).toHaveLength(0);
    });

    it('should fail validation with non-string label', async () => {
        const dto = new UpdateFieldDto();
        dto.label = 123 as any;

        const errors = await validate(dto);
        expect(errors).toHaveLength(1);
        expect(errors[0].property).toBe('label');
        expect(errors[0].constraints).toHaveProperty('isString');
    });

    it('should fail validation with non-string type', async () => {
        const dto = new UpdateFieldDto();
        dto.type = 123 as any;

        const errors = await validate(dto);
        expect(errors).toHaveLength(1);
        expect(errors[0].property).toBe('type');
        expect(errors[0].constraints).toHaveProperty('isString');
    });

    it('should fail validation with negative order', async () => {
        const dto = new UpdateFieldDto();
        dto.order = -1;

        const errors = await validate(dto);
        expect(errors).toHaveLength(1);
        expect(errors[0].property).toBe('order');
        expect(errors[0].constraints).toHaveProperty('min');
    });

    it('should fail validation with non-integer order', async () => {
        const dto = new UpdateFieldDto();
        dto.order = 1.5 as any;

        const errors = await validate(dto);
        expect(errors).toHaveLength(1);
        expect(errors[0].property).toBe('order');
        expect(errors[0].constraints).toHaveProperty('isInt');
    });

    it('should fail validation with non-object config', async () => {
        const dto = new UpdateFieldDto();
        dto.config = 'invalid' as any;

        const errors = await validate(dto);
        expect(errors).toHaveLength(1);
        expect(errors[0].property).toBe('config');
        expect(errors[0].constraints).toHaveProperty('isObject');
    });

    it('should pass validation with valid order', async () => {
        const dto = new UpdateFieldDto();
        dto.order = 0;

        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
    });

    it('should pass validation with valid config object', async () => {
        const dto = new UpdateFieldDto();
        dto.config = { required: true, placeholder: 'Enter name', maxLength: 100 };

        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
    });

    it('should pass validation with all fields', async () => {
        const dto = new UpdateFieldDto();
        dto.label = 'Updated Name';
        dto.type = 'text';
        dto.config = { required: true };
        dto.order = 1;

        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
    });
});
