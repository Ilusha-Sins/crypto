import { BadRequestException, Injectable } from '@nestjs/common';

type BinancePriceResponse = {
  symbol: string;
  price: string;
};

type BinanceExchangeInfoResponse = {
  symbols: Array<{
    symbol: string;
    status: string;
    baseAsset: string;
    quoteAsset: string;
  }>;
};

type BinanceKlineRow = [
  number,
  string,
  string,
  string,
  string,
  string,
  number,
  string,
  number,
  string,
  string,
  string,
];

export type MarketKline = {
  openTime: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  closeTime: number;
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

  async getTradableSymbols() {
    const url = new URL('/api/v3/exchangeInfo', this.baseUrl);

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new BadRequestException('Failed to fetch symbols list');
    }

    const data = (await response.json()) as BinanceExchangeInfoResponse;

    if (!Array.isArray(data?.symbols)) {
      throw new BadRequestException('Invalid exchange info response');
    }

    const items = data.symbols
      .filter((item) => item.quoteAsset === 'USDT' && item.status === 'TRADING')
      .map((item) => item.baseAsset)
      .filter((value, index, array) => array.indexOf(value) === index)
      .sort();

    return { items };
  }

  async getKlines(
    symbol: string,
    interval: string,
    limit = 100,
    endTime?: number,
  ) {
    const normalizedSymbol = symbol.toUpperCase();

    const url = new URL('/api/v3/klines', this.baseUrl);
    url.searchParams.set('symbol', normalizedSymbol);
    url.searchParams.set('interval', interval);
    url.searchParams.set('limit', String(limit));

    if (endTime) {
      url.searchParams.set('endTime', String(endTime));
    }

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new BadRequestException(
        `Failed to fetch klines for ${normalizedSymbol} (${interval})`,
      );
    }

    const rows = (await response.json()) as BinanceKlineRow[];

    if (!Array.isArray(rows) || rows.length === 0) {
      throw new BadRequestException(
        `No klines returned for ${normalizedSymbol} (${interval})`,
      );
    }

    return rows.map<MarketKline>((row) => ({
      openTime: row[0],
      open: Number(row[1]),
      high: Number(row[2]),
      low: Number(row[3]),
      close: Number(row[4]),
      volume: Number(row[5]),
      closeTime: row[6],
    }));
  }
}