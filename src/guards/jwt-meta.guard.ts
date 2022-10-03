import { AuthGuard } from '@nestjs/passport';

export class JwtMetaMaskGuard extends AuthGuard('jwt_meta') {}
