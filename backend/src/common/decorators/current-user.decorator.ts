import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export type CurrentUserType = {
  sub: string;
  email: string;
};

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): CurrentUserType => {
    const request = ctx.switchToHttp().getRequest();
    return request.user as CurrentUserType;
  },
);