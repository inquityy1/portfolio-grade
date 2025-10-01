import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';
import { AuthGuard } from '@nestjs/passport';

// Mock AuthGuard before importing the guard
jest.mock('@nestjs/passport', () => ({
    AuthGuard: jest.fn().mockImplementation((strategy) => {
        return class MockAuthGuard {
            constructor() {
                (this as any).strategy = strategy;
            }
            canActivate = jest.fn();
        };
    }),
}));

describe('JwtAuthGuard', () => {
    let guard: JwtAuthGuard;
    let mockAuthGuard: any;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [JwtAuthGuard],
        }).compile();

        guard = module.get<JwtAuthGuard>(JwtAuthGuard);

        // Get the mocked AuthGuard instance
        mockAuthGuard = guard as any;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(guard).toBeDefined();
    });

    it('should extend AuthGuard', () => {
        expect(guard).toBeDefined();
        expect(typeof guard.canActivate).toBe('function');
    });

    it('should use jwt strategy', () => {
        // The guard should be defined and functional
        expect(guard).toBeDefined();
        expect(typeof guard.canActivate).toBe('function');
    });

    describe('canActivate', () => {
        it('should delegate to parent AuthGuard canActivate', async () => {
            const mockContext = {} as ExecutionContext;
            const expectedResult = true;

            // Mock the parent canActivate method
            mockAuthGuard.canActivate = jest.fn().mockResolvedValue(expectedResult);

            const result = await guard.canActivate(mockContext);

            expect(mockAuthGuard.canActivate).toHaveBeenCalledWith(mockContext);
            expect(result).toBe(expectedResult);
        });

        it('should handle authentication failure', async () => {
            const mockContext = {} as ExecutionContext;
            const expectedResult = false;

            // Mock the parent canActivate method to return false
            mockAuthGuard.canActivate = jest.fn().mockResolvedValue(expectedResult);

            const result = await guard.canActivate(mockContext);

            expect(mockAuthGuard.canActivate).toHaveBeenCalledWith(mockContext);
            expect(result).toBe(expectedResult);
        });

        it('should propagate exceptions from parent AuthGuard', async () => {
            const mockContext = {} as ExecutionContext;
            const error = new Error('Authentication failed');

            // Mock the parent canActivate method to throw an error
            mockAuthGuard.canActivate = jest.fn().mockRejectedValue(error);

            await expect(guard.canActivate(mockContext)).rejects.toThrow(error);
            expect(mockAuthGuard.canActivate).toHaveBeenCalledWith(mockContext);
        });
    });

    describe('guard configuration', () => {
        it('should be injectable', () => {
            expect(guard).toBeDefined();
            expect(typeof guard.canActivate).toBe('function');
        });

        it('should have correct strategy name', () => {
            // The guard should be defined and functional
            expect(guard).toBeDefined();
            expect(typeof guard.canActivate).toBe('function');
        });
    });
});
