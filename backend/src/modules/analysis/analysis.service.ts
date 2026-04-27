import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { GoogleGenAI } from '@google/genai';
import { PrismaService } from '../../prisma/prisma.service';
import { MarketKline, MarketService } from '../market/market.service';
import { GetAnalysisHistoryDto } from './dto/get-analysis-history.dto';
import { RunAnalysisDto } from './dto/run-analysis.dto';

type AnalysisSnapshot = {
  candles: number;
  lastClose: number;
  previousClose: number;
  changePercent: number;
  sma20: number;
  sma50: number;
  volumeLast: number;
  volumeAvg20: number;
  recentHigh20: number;
  recentLow20: number;
  volatilityPercent20: number;
  trendBias: 'bullish' | 'bearish' | 'neutral';
  volumeBias: 'high' | 'normal';
  momentumBias: 'bullish' | 'bearish' | 'neutral';
};

type AnalysisResult = {
  provider: 'gemini' | 'fallback';
  summary: string;
  bias: 'bullish' | 'bearish' | 'neutral';
  confidence: 'low' | 'medium' | 'high';
  keySignals: string[];
  risks: string[];
  actionPlan: string[];
  rawText?: string | null;
};

@Injectable()
export class AnalysisService {
  private readonly model =
    process.env.ANALYSIS_MODEL?.trim() || 'gemini-2.5-flash';

  constructor(
    private readonly prisma: PrismaService,
    private readonly marketService: MarketService,
  ) {}

  async runAnalysis(userId: string, dto: RunAnalysisDto) {
    const symbol = dto.symbol.toUpperCase();
    const interval = dto.interval;
    const limit = dto.limit ?? 120;
    const language = dto.language ?? 'uk';

    const account = await this.prisma.demoAccount.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!account) {
      throw new NotFoundException('Demo account not found');
    }

    const klines = await this.marketService.getKlines(symbol, interval, limit);

    if (klines.length < 20) {
      throw new BadRequestException(
        'Not enough market data to build analysis',
      );
    }

    const snapshot = this.buildSnapshot(klines);
    const analysis = await this.generateAnalysis(symbol, interval, snapshot, language);

    const payload = {
      symbol,
      interval,
      generatedAt: new Date().toISOString(),
      snapshot,
      analysis,
    };

    const saved = await this.prisma.analysisHistory.create({
      data: {
        userId,
        symbol,
        interval,
        response: payload as Prisma.InputJsonValue,
      },
    });

