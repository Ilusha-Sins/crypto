import { BadRequestException, Injectable } from '@nestjs/common';

type BinancePriceResponse = {
  symbol: string;
  price: string;
};

@Injectable()
export class MarketService {
  private readonly baseUrl =
    process.env.BINANCE_REST_BASE_URL ?? 'https://api.binance.com';

  async getCurrentPrice(symbol: string) {
    const normalizedSymbol = symbol.toUpperCase();

    const url = new URL('/api/v3/ticker/price', this.baseUrl);
    url.searchParams.set('symbol', normalizedSymbol);

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new BadRequestException(
        `Failed to fetch market price for ${normalizedSymbol}`,
      );
    }

    const data = (await response.json()) as BinancePriceResponse;

    if (!data?.price) {
      throw new BadRequestException(
        `No market price returned for ${normalizedSymbol}`,
      );
    }

    return {
      symbol: data.symbol,
      price: data.price,
    };
  }
}