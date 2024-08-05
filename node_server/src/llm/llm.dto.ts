import { IsString, IsNotEmpty } from 'class-validator';

export class CreateSessionDto {
  @IsString()
  @IsNotEmpty()
  model_name: string;
}

export class QueryDto {
  @IsString()
  @IsNotEmpty()
  query: string;
}

export class SwitchModelDto {
  @IsString()
  @IsNotEmpty()
  model_name: string;
}
