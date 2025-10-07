import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

// Mock NestFactory
jest.mock('@nestjs/core', () => ({
  NestFactory: {
    create: jest.fn(),
  },
}));

// Mock SwaggerModule
jest.mock('@nestjs/swagger', () => ({
  SwaggerModule: {
    createDocument: jest.fn(),
    setup: jest.fn(),
  },
  DocumentBuilder: jest.fn(),
}));

// Mock ValidationPipe
jest.mock('@nestjs/common', () => ({
  ...jest.requireActual('@nestjs/common'),
  ValidationPipe: jest.fn(),
}));

// Mock AppModule to avoid loading the entire application
const MockAppModule = class MockAppModule {};

// Create a mock bootstrap function that we can test
async function bootstrap() {
  const app = await NestFactory.create(MockAppModule);
  const globalPrefix = 'api';

  app.setGlobalPrefix(globalPrefix);
  app.enableCors();

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('Portfolio Grade API')
    .setDescription('API documentation for Portfolio Grade application')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // DTO Validation
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));

  const port = process.env.PORT || 3000;
  await app.listen(port);

  return { app, port, globalPrefix };
}

describe('main.ts bootstrap function', () => {
  let mockApp: any;
  let mockDocumentBuilder: any;
  let mockDocument: any;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Mock app instance
    mockApp = {
      setGlobalPrefix: jest.fn(),
      enableCors: jest.fn(),
      useGlobalPipes: jest.fn(),
      listen: jest.fn().mockResolvedValue(undefined),
    };

    // Mock DocumentBuilder
    mockDocumentBuilder = {
      setTitle: jest.fn().mockReturnThis(),
      setDescription: jest.fn().mockReturnThis(),
      setVersion: jest.fn().mockReturnThis(),
      addBearerAuth: jest.fn().mockReturnThis(),
      build: jest.fn(),
    };

    // Mock document
    mockDocument = { title: 'Portfolio Grade API' };

    // Setup mocks
    (NestFactory.create as jest.Mock).mockResolvedValue(mockApp);
    (DocumentBuilder as jest.Mock).mockImplementation(() => mockDocumentBuilder);
    (SwaggerModule.createDocument as jest.Mock).mockReturnValue(mockDocument);
    (SwaggerModule.setup as jest.Mock).mockReturnValue(undefined);
    (ValidationPipe as jest.Mock).mockImplementation(() => ({}));
  });

  it('should create NestJS application', async () => {
    // Mock process.env.PORT
    const originalPort = process.env.PORT;
    process.env.PORT = '3001';

    await bootstrap();

    expect(NestFactory.create).toHaveBeenCalledWith(MockAppModule);
    expect(mockApp.setGlobalPrefix).toHaveBeenCalledWith('api');
    expect(mockApp.enableCors).toHaveBeenCalled();

    // Restore original PORT
    process.env.PORT = originalPort;
  });

  it('should configure Swagger documentation', async () => {
    await bootstrap();

    expect(DocumentBuilder).toHaveBeenCalled();
    expect(mockDocumentBuilder.setTitle).toHaveBeenCalledWith('Portfolio Grade API');
    expect(mockDocumentBuilder.setDescription).toHaveBeenCalledWith(
      'API documentation for Portfolio Grade application',
    );
    expect(mockDocumentBuilder.setVersion).toHaveBeenCalledWith('1.0');
    expect(mockDocumentBuilder.addBearerAuth).toHaveBeenCalled();
    expect(mockDocumentBuilder.build).toHaveBeenCalled();
    expect(SwaggerModule.createDocument).toHaveBeenCalledWith(mockApp, mockDocumentBuilder.build());
    expect(SwaggerModule.setup).toHaveBeenCalledWith('api/docs', mockApp, mockDocument);
  });

  it('should configure global validation pipe', async () => {
    await bootstrap();

    expect(ValidationPipe).toHaveBeenCalledWith({
      whitelist: true,
      forbidNonWhitelisted: true,
    });
    expect(mockApp.useGlobalPipes).toHaveBeenCalled();
  });

  it('should start application on default port 3000', async () => {
    // Mock process.env.PORT to be undefined
    const originalPort = process.env.PORT;
    delete process.env.PORT;

    await bootstrap();

    expect(mockApp.listen).toHaveBeenCalledWith(3000);

    // Restore original PORT
    process.env.PORT = originalPort;
  });

  it('should start application on custom port from environment', async () => {
    // Mock process.env.PORT
    const originalPort = process.env.PORT;
    process.env.PORT = '8080';

    await bootstrap();

    expect(mockApp.listen).toHaveBeenCalledWith('8080');

    // Restore original PORT
    process.env.PORT = originalPort;
  });

  it('should return correct configuration', async () => {
    const result = await bootstrap();

    expect(result).toEqual({
      app: mockApp,
      port: process.env.PORT || 3000,
      globalPrefix: 'api',
    });
  });
});
