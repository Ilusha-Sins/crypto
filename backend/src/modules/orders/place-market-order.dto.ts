import {
  IsEnum,
  IsNumberString,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';
import { OrderSide } from '@prisma/client';

export class PlaceMarketOrderDto {
  @IsString()
  @MinLength(6)
  @Matches(/^[A-Z0-9]+$/)
  symbol!: string;

  @IsEnum(OrderSide)
  side!: OrderSide;

  @IsNumberString()
  quantity!: string;

  @IsOptional()
  @IsNumberString()
  stopLoss?: string;

  @IsOptional()
  @IsNumberString()
  takeProfit?: string;
}