import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JWTStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private readonly config: ConfigService) {
    super({
      // Витягаємо токен з заголовка Authorization: Bearer <token>
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      // Ігнорувати термін дії? Ні.
      ignoreExpiration: false,
      // Секретний ключ з .env
      secretOrKey: config.getOrThrow<string>('JWT_ACCESS_SECRET'),
    });
  }

  // Після перевірки підпису, цей метод додає дані в req.user
  validate(payload: { id: string; email: string; name: string }) {
    console.log('payload', payload);
    return { userId: payload.id, email: payload.email, name: payload.name };
  }
}
