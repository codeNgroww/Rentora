import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse<Response>();

    const { method, originalUrl, headers } = req;
    const reqId = (headers['x-request-id'] as string) || `req-${Date.now().toString(36)}`;
    const start = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - start;
          const statusCode = res.statusCode;
          this.logger.log(`[${reqId}] ${method} ${originalUrl} ${statusCode} - ${duration}ms`);
        },
        error: (err) => {
          const duration = Date.now() - start;
          const statusCode = err.status || 500;
          this.logger.warn(
            `[${reqId}] ${method} ${originalUrl} ${statusCode} - ${duration}ms - Error: ${err.message}`
          );
        },
      })
    );
  }
}
