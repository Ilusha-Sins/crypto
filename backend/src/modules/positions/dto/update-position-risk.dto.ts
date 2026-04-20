import { IsNumberString, IsOptional } from 'class-validator';

export class UpdatePositionRiskDto {
  @IsOptional()
  @IsNumberString()
  stopLoss?: string | null;

  @IsOptional()
  @IsNumberString()
  takeProfit?: string | null;
}