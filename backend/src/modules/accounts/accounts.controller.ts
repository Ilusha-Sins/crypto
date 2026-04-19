import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { CurrentUser, CurrentUserType } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AccountsService } from './accounts.service';

@Controller('accounts')
@UseGuards(JwtAuthGuard)
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Get('me')
  getMyAccount(@CurrentUser() user: CurrentUserType) {
    return this.accountsService.getMyAccount(user.sub);
  }

  @Post('reset')
  resetMyAccount(@CurrentUser() user: CurrentUserType) {
    return this.accountsService.resetMyAccount(user.sub);
  }
}