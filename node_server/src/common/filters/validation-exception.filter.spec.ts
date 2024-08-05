import { ValidationExceptionFilter } from './validation-exception.filter';
import { ArgumentsHost, BadRequestException } from '@nestjs/common';
import { ValidationError } from 'class-validator';
import { Response } from 'express';

describe('ValidationExceptionFilter', () => {
  let filter: ValidationExceptionFilter;

  beforeEach(() => {
    filter = new ValidationExceptionFilter();
  });

  it('should catch and format validation errors', () => {
    const mockValidationErrors: ValidationError[] = [
      {
        property: 'name',
        constraints: {
          isString: 'name must be a string',
        },
      },
    ];

    const mockException = new BadRequestException({
      message: mockValidationErrors,
    });

    const mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;

    const mockHost: ArgumentsHost = {
      switchToHttp: jest.fn().mockReturnThis(),
      getResponse: jest.fn().mockReturnValue(mockResponse),
      getRequest: jest.fn(),
    } as unknown as ArgumentsHost;

    filter.catch(mockException, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      statusCode: 400,
      error: 'Bad Request',
      message: [
        {
          property: 'name',
          constraints: {
            isString: 'name must be a string',
          },
        },
      ],
    });
  });

  it('should handle empty validation errors', () => {
    const mockException = new BadRequestException({
      message: [],
    });

    const mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;

    const mockHost: ArgumentsHost = {
      switchToHttp: jest.fn().mockReturnThis(),
      getResponse: jest.fn().mockReturnValue(mockResponse),
      getRequest: jest.fn(),
    } as unknown as ArgumentsHost;

    filter.catch(mockException, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      statusCode: 400,
      error: 'Bad Request',
      message: [],
    });
  });
});
