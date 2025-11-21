import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Min,
  MinLength,
} from 'class-validator';
import { ENUM_APP_ENVIRONMENT, ENUM_APP_TIMEZONE } from '@app/enums/app.enum';

export class AppEnvDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  APP_NAME: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @IsEnum(ENUM_APP_ENVIRONMENT)
  APP_ENV: ENUM_APP_ENVIRONMENT;

  @IsString()
  @IsNotEmpty()
  @IsEnum(ENUM_APP_TIMEZONE)
  APP_TIMEZONE: ENUM_APP_TIMEZONE;

  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  HTTP_HOST: string;

  @IsNumber({
    allowInfinity: false,
    allowNaN: false,
    maxDecimalPlaces: 0,
  })
  @IsInt()
  @Min(1)
  @IsNotEmpty()
  @Type(() => Number)
  HTTP_PORT: number;

  @IsBoolean()
  @IsNotEmpty()
  @Type(() => Boolean)
  DEBUG_ENABLE: boolean;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  DEBUG_LEVEL: string;
}
