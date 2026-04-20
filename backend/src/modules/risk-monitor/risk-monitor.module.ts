import { Module } from '@nestjs/common';
import { MarketModule } from '../market/market.module';
import { OrdersModule } from '../orders/orders.module';
import { RiskMonitorService } from './risk-monitor.service';

@Module({
  imports: [MarketModule, OrdersModule],
  providers: [RiskMonitorService],
})
export class RiskMonitorModule {}