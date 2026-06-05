import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  Post,
} from '@nestjs/common';
import { HexclaveService } from '@/auth/hexclave.service';

type HexclaveSignInBody = {
  email?: string;
  password?: string;
};

@Controller('api/auth')
export class HexclaveAuthController {
  constructor(private readonly stackAuthService: HexclaveService) {}

  @Post('hexclave')
  @HttpCode(200)
  async signInWithPassword(@Body() body: HexclaveSignInBody) {
    const email = body?.email?.trim();
    const password = body?.password;

    if (!email || !password) {
      throw new BadRequestException({
        success: false,
        error: 'email and password are required',
      });
    }

    const result = await this.stackAuthService.signInWithPassword(
      email,
      password,
    );

    return {
      success: true,
      data: {
        ...result,
        tokenType: 'Bearer',
        headerName: 'x-hexclave-access-token',
      },
    };
  }
}
