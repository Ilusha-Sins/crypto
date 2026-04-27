import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  CurrentUser,
  CurrentUserType,
} from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { GetHistoryQueryDto } from './dto/get-history-query.dto';
import { HistoryService } from './history.service';

@Controller('history')
@UseGuards(JwtAuthGuard)
export class HistoryController {
  constructor(private readonly historyService: HistoryService) {}

  @Get('orders')
  getOrdersHistory(
    @CurrentUser() user: CurrentUserType,
    @Query() query: GetHistoryQueryDto,
  ) {
    return this.historyService.getOrdersHistory(user.sub, query);
  }

  @Get('trades')
  getTradesHistory(
    @CurrentUser() user: CurrentUserType,
    @Query() query: GetHistoryQueryDto,
  ) {
    return this.historyService.getTradesHistory(user.sub, query);
  }

  @Get('summary')
  getTradingSummary(@CurrentUser() user: CurrentUserType) {
    return this.historyService.getTradingSummary(user.sub);
  }
}