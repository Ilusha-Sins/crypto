import { IsString, Matches, MinLength } from 'class-validator';

export class GetPriceDto {
  @IsString()
  @MinLength(6)
  @Matches(/^[A-Z0-9]+$/)
  symbol!: string;
}