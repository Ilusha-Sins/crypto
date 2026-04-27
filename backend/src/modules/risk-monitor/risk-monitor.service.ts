import { Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { PositionStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { MarketService } from '../market/market.service';
import { OrdersService } from '../orders/orders.service';

type RiskTrigger = 'STOP_LOSS' | 'TAKE_PROFIT';

@Injectable()
export class RiskMonitorService {
  private readonly logger = new Logger(RiskMonitorService.name);
  private isRunning = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly marketService: MarketService,
    private readonly ordersService: OrdersService,
  ) {}

  @Interval(15000)
  async checkRiskLevels() {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;

    try {
      const positions = await this.prisma.position.findMany({
        where: {
          status: PositionStatus.OPEN,
          OR: [{ stopLoss: { not: null } }, { takeProfit: { not: null } }],
        },
        orderBy: { createdAt: 'asc' },
      });

      for (const position of positions) {
        try {
          const market = await this.marketService.getCurrentPrice(position.symbol);
          const currentPrice = new Prisma.Decimal(market.price);

          const trigger = this.resolveTrigger(position, currentPrice);

          if (!trigger) {
            continue;
          }

          const result = await this.ordersService.executeRiskTriggeredSell(
            position.id,
            trigger,
            currentPrice.toString(),
          );

          if (result) {
            this.logger.log(
              `${trigger} executed for ${position.symbol}, positionId=${position.id}, price=${currentPrice.toString()}`,
            );
          }
        } catch (error) {
          const message =
            error instanceof Error ? error.message : 'Unknown risk monitor error';

          this.logger.warn(
            `Risk check failed for positionId=${position.id}: ${message}`,
          );
        }
      }
    } finally {
      this.isRunning = false;
    }
  }

  private resolveTrigger(
    position: {
      stopLoss: Prisma.Decimal | null;
      takeProfit: Prisma.Decimal | null;
    },
    currentPrice: Prisma.Decimal,
  ): RiskTrigger | null {
    if (position.stopLoss && currentPrice.lte(position.stopLoss)) {
      return 'STOP_LOSS';
    }

    if (position.takeProfit && currentPrice.gte(position.takeProfit)) {
      return 'TAKE_PROFIT';
    }

    return null;
  }
}