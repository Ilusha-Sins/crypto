import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
  MinLength,
} from 'class-validator';

export class GetKlinesDto {
  @IsString()
  @MinLength(6)
  @Matches(/^[A-Z0-9]+$/)
  symbol!: string;

  @IsString()
  @Matches(/^\d+(m|h|d|w)$/)
  interval!: string;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1000)
  limit?: number = 500;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  endTime?: number;
}