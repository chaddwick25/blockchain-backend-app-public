import { CanActivate, ExecutionContext } from '@nestjs/common';

export class AuthGuard implements CanActivate {
  // the guard normalizes the request (grpc, http, )
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();

    return request.session.id;
  }
}
