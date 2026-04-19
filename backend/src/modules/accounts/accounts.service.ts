import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AccountsService {
  constructor(private readonly prisma: PrismaService) {}

  async getMyAccount(userId: string) {
    const account = await this.prisma.demoAccount.findUnique({
      where: { userId },
      include: {
        positions: {
          where: { status: 'OPEN' },
          orderBy: { createdAt: 'desc' },
        },
        orders: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        trades: {
          orderBy: { executedAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!account) {
      throw new NotFoundException('Demo account not found');
    }

    return {
      id: account.id,
      initialBalance: account.initialBalance.toString(),
      cashBalance: account.cashBalance.toString(),
      resetCount: account.resetCount,
      lastResetAt: account.lastResetAt,
      positions: account.positions.map((position) => ({
        ...position,
        quantity: position.quantity.toString(),
        averageEntryPrice: position.averageEntryPrice.toString(),
        stopLoss: position.stopLoss?.toString() ?? null,
        takeProfit: position.takeProfit?.toString() ?? null,
      })),
      orders: account.orders.map((order) => ({
        ...order,
        quantity: order.quantity.toString(),
        executionPrice: order.executionPrice?.toString() ?? null,
      })),
      trades: account.trades.map((trade) => ({
        ...trade,
        quantity: trade.quantity.toString(),
        price: trade.price.toString(),
        realizedPnl: trade.realizedPnl?.toString() ?? null,
      })),
    };
  }

  async resetMyAccount(userId: string) {
    const initialBalance = new Prisma.Decimal(
      process.env.DEMO_INITIAL_BALANCE ?? '10000',
    );

    const account = await this.prisma.demoAccount.findUnique({
      where: { userId },
    });

    if (!account) {
      throw new NotFoundException('Demo account not found');
    }

    await this.prisma.$transaction([
      this.prisma.trade.deleteMany({
        where: { accountId: account.id },
      }),
      this.prisma.order.deleteMany({
        where: { accountId: account.id },
      }),
      this.prisma.position.deleteMany({
        where: { accountId: account.id },
      }),
      this.prisma.demoAccount.update({
        where: { id: account.id },
        data: {
          initialBalance,
          cashBalance: initialBalance,
          resetCount: {
            increment: 1,
          },
          lastResetAt: new Date(),
        },
      }),
    ]);

    return this.getMyAccount(userId);
  }
}