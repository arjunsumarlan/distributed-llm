import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';
import { isString, isUUID } from 'class-validator';

@Injectable()
export class ValidateStringPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    if (!isString(value)) {
      throw new BadRequestException(
        `${metadata.data} is required and must be a string.`,
      );
    }
    return value;
  }
}

@Injectable()
export class ValidateUUIDPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    if (!isUUID(value)) {
      throw new BadRequestException(
        `${metadata.data} is required and must be a UUID.`,
      );
    }
    return value;
  }
}
