import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

const ALLOWED_INTERVALS = ['1m', '5m', '15m', '1h', '4h', '1d'] as const;
const ALLOWED_LANGUAGES = ['uk', 'en'] as const;

export class RunAnalysisDto {
  @IsString()
  @Matches(/^[A-Z0-9]+$/)
  symbol!: string;

  @IsString()
  @IsIn(ALLOWED_INTERVALS)
  interval!: (typeof ALLOWED_INTERVALS)[number];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(30)
  @Max(500)
  limit?: number = 120;

  @IsOptional()
  @IsString()
  @IsIn(ALLOWED_LANGUAGES)
  language?: (typeof ALLOWED_LANGUAGES)[number] = 'uk';
}