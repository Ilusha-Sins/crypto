import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PositionStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { MarketService } from '../market/market.service';
import { UpdatePositionRiskDto } from './dto/update-position-risk.dto';

@Injectable()
export class PositionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly marketService: MarketService,
  ) {}

  async getOpenPositions(userId: string) {
    const account = await this.prisma.demoAccount.findUnique({
      where: { userId },
    });

    if (!account) {
      throw new NotFoundException('Demo account not found');
    }

    const positions = await this.prisma.position.findMany({
      where: {
        accountId: account.id,
        status: PositionStatus.OPEN,
      },
      orderBy: { createdAt: 'desc' },
    });

    const enriched = await Promise.all(
      positions.map(async (position) => {
        try {
          const market = await this.marketService.getCurrentPrice(position.symbol);
          const currentPrice = new Prisma.Decimal(market.price);
          const currentValue = currentPrice.mul(position.quantity);
          const investedValue = position.averageEntryPrice.mul(position.quantity);
          const unrealizedPnl = currentPrice
            .sub(position.averageEntryPrice)
            .mul(position.quantity);

          const pnlPercent = investedValue.eq(0)
            ? new Prisma.Decimal(0)
            : unrealizedPnl.div(investedValue).mul(100);

          return {
            ...this.serializePosition(position),
            currentPrice: currentPrice.toString(),
            currentValue: currentValue.toString(),
            investedValue: investedValue.toString(),
            unrealizedPnl: unrealizedPnl.toString(),
            pnlPercent: pnlPercent.toString(),
          };
        } catch {
          return {
            ...this.serializePosition(position),
            currentPrice: null,
            currentValue: null,
            investedValue: position.averageEntryPrice
              .mul(position.quantity)
              .toString(),
            unrealizedPnl: null,
            pnlPercent: null,
          };
        }
      }),
    );

    return {
      count: enriched.length,
      positions: enriched,
    };
  }

  async getClosedPositions(userId: string) {
    const account = await this.prisma.demoAccount.findUnique({
      where: { userId },
    });

    if (!account) {
      throw new NotFoundException('Demo account not found');
    }

    const positions = await this.prisma.position.findMany({
      where: {
        accountId: account.id,
        status: PositionStatus.CLOSED,
      },
      orderBy: { closedAt: 'desc' },
    });

    return {
      count: positions.length,
      positions: positions.map((position) => this.serializePosition(position)),
    };
  }

  async getPositionById(userId: string, positionId: string) {
    const account = await this.prisma.demoAccount.findUnique({
      where: { userId },
    });

    if (!account) {
      throw new NotFoundException('Demo account not found');
    }

    const position = await this.prisma.position.findFirst({
      where: {
        id: positionId,
        accountId: account.id,
      },
      include: {
        trades: {
          orderBy: { executedAt: 'desc' },
        },
      },
    });

    if (!position) {
      throw new NotFoundException('Position not found');
    }

    let liveMetrics: {
      currentPrice: string | null;
      currentValue: string | null;
      investedValue: string;
      unrealizedPnl: string | null;
      pnlPercent: string | null;
    } = {
      currentPrice: null,
      currentValue: null,
      investedValue: position.averageEntryPrice.mul(position.quantity).toString(),
      unrealizedPnl: null,
      pnlPercent: null,
    };

    if (position.status === PositionStatus.OPEN) {
      try {
        const market = await this.marketService.getCurrentPrice(position.symbol);
        const currentPrice = new Prisma.Decimal(market.price);
        const currentValue = currentPrice.mul(position.quantity);
        const investedValue = position.averageEntryPrice.mul(position.quantity);
        const unrealizedPnl = currentPrice
          .sub(position.averageEntryPrice)
          .mul(position.quantity);

        const pnlPercent = investedValue.eq(0)
          ? new Prisma.Decimal(0)
          : unrealizedPnl.div(investedValue).mul(100);

        liveMetrics = {
          currentPrice: currentPrice.toString(),
          currentValue: currentValue.toString(),
          investedValue: investedValue.toString(),
          unrealizedPnl: unrealizedPnl.toString(),
          pnlPercent: pnlPercent.toString(),
        };
      } catch {
        liveMetrics = {
          currentPrice: null,
          currentValue: null,
          investedValue: position.averageEntryPrice
            .mul(position.quantity)
            .toString(),
          unrealizedPnl: null,
          pnlPercent: null,
        };
      }
    }

    return {
      ...this.serializePosition(position),
      ...liveMetrics,
      trades: position.trades.map((trade) => ({
        ...trade,
        quantity: trade.quantity.toString(),
        price: trade.price.toString(),
        realizedPnl: trade.realizedPnl?.toString() ?? null,
      })),
    };
  }

  async updateRiskLevels(
    userId: string,
    positionId: string,
    dto: UpdatePositionRiskDto,
  ) {
    const account = await this.prisma.demoAccount.findUnique({
      where: { userId },
    });

    if (!account) {
      throw new NotFoundException('Demo account not found');
    }

    const position = await this.prisma.position.findFirst({
      where: {
        id: positionId,
        accountId: account.id,
      },
    });

    if (!position) {
      throw new NotFoundException('Position not found');
    }

    if (position.status !== PositionStatus.OPEN) {
      throw new BadRequestException('Only open positions can be updated');
    }

    const stopLossValue =
      dto.stopLoss !== undefined && dto.stopLoss !== null
        ? new Prisma.Decimal(dto.stopLoss)
        : dto.stopLoss === null
          ? null
          : undefined;

    const takeProfitValue =
      dto.takeProfit !== undefined && dto.takeProfit !== null
        ? new Prisma.Decimal(dto.takeProfit)
        : dto.takeProfit === null
          ? null
          : undefined;

    if (stopLossValue instanceof Prisma.Decimal && stopLossValue.lte(0)) {
      throw new BadRequestException('stopLoss must be greater than zero');
    }

    if (takeProfitValue instanceof Prisma.Decimal && takeProfitValue.lte(0)) {
      throw new BadRequestException('takeProfit must be greater than zero');
    }

    const nextStopLoss =
      stopLossValue !== undefined ? stopLossValue : position.stopLoss;
    const nextTakeProfit =
      takeProfitValue !== undefined ? takeProfitValue : position.takeProfit;

    if (
      nextStopLoss instanceof Prisma.Decimal &&
      nextTakeProfit instanceof Prisma.Decimal &&
      nextStopLoss.gte(nextTakeProfit)
    ) {
      throw new BadRequestException(
        'stopLoss must be lower than takeProfit',
      );
    }

    const updated = await this.prisma.position.update({
      where: { id: position.id },
      data: {
        ...(stopLossValue !== undefined ? { stopLoss: stopLossValue } : {}),
        ...(takeProfitValue !== undefined
          ? { takeProfit: takeProfitValue }
          : {}),
      },
    });

    return {
      message: 'Position risk levels updated',
      position: this.serializePosition(updated),
    };
  }

  private serializePosition(position: {
    id: string;
    accountId: string;
    symbol: string;
    quantity: Prisma.Decimal;
    averageEntryPrice: Prisma.Decimal;
    stopLoss: Prisma.Decimal | null;
    takeProfit: Prisma.Decimal | null;
    status: PositionStatus;
    openedAt: Date;
    closedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      ...position,
      quantity: position.quantity.toString(),
      averageEntryPrice: position.averageEntryPrice.toString(),
      stopLoss: position.stopLoss?.toString() ?? null,
      takeProfit: position.takeProfit?.toString() ?? null,
    };
  }
}