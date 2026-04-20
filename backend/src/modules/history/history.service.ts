import { Injectable, NotFoundException } from '@nestjs/common';
import { OrderSide, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { GetHistoryQueryDto } from './dto/get-history-query.dto';

@Injectable()
export class HistoryService {
  constructor(private readonly prisma: PrismaService) {}

  async getOrdersHistory(userId: string, query: GetHistoryQueryDto) {
    const account = await this.prisma.demoAccount.findUnique({
      where: { userId },
    });

    if (!account) {
      throw new NotFoundException('Demo account not found');
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.OrderWhereInput = {
      accountId: account.id,
      ...(query.symbol ? { symbol: query.symbol.toUpperCase() } : {}),
      ...(query.side ? { side: query.side } : {}),
      ...(query.status ? { status: query.status } : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      items: items.map((order) => ({
        ...order,
        quantity: order.quantity.toString(),
        executionPrice: order.executionPrice?.toString() ?? null,
      })),
    };
  }

  async getTradesHistory(userId: string, query: GetHistoryQueryDto) {
    const account = await this.prisma.demoAccount.findUnique({
      where: { userId },
    });

    if (!account) {
      throw new NotFoundException('Demo account not found');
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.TradeWhereInput = {
      accountId: account.id,
      ...(query.symbol ? { symbol: query.symbol.toUpperCase() } : {}),
      ...(query.side ? { side: query.side } : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.trade.findMany({
        where,
        orderBy: { executedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.trade.count({ where }),
    ]);

    return {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      items: items.map((trade) => ({
        ...trade,
        quantity: trade.quantity.toString(),
        price: trade.price.toString(),
        realizedPnl: trade.realizedPnl?.toString() ?? null,
      })),
    };
  }

  async getTradingSummary(userId: string) {
    const account = await this.prisma.demoAccount.findUnique({
      where: { userId },
    });

    if (!account) {
      throw new NotFoundException('Demo account not found');
    }

    const trades = await this.prisma.trade.findMany({
      where: { accountId: account.id },
      orderBy: { executedAt: 'desc' },
    });

    const sellTrades = trades.filter((trade) => trade.side === OrderSide.SELL);
    const closedTrades = sellTrades.filter((trade) => trade.realizedPnl !== null);

    const totalRealizedPnl = closedTrades.reduce(
      (acc, trade) => acc.add(trade.realizedPnl ?? new Prisma.Decimal(0)),
      new Prisma.Decimal(0),
    );

    const winningTrades = closedTrades.filter((trade) =>
      (trade.realizedPnl ?? new Prisma.Decimal(0)).gt(0),
    );

    const losingTrades = closedTrades.filter((trade) =>
      (trade.realizedPnl ?? new Prisma.Decimal(0)).lt(0),
    );

    const winRate =
      closedTrades.length === 0
        ? new Prisma.Decimal(0)
        : new Prisma.Decimal(winningTrades.length)
            .div(closedTrades.length)
            .mul(100);

    const averageWin =
      winningTrades.length === 0
        ? new Prisma.Decimal(0)
        : winningTrades
            .reduce(
              (acc, trade) => acc.add(trade.realizedPnl ?? new Prisma.Decimal(0)),
              new Prisma.Decimal(0),
            )
            .div(winningTrades.length);

    const averageLoss =
      losingTrades.length === 0
        ? new Prisma.Decimal(0)
        : losingTrades
            .reduce(
              (acc, trade) => acc.add(trade.realizedPnl ?? new Prisma.Decimal(0)),
              new Prisma.Decimal(0),
            )
            .div(losingTrades.length);

    return {
      totalTrades: trades.length,
      totalBuyTrades: trades.filter((trade) => trade.side === OrderSide.BUY).length,
      totalSellTrades: sellTrades.length,
      closedTrades: closedTrades.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      totalRealizedPnl: totalRealizedPnl.toString(),
      winRate: winRate.toString(),
      averageWin: averageWin.toString(),
      averageLoss: averageLoss.toString(),
    };
  }
}