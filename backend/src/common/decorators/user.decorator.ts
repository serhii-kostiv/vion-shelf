import { createParamDecorator, ExecutionContext } from '@nestjs/common';

interface RequestWithUser {
  user?: Record<string, unknown>;
}

export const User = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;

    console.log('User decorator - full user:', user);
    console.log('User decorator - requested field:', data);
    console.log('User decorator - returning:', data ? user?.[data] : user);

    return data ? user?.[data] : user;
  },
);
