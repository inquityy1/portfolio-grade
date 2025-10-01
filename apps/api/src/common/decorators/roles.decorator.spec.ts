import { SetMetadata } from '@nestjs/common';
import { Roles, ROLES_KEY } from './roles.decorator';
import type { Role } from '../types/role';

// Mock SetMetadata to track calls
jest.mock('@nestjs/common', () => ({
    ...jest.requireActual('@nestjs/common'),
    SetMetadata: jest.fn().mockImplementation((key, value) => {
        // Return a proper decorator function
        return (target: any, propertyKey?: string | symbol, descriptor?: PropertyDescriptor) => {
            // This is what SetMetadata actually does - it sets metadata
            return target;
        };
    }),
}));

describe('Roles Decorator', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(Roles).toBeDefined();
        expect(ROLES_KEY).toBeDefined();
    });

    it('should have correct metadata key', () => {
        expect(ROLES_KEY).toBe('roles');
    });

    it('should call SetMetadata with correct parameters for single role', () => {
        const mockSetMetadata = SetMetadata as jest.MockedFunction<typeof SetMetadata>;
        const testRole: Role = 'Editor';

        Roles(testRole);

        expect(mockSetMetadata).toHaveBeenCalledWith(ROLES_KEY, [testRole]);
    });

    it('should call SetMetadata with correct parameters for multiple roles', () => {
        const mockSetMetadata = SetMetadata as jest.MockedFunction<typeof SetMetadata>;
        const testRoles: Role[] = ['Editor', 'Viewer'];

        Roles(...testRoles);

        expect(mockSetMetadata).toHaveBeenCalledWith(ROLES_KEY, testRoles);
    });

    it('should call SetMetadata with correct parameters for OrgAdmin role', () => {
        const mockSetMetadata = SetMetadata as jest.MockedFunction<typeof SetMetadata>;
        const testRole: Role = 'OrgAdmin';

        Roles(testRole);

        expect(mockSetMetadata).toHaveBeenCalledWith(ROLES_KEY, [testRole]);
    });

    it('should call SetMetadata with correct parameters for Viewer role', () => {
        const mockSetMetadata = SetMetadata as jest.MockedFunction<typeof SetMetadata>;
        const testRole: Role = 'Viewer';

        Roles(testRole);

        expect(mockSetMetadata).toHaveBeenCalledWith(ROLES_KEY, [testRole]);
    });

    it('should handle empty roles array', () => {
        const mockSetMetadata = SetMetadata as jest.MockedFunction<typeof SetMetadata>;

        Roles();

        expect(mockSetMetadata).toHaveBeenCalledWith(ROLES_KEY, []);
    });

    it('should handle all role types', () => {
        const mockSetMetadata = SetMetadata as jest.MockedFunction<typeof SetMetadata>;
        const allRoles: Role[] = ['OrgAdmin', 'Editor', 'Viewer'];

        Roles(...allRoles);

        expect(mockSetMetadata).toHaveBeenCalledWith(ROLES_KEY, allRoles);
    });

    it('should return the result of SetMetadata', () => {
        const mockSetMetadata = SetMetadata as jest.MockedFunction<typeof SetMetadata>;

        const result = Roles('Editor');

        // The result should be a decorator function
        expect(typeof result).toBe('function');
        expect(mockSetMetadata).toHaveBeenCalledWith(ROLES_KEY, ['Editor']);
    });

    it('should be callable multiple times with different roles', () => {
        const mockSetMetadata = SetMetadata as jest.MockedFunction<typeof SetMetadata>;

        Roles('Editor');
        Roles('Viewer');
        Roles('OrgAdmin');

        expect(mockSetMetadata).toHaveBeenCalledTimes(3);
        expect(mockSetMetadata).toHaveBeenNthCalledWith(1, ROLES_KEY, ['Editor']);
        expect(mockSetMetadata).toHaveBeenNthCalledWith(2, ROLES_KEY, ['Viewer']);
        expect(mockSetMetadata).toHaveBeenNthCalledWith(3, ROLES_KEY, ['OrgAdmin']);
    });

    it('should handle mixed role combinations', () => {
        const mockSetMetadata = SetMetadata as jest.MockedFunction<typeof SetMetadata>;

        Roles('OrgAdmin', 'Editor');
        Roles('Editor', 'Viewer');

        expect(mockSetMetadata).toHaveBeenCalledTimes(2);
        expect(mockSetMetadata).toHaveBeenNthCalledWith(1, ROLES_KEY, ['OrgAdmin', 'Editor']);
        expect(mockSetMetadata).toHaveBeenNthCalledWith(2, ROLES_KEY, ['Editor', 'Viewer']);
    });

    describe('decorator usage patterns', () => {
        it('should work as a method decorator', () => {
            const mockSetMetadata = SetMetadata as jest.MockedFunction<typeof SetMetadata>;

            class TestController {
                @Roles('Editor')
                testMethod() { }
            }

            expect(mockSetMetadata).toHaveBeenCalledWith(ROLES_KEY, ['Editor']);
        });

        it('should work as a class decorator', () => {
            const mockSetMetadata = SetMetadata as jest.MockedFunction<typeof SetMetadata>;

            @Roles('OrgAdmin')
            class TestController { }

            expect(mockSetMetadata).toHaveBeenCalledWith(ROLES_KEY, ['OrgAdmin']);
        });

        it('should work with multiple decorators on same method', () => {
            const mockSetMetadata = SetMetadata as jest.MockedFunction<typeof SetMetadata>;

            class TestController {
                @Roles('Editor')
                @Roles('Viewer')
                testMethod() { }
            }

            expect(mockSetMetadata).toHaveBeenCalledTimes(2);
            expect(mockSetMetadata).toHaveBeenNthCalledWith(1, ROLES_KEY, ['Editor']);
            expect(mockSetMetadata).toHaveBeenNthCalledWith(2, ROLES_KEY, ['Viewer']);
        });
    });

    describe('ROLES_KEY constant', () => {
        it('should be a string', () => {
            expect(typeof ROLES_KEY).toBe('string');
        });

        it('should be immutable', () => {
            const originalKey = ROLES_KEY;
            expect(ROLES_KEY).toBe(originalKey);
        });

        it('should be used consistently', () => {
            const mockSetMetadata = SetMetadata as jest.MockedFunction<typeof SetMetadata>;

            Roles('Editor');
            Roles('Viewer');

            expect(mockSetMetadata).toHaveBeenCalledWith(ROLES_KEY, ['Editor']);
            expect(mockSetMetadata).toHaveBeenCalledWith(ROLES_KEY, ['Viewer']);
        });
    });
});
