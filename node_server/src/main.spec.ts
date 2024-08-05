import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationExceptionFilter } from './common/filters/validation-exception.filter';

jest.mock('@nestjs/core', () => ({
  NestFactory: {
    create: jest.fn(),
  },
}));

describe('Bootstrap', () => {
  let app: any;

  beforeAll(() => {
    app = {
      useGlobalFilters: jest.fn(),
      listen: jest.fn().mockResolvedValue(true),
    };
    (NestFactory.create as jest.Mock).mockResolvedValue(app);
  });

  it('should create the app and apply the global filter', async () => {
    // Importing the main file to trigger the bootstrap function
    await import('./main');

    expect(NestFactory.create).toHaveBeenCalledWith(AppModule);
    expect(app.useGlobalFilters).toHaveBeenCalledWith(
      expect.any(ValidationExceptionFilter),
    );
    expect(app.listen).toHaveBeenCalledWith(3003);
  });
});
