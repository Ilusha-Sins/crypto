import { Controller, Get, Query } from '@nestjs/common';
import { GetKlinesDto } from './dto/get-klines.dto';
import { GetPriceDto } from './dto/get-price.dto';
import { MarketService } from './market.service';

@Controller('market')
export class MarketController {
  constructor(private readonly marketService: MarketService) {}

  @Get('price')
  getPrice(@Query() query: GetPriceDto) {
    return this.marketService.getCurrentPrice(query.symbol);
  }

  @Get('symbols')
  getSymbols() {
    return this.marketService.getTradableSymbols();
  }

  @Get('klines')
  getKlines(@Query() query: GetKlinesDto) {
    return this.marketService.getKlines(
      query.symbol,
      query.interval,
      query.limit ?? 500,
      query.endTime,
    );
  }
}