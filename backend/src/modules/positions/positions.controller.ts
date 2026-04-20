import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import {
  CurrentUser,
  CurrentUserType,
} from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { UpdatePositionRiskDto } from './dto/update-position-risk.dto';
import { PositionsService } from './positions.service';

@Controller('positions')
@UseGuards(JwtAuthGuard)
export class PositionsController {
  constructor(private readonly positionsService: PositionsService) {}

  @Get('open')
  getOpenPositions(@CurrentUser() user: CurrentUserType) {
    return this.positionsService.getOpenPositions(user.sub);
  }

  @Get('closed')
  getClosedPositions(@CurrentUser() user: CurrentUserType) {
    return this.positionsService.getClosedPositions(user.sub);
  }

  @Get(':positionId')
  getPositionById(
    @CurrentUser() user: CurrentUserType,
    @Param('positionId') positionId: string,
  ) {
    return this.positionsService.getPositionById(user.sub, positionId);
  }

  @Patch(':positionId/risk')
  updateRiskLevels(
    @CurrentUser() user: CurrentUserType,
    @Param('positionId') positionId: string,
    @Body() dto: UpdatePositionRiskDto,
  ) {
    return this.positionsService.updateRiskLevels(user.sub, positionId, dto);
  }
}