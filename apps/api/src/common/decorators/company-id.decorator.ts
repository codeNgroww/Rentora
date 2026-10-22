import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CompanyId = createParamDecorator(
  (defaultFallback: string = 'c1111111-1111-4111-8111-111111111111', ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    const headers = request.headers;
    const user = request.user;

    return (
      user?.companyId ||
      (headers['x-company-id'] as string) ||
      (headers['x-workspace-id'] as string) ||
      defaultFallback
    );
  }
);
