import { ApiKeyMiddleware } from './api-key.middleware';
import { UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

describe('ApiKeyMiddleware', () => {
  let middleware: ApiKeyMiddleware;
  const mockApiKey = 'valid-api-key';

  beforeAll(() => {
    process.env.API_KEY = mockApiKey;
  });

  beforeEach(() => {
    middleware = new ApiKeyMiddleware();
  });

  it('should call next function if API key is valid', () => {
    const req = { headers: { api_key: mockApiKey } } as unknown as Request;
    const res = {} as Response;
    const next = jest.fn() as NextFunction;

    middleware.use(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('should throw UnauthorizedException if API key is missing', () => {
    const req = { headers: {} } as Request;
    const res = {} as Response;
    const next = jest.fn() as NextFunction;

    expect(() => middleware.use(req, res, next)).toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException if API key is invalid', () => {
    const req = { headers: { api_key: 'invalid-api-key' } } as unknown as Request;
    const res = {} as Response;
    const next = jest.fn() as NextFunction;

    expect(() => middleware.use(req, res, next)).toThrow(UnauthorizedException);
  });
});
