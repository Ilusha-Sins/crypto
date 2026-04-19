import { Controller, Get, Query } from '@nestjs/common';
import { GetPriceDto } from './dto/get-price.dto';
import { MarketService } from './market.service';

@Controller('market')
export class MarketController {
  constructor(private readonly marketService: MarketService) {}

  @Get('price')
  getPrice(@Query() query: GetPriceDto) {
    return this.marketService.getCurrentPrice(query.symbol);
  }
} 