import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtMetaMaskStrategy extends PassportStrategy(Strategy, 'jwt_meta') {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET'),
      signOptions: { expiresIn: '10s' }
    });
  }

  async validate(payload: any) {
    return { id: payload.sub };
  }
}
