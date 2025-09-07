// src/auth/strategies/jwt.strategy.ts
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from 'src/modules/users/users.service';
import { User } from 'src/entities/user.entity';

export interface JwtPayload {
  sub: number; // User ID
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: true,
      secretOrKey: process.env.JWT_SECRET, // Make sure this is in your .env
    });
  }

  async validate(payload: JwtPayload): Promise<User> {
    
    const { sub: userId } = payload;
    
    // Fetch fresh user data from database
    const user = await this.usersService.findOne(userId.toString());
    
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Comment out this check for now during debugging
    // if (!user.isActive) {
    //   throw new UnauthorizedException('User account is deactivated');
    // }

    // This user object gets attached to request.user
    return user;
  }
}