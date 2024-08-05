import { ValidateStringPipe, ValidateUUIDPipe } from './param-validator.pipe';
import { ArgumentMetadata, BadRequestException } from '@nestjs/common';

describe('ValidateStringPipe', () => {
  let validateStringPipe: ValidateStringPipe;
  const metadata: ArgumentMetadata = {
    type: 'param',
    metatype: String,
    data: 'testString',
  };

  beforeEach(() => {
    validateStringPipe = new ValidateStringPipe();
  });

  it('should return the value if it is a string', () => {
    const value = 'validString';
    expect(validateStringPipe.transform(value, metadata)).toBe(value);
  });

  it('should throw BadRequestException if value is not a string', () => {
    const value = 123;
    expect(() => validateStringPipe.transform(value, metadata)).toThrow(
      new BadRequestException('testString is required and must be a string.'),
    );
  });
});

describe('ValidateUUIDPipe', () => {
  let validateUUIDPipe: ValidateUUIDPipe;
  const metadata: ArgumentMetadata = {
    type: 'param',
    metatype: String,
    data: 'testUUID',
  };

  beforeEach(() => {
    validateUUIDPipe = new ValidateUUIDPipe();
  });

  it('should return the value if it is a valid UUID', () => {
    const value = '550e8400-e29b-41d4-a716-446655440000';
    expect(validateUUIDPipe.transform(value, metadata)).toBe(value);
  });

  it('should throw BadRequestException if value is not a valid UUID', () => {
    const value = 'invalidUUID';
    expect(() => validateUUIDPipe.transform(value, metadata)).toThrow(
      new BadRequestException('testUUID is required and must be a UUID.'),
    );
  });
});
