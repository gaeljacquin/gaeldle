import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  Post,
} from '@nestjs/common';
import { StackAuthService } from './stack-auth.service';

type StackSignInBody = {
  email?: string;
  password?: string;
};

@Controller('api/auth')
export class StackAuthController {
  constructor(private readonly stackAuthService: StackAuthService) {}

  @Post('stack')
  @HttpCode(200)
  async signInWithPassword(@Body() body: StackSignInBody) {
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
        headerName: 'x-stack-access-token',
      },
    };
  }
}
