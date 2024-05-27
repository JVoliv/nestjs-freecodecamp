import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthDto } from './dto';
import * as argon from 'argon2';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwt: JwtService,
        private config: ConfigService,
    ) {}

    async signup(dto: AuthDto) {
        // genarete the hash password
        const hash = await argon.hash(dto.password);
        try {
            // save the new user in the db
            const user = await this.prisma.user.create({
                data: {
                    email: dto.email,
                    hash,
                },
            });
        } catch (error) {
            if (error instanceof PrismaClientKnownRequestError) {
                if (error.code === 'P2002') {
                    throw new ForbiddenException('Credentials taken.');
                }
            }
            throw error;
        }
    }

    async signin(dto: AuthDto) {
        // find the user by email
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });

        // if user does not exist throw exception
        if (!user) throw new ForbiddenException('Credentials incorrect!');

        // compare password
        const pwMatches = await argon.verify(user.hash, dto.password);

        // if password incorrect throw exception
        if (!pwMatches) throw new ForbiddenException('Credentials incorrect!');

        // return the user
        return this.siginToken(user.id, user.email);
    }

    async siginToken(
        userId: number,
        email: string,
    ): Promise<{ access_token: string }> {
        // ao inves de criar o payload dentro da função 'signin', crio a func 'siginToken' pra reaproveitar codigo
        const payload = {
            sub: userId,
            email,
        };

        const secret = this.config.get('JWT_SECRET');

        const token = await this.jwt.signAsync(payload, {
            expiresIn: '15m',
            secret: secret,
        });

        return {
            access_token: token,
        };
    }
}
