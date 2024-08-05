import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  BadRequestException,
} from '@nestjs/common';
import { ValidationError } from 'class-validator';
import { Response } from 'express';

@Catch(BadRequestException)
export class ValidationExceptionFilter implements ExceptionFilter {
  catch(exception: BadRequestException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();

    const exceptionResponse: any = exception.getResponse();
    const validationErrors = exceptionResponse.message;

    const formattedErrors = this.formatErrors(validationErrors);

    response.status(status).json({
      statusCode: status,
      error: 'Bad Request',
      message: formattedErrors,
    });
  }

  private formatErrors(errors: ValidationError[]): any[] {
    return errors.map((error) => ({
      property: error.property,
      constraints: error.constraints,
    }));
  }
}
