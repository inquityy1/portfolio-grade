import { Test, TestingModule } from '@nestjs/testing';
import { AuthModule } from '../auth.module';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';
import { JwtStrategy } from '../strategies/jwt.strategy';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';

describe('AuthModule', () => {
    let module: TestingModule;

    beforeEach(async () => {
        module = await Test.createTestingModule({
            imports: [AuthModule],
        }).compile();
    });

    afterEach(async () => {
        await module.close();
    });

    it('should be defined', () => {
        expect(module).toBeDefined();
    });

    it('should provide AuthController', () => {
        const controller = module.get<AuthController>(AuthController);
        expect(controller).toBeDefined();
        expect(controller).toBeInstanceOf(AuthController);
    });

    it('should provide AuthService', () => {
        const service = module.get<AuthService>(AuthService);
        expect(service).toBeDefined();
        expect(service).toBeInstanceOf(AuthService);
    });

    it('should provide JwtStrategy', () => {
        const strategy = module.get<JwtStrategy>(JwtStrategy);
        expect(strategy).toBeDefined();
        expect(strategy).toBeInstanceOf(JwtStrategy);
    });

    it('should provide JwtAuthGuard', () => {
        const guard = module.get<JwtAuthGuard>(JwtAuthGuard);
        expect(guard).toBeDefined();
        expect(guard).toBeInstanceOf(JwtAuthGuard);
    });

    it('should provide RolesGuard', () => {
        const guard = module.get<RolesGuard>(RolesGuard);
        expect(guard).toBeDefined();
        expect(guard).toBeInstanceOf(RolesGuard);
    });

    it('should have correct module structure', () => {
        // Module is already defined and imported successfully
        expect(module).toBeDefined();
    });

  it('should export AuthService', () => {
    const service = module.get<AuthService>(AuthService);
    expect(service).toBeDefined();
    // The service should be available for injection in other modules
    expect(service).toBeInstanceOf(AuthService);
  });
});
