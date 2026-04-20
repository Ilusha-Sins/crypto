import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  OrderSide,
  OrderStatus,
  OrderType,
  PositionStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { MarketService } from '../market/market.service';
import { PlaceMarketOrderDto } from './dto/place-market-order.dto';

type RiskTrigger = 'STOP_LOSS' | 'TAKE_PROFIT';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly marketService: MarketService,
  ) {}

  async placeMarketOrder(userId: string, dto: PlaceMarketOrderDto) {
    const symbol = dto.symbol.toUpperCase();
    const quantity = new Prisma.Decimal(dto.quantity);

    if (quantity.lte(0)) {
      throw new BadRequestException('Quantity must be greater than zero');
    }

    if (
      dto.side === OrderSide.SELL &&
      (dto.stopLoss !== undefined || dto.takeProfit !== undefined)
    ) {
      throw new BadRequestException(
        'stopLoss and takeProfit can only be set on BUY for now',
      );
    }

    const account = await this.prisma.demoAccount.findUnique({
      where: { userId },
    });

    if (!account) {
      throw new NotFoundException('Demo account not found');
    }

    const market = await this.marketService.getCurrentPrice(symbol);
    const executionPrice = new Prisma.Decimal(market.price);

    return this.prisma.$transaction(async (tx) => {
      const freshAccount = await tx.demoAccount.findUnique({
        where: { id: account.id },
      });

      if (!freshAccount) {
        throw new NotFoundException('Demo account not found');
      }

      if (dto.side === OrderSide.BUY) {
        return this.handleBuy(tx, {
          accountId: freshAccount.id,
          symbol,
          quantity,
          executionPrice,
          cashBalance: freshAccount.cashBalance,
          stopLoss: dto.stopLoss,
          takeProfit: dto.takeProfit,
        });
      }

      const position = await tx.position.findFirst({
        where: {
          accountId: freshAccount.id,
          symbol,
          status: PositionStatus.OPEN,
        },
      });

      if (!position) {
        throw new BadRequestException(
          `No open position found for ${symbol}`,
        );
      }

      return this.executeSellAgainstPosition(tx, {
        accountId: freshAccount.id,
        cashBalance: freshAccount.cashBalance,
        position,
        quantity,
        executionPrice,
      });
    });
  }

  async executeRiskTriggeredSell(
    positionId: string,
    trigger: RiskTrigger,
    executionPriceOverride?: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const position = await tx.position.findUnique({
        where: { id: positionId },
      });

      if (!position || position.status !== PositionStatus.OPEN) {
        return null;
      }

      const account = await tx.demoAccount.findUnique({
        where: { id: position.accountId },
      });

      if (!account) {
        throw new NotFoundException('Demo account not found');
      }

      const executionPrice = executionPriceOverride
        ? new Prisma.Decimal(executionPriceOverride)
        : new Prisma.Decimal(
            (await this.marketService.getCurrentPrice(position.symbol)).price,
          );

      return this.executeSellAgainstPosition(tx, {
        accountId: account.id,
        cashBalance: account.cashBalance,
        position,
        quantity: position.quantity,
        executionPrice,
        reason: trigger,
      });
    });
  }

  private async handleBuy(
    tx: Prisma.TransactionClient,
    params: {
      accountId: string;
      symbol: string;
      quantity: Prisma.Decimal;
      executionPrice: Prisma.Decimal;
      cashBalance: Prisma.Decimal;
      stopLoss?: string;
      takeProfit?: string;
    },
  ) {
    const totalCost = params.executionPrice.mul(params.quantity);

    if (params.cashBalance.lt(totalCost)) {
      throw new BadRequestException('Insufficient demo balance');
    }

    const existingPosition = await tx.position.findFirst({
      where: {
        accountId: params.accountId,
        symbol: params.symbol,
        status: PositionStatus.OPEN,
      },
    });

    const order = await tx.order.create({
      data: {
        accountId: params.accountId,
        symbol: params.symbol,
        side: OrderSide.BUY,
        type: OrderType.MARKET,
        quantity: params.quantity,
        executionPrice: params.executionPrice,
        status: OrderStatus.FILLED,
      },
    });

    let position;

    if (existingPosition) {
      const newQuantity = existingPosition.quantity.add(params.quantity);
      const weightedTotal = existingPosition.averageEntryPrice
        .mul(existingPosition.quantity)
        .add(params.executionPrice.mul(params.quantity));

      const newAverageEntryPrice = weightedTotal.div(newQuantity);

      position = await tx.position.update({
        where: { id: existingPosition.id },
        data: {
          quantity: newQuantity,
          averageEntryPrice: newAverageEntryPrice,
          stopLoss:
            params.stopLoss !== undefined
              ? new Prisma.Decimal(params.stopLoss)
              : existingPosition.stopLoss,
          takeProfit:
            params.takeProfit !== undefined
              ? new Prisma.Decimal(params.takeProfit)
              : existingPosition.takeProfit,
        },
      });
    } else {
      position = await tx.position.create({
        data: {
          accountId: params.accountId,
          symbol: params.symbol,
          quantity: params.quantity,
          averageEntryPrice: params.executionPrice,
          stopLoss:
            params.stopLoss !== undefined
              ? new Prisma.Decimal(params.stopLoss)
              : null,
          takeProfit:
            params.takeProfit !== undefined
              ? new Prisma.Decimal(params.takeProfit)
              : null,
          status: PositionStatus.OPEN,
        },
      });
    }

    const trade = await tx.trade.create({
      data: {
        accountId: params.accountId,
        orderId: order.id,
        positionId: position.id,
        symbol: params.symbol,
        side: OrderSide.BUY,
        quantity: params.quantity,
        price: params.executionPrice,
      },
    });

    const updatedAccount = await tx.demoAccount.update({
      where: { id: params.accountId },
      data: {
        cashBalance: params.cashBalance.sub(totalCost),
      },
    });

    return {
      message: 'Market BUY order executed',
      order: this.serializeOrder(order),
      trade: this.serializeTrade(trade),
      position: this.serializePosition(position),
      account: {
        id: updatedAccount.id,
        cashBalance: updatedAccount.cashBalance.toString(),
      },
    };
  }

  private async executeSellAgainstPosition(
    tx: Prisma.TransactionClient,
    params: {
      accountId: string;
      cashBalance: Prisma.Decimal;
      position: {
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
      };
      quantity: Prisma.Decimal;
      executionPrice: Prisma.Decimal;
      reason?: RiskTrigger;
    },
  ) {
    if (params.position.quantity.lt(params.quantity)) {
      throw new BadRequestException('Not enough asset quantity to sell');
    }

    const order = await tx.order.create({
      data: {
        accountId: params.accountId,
        symbol: params.position.symbol,
        side: OrderSide.SELL,
        type: OrderType.MARKET,
        quantity: params.quantity,
        executionPrice: params.executionPrice,
        status: OrderStatus.FILLED,
      },
    });

    const realizedPnl = params.executionPrice
      .sub(params.position.averageEntryPrice)
      .mul(params.quantity);

    const remainingQuantity = params.position.quantity.sub(params.quantity);

    const updatedPosition =
      remainingQuantity.eq(0) || remainingQuantity.lte(0)
        ? await tx.position.update({
            where: { id: params.position.id },
            data: {
              quantity: new Prisma.Decimal(0),
              status: PositionStatus.CLOSED,
              closedAt: new Date(),
            },
          })
        : await tx.position.update({
            where: { id: params.position.id },
            data: {
              quantity: remainingQuantity,
            },
          });

    const trade = await tx.trade.create({
      data: {
        accountId: params.accountId,
        orderId: order.id,
        positionId: params.position.id,
        symbol: params.position.symbol,
        side: OrderSide.SELL,
        quantity: params.quantity,
        price: params.executionPrice,
        realizedPnl,
      },
    });

    const proceeds = params.executionPrice.mul(params.quantity);

    const updatedAccount = await tx.demoAccount.update({
      where: { id: params.accountId },
      data: {
        cashBalance: params.cashBalance.add(proceeds),
      },
    });

    return {
      message: params.reason
        ? `Position closed by ${params.reason}`
        : 'Market SELL order executed',
      trigger: params.reason ?? null,
      order: this.serializeOrder(order),
      trade: this.serializeTrade(trade),
      position: this.serializePosition(updatedPosition),
      account: {
        id: updatedAccount.id,
        cashBalance: updatedAccount.cashBalance.toString(),
      },
    };
  }

  private serializeOrder(order: {
    id: string;
    accountId: string;
    symbol: string;
    side: OrderSide;
    type: OrderType;
    quantity: Prisma.Decimal;
    executionPrice: Prisma.Decimal | null;
    status: OrderStatus;
    rejectionReason: string | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      ...order,
      quantity: order.quantity.toString(),
      executionPrice: order.executionPrice?.toString() ?? null,
    };
  }

  private serializeTrade(trade: {
    id: string;
    accountId: string;
    orderId: string;
    positionId: string | null;
    symbol: string;
    side: OrderSide;
    quantity: Prisma.Decimal;
    price: Prisma.Decimal;
    executedAt: Date;
    realizedPnl: Prisma.Decimal | null;
  }) {
    return {
      ...trade,
      quantity: trade.quantity.toString(),
      price: trade.price.toString(),
      realizedPnl: trade.realizedPnl?.toString() ?? null,
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