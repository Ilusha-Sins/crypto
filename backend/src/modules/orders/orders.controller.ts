import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import {
  CurrentUser,
  CurrentUserType,
} from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PlaceMarketOrderDto } from './place-market-order.dto';
import { OrdersService } from './orders.service';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('market')
  placeMarketOrder(
    @CurrentUser() user: CurrentUserType,
    @Body() dto: PlaceMarketOrderDto,
  ) {
    return this.ordersService.placeMarketOrder(user.sub, dto);
  }
}