import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentAvaxUser = createParamDecorator(
  //ExecutionContext normalizes the request type http, websocket, rpc
  (data: never, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest();    
    return request.user
  },
);
