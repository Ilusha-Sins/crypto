import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  CurrentUser,
  CurrentUserType,
} from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AnalysisService } from './analysis.service';
import { GetAnalysisHistoryDto } from './dto/get-analysis-history.dto';
import { RunAnalysisDto } from './dto/run-analysis.dto';

@Controller('analysis')
@UseGuards(JwtAuthGuard)
export class AnalysisController {
  constructor(private readonly analysisService: AnalysisService) {}

  @Post('run')
  runAnalysis(
    @CurrentUser() user: CurrentUserType,
    @Body() dto: RunAnalysisDto,
  ) {
    return this.analysisService.runAnalysis(user.sub, dto);
  }

  @Get('history')
  getHistory(
    @CurrentUser() user: CurrentUserType,
    @Query() query: GetAnalysisHistoryDto,
  ) {
    return this.analysisService.getAnalysisHistory(user.sub, query);
  }

  @Get('history/:analysisId')
  getById(
    @CurrentUser() user: CurrentUserType,
    @Param('analysisId') analysisId: string,
  ) {
    return this.analysisService.getAnalysisById(user.sub, analysisId);
  }
}