    return {
      id: saved.id,
      createdAt: saved.createdAt,
      ...payload,
    };
  }

  async getAnalysisHistory(userId: string, query: GetAnalysisHistoryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.AnalysisHistoryWhereInput = {
      userId,
      ...(query.symbol ? { symbol: query.symbol.toUpperCase() } : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.analysisHistory.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.analysisHistory.count({ where }),
    ]);

    return {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      items,
    };
  }

  async getAnalysisById(userId: string, analysisId: string) {
    const item = await this.prisma.analysisHistory.findFirst({
      where: {
        id: analysisId,
        userId,
      },
    });

    if (!item) {
      throw new NotFoundException('Analysis not found');
    }

    return item;
  }

  private buildSnapshot(klines: MarketKline[]): AnalysisSnapshot {
    const closes = klines.map((k) => k.close);
    const highs = klines.map((k) => k.high);
    const lows = klines.map((k) => k.low);
    const volumes = klines.map((k) => k.volume);

    const lastClose = closes.at(-1) ?? 0;
    const previousClose = closes.at(-2) ?? lastClose;

    const sma20 = this.average(closes.slice(-20));
    const sma50 = this.average(closes.slice(-50));
    const volumeLast = volumes.at(-1) ?? 0;
    const volumeAvg20 = this.average(volumes.slice(-20));
    const recentHigh20 = Math.max(...highs.slice(-20));
    const recentLow20 = Math.min(...lows.slice(-20));

    const changePercent =
      previousClose === 0
        ? 0
        : ((lastClose - previousClose) / previousClose) * 100;

    const volatilityPercent20 =
      lastClose === 0 ? 0 : ((recentHigh20 - recentLow20) / lastClose) * 100;

    const trendBias =
      lastClose > sma20 && sma20 > sma50
        ? 'bullish'
        : lastClose < sma20 && sma20 < sma50
          ? 'bearish'
          : 'neutral';

    const volumeBias = volumeLast > volumeAvg20 ? 'high' : 'normal';

    const momentumReference = closes.at(-5) ?? previousClose;
    const momentumBias =
      lastClose > momentumReference
        ? 'bullish'
        : lastClose < momentumReference
          ? 'bearish'
          : 'neutral';

    return {
      candles: klines.length,
      lastClose: this.round(lastClose),
      previousClose: this.round(previousClose),
      changePercent: this.round(changePercent),
      sma20: this.round(sma20),
      sma50: this.round(sma50),
      volumeLast: this.round(volumeLast),
      volumeAvg20: this.round(volumeAvg20),
      recentHigh20: this.round(recentHigh20),
      recentLow20: this.round(recentLow20),
      volatilityPercent20: this.round(volatilityPercent20),
      trendBias,
      volumeBias,
      momentumBias,
    };
  }

  private async generateAnalysis(
    symbol: string,
    interval: string,
    snapshot: AnalysisSnapshot,
    language: 'uk' | 'en',
  ): Promise<AnalysisResult> {
    const apiKey = process.env.GEMINI_API_KEY?.trim();

    if (!apiKey) {
      return this.buildFallbackAnalysis(snapshot, language);
    }

    const client = new GoogleGenAI({ apiKey });

    const languageLabel = language === 'uk' ? 'Ukrainian' : 'English';

    const prompt = `
You are a crypto market analyst.
Analyze the market snapshot and return ONLY valid JSON.
Language: ${languageLabel}

Required JSON schema:
{
  "summary": "string",
  "bias": "bullish | bearish | neutral",
  "confidence": "low | medium | high",
  "keySignals": ["string"],
  "risks": ["string"],
  "actionPlan": ["string"]
}

Context:
symbol=${symbol}
interval=${interval}
snapshot=${JSON.stringify(snapshot)}
    `.trim();

    try {
      const response = await client.models.generateContent({
        model: this.model,
        contents: prompt,
      });

      const text = this.extractText(response);
      const parsed = this.tryParseJson(text);

      if (
        parsed &&
        typeof parsed.summary === 'string' &&
        typeof parsed.bias === 'string' &&
        typeof parsed.confidence === 'string' &&
        Array.isArray(parsed.keySignals) &&
        Array.isArray(parsed.risks) &&
        Array.isArray(parsed.actionPlan)
      ) {
        return {
          provider: 'gemini',
          summary: parsed.summary,
          bias: this.normalizeBias(parsed.bias),
          confidence: this.normalizeConfidence(parsed.confidence),
          keySignals: parsed.keySignals.map(String),
          risks: parsed.risks.map(String),
          actionPlan: parsed.actionPlan.map(String),
          rawText: text,
        };
      }

      const fallback = this.buildFallbackAnalysis(snapshot, language);

return {
  ...fallback,
  provider: 'gemini',
  rawText: text,
};
    } catch {
      return this.buildFallbackAnalysis(snapshot, language);
    }
  }

  private buildFallbackAnalysis(
    snapshot: AnalysisSnapshot,
    language: 'uk' | 'en',
  ): AnalysisResult {
    const bias = snapshot.trendBias;
    const confidence: 'low' | 'medium' | 'high' =
      snapshot.trendBias !== 'neutral' &&
      snapshot.momentumBias === snapshot.trendBias
        ? 'high'
        : snapshot.trendBias === 'neutral'
          ? 'low'
          : 'medium';

    if (language === 'en') {
      return {
        provider: 'fallback',
        summary: this.buildEnglishSummary(snapshot),
        bias,
        confidence,
        keySignals: [
          `Price vs SMA20: ${snapshot.lastClose} / ${snapshot.sma20}`,
          `Price vs SMA50: ${snapshot.lastClose} / ${snapshot.sma50}`,
          `24h-like move on selected interval tail: ${snapshot.changePercent}%`,
          `Volume state: ${snapshot.volumeBias}`,
        ],
        risks: [
          `Recent 20-candle volatility is ${snapshot.volatilityPercent20}%`,
          snapshot.volumeBias === 'normal'
            ? 'Volume confirmation is weak'
            : 'Momentum can fade after a volume spike',
        ],
        actionPlan: [
          bias === 'bullish'
            ? 'Look for continuation only if price stays above SMA20'
            : bias === 'bearish'
              ? 'Avoid aggressive longs while price stays below SMA20'
              : 'Wait for breakout above resistance or breakdown below support',
          `Watch support near ${snapshot.recentLow20} and resistance near ${snapshot.recentHigh20}`,
        ],
      };
    }

    return {
      provider: 'fallback',
      summary: this.buildUkrainianSummary(snapshot),
      bias,
      confidence,
      keySignals: [
        `Ціна відносно SMA20: ${snapshot.lastClose} / ${snapshot.sma20}`,
        `Ціна відносно SMA50: ${snapshot.lastClose} / ${snapshot.sma50}`,
        `Остання зміна: ${snapshot.changePercent}%`,
        `Стан об'єму: ${snapshot.volumeBias}`,
      ],
      risks: [
        `Волатильність за останні 20 свічок: ${snapshot.volatilityPercent20}%`,
        snapshot.volumeBias === 'normal'
          ? "Об'єм не дає сильного підтвердження"
          : "Після сплеску об'єму імпульс може згаснути",
      ],
      actionPlan: [
        bias === 'bullish'
          ? 'Розглядати продовження руху, якщо ціна тримається вище SMA20'
          : bias === 'bearish'
            ? 'Не поспішати з лонгами, поки ціна нижче SMA20'
            : 'Чекати пробою опору або зламу підтримки',
        `Стежити за підтримкою біля ${snapshot.recentLow20} і опором біля ${snapshot.recentHigh20}`,
      ],
    };
  }

  private buildUkrainianSummary(snapshot: AnalysisSnapshot) {
    if (snapshot.trendBias === 'bullish') {
      return `Ринок має помірно бичачий нахил: ціна тримається вище ковзних середніх, а імпульс не виглядає слабким.`;
    }

    if (snapshot.trendBias === 'bearish') {
      return `Ринок виглядає слабко: ціна нижче ключових середніх, а структура руху більше схиляється до ведмежого сценарію.`;
    }

    return `Чіткого тренду немає: ринок перебуває у нейтральній зоні, тому краще чекати підтвердження напрямку.`;
  }

  private buildEnglishSummary(snapshot: AnalysisSnapshot) {
    if (snapshot.trendBias === 'bullish') {
      return `The market has a moderately bullish tilt: price is holding above moving averages and momentum is not weak.`;
    }

    if (snapshot.trendBias === 'bearish') {
      return `The market looks soft: price is below key moving averages and the structure leans bearish.`;
    }

    return `There is no clean trend yet: the market is in a neutral zone, so it is better to wait for confirmation.`;
  }

  private extractText(response: unknown) {
    if (
      typeof response === 'object' &&
      response !== null &&
      'text' in response &&
      typeof (response as { text?: unknown }).text === 'string'
    ) {
      return (response as { text: string }).text.trim();
    }

    return '';
  }

  private tryParseJson(text: string): Record<string, unknown> | null {
    if (!text) {
      return null;
    }

    const cleaned = text
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    try {
      return JSON.parse(cleaned) as Record<string, unknown>;
    } catch {
      return null;
    }
  }

  private normalizeBias(value: string): 'bullish' | 'bearish' | 'neutral' {
    if (value === 'bullish' || value === 'bearish') {
      return value;
    }

    return 'neutral';
  }

  private normalizeConfidence(value: string): 'low' | 'medium' | 'high' {
    if (value === 'low' || value === 'medium' || value === 'high') {
      return value;
    }

    return 'medium';
  }

  private average(values: number[]) {
    if (values.length === 0) {
      return 0;
    }

    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }

  private round(value: number) {
    return Number(value.toFixed(6));
  }
}