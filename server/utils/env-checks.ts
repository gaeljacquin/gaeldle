import { applyDecorators, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '~/src/auth/jwt-auth.guard';

function isDevMode() {
  return (
    process.env.NODE_ENV === 'dev' || process.env.NODE_ENV === 'development'
  );
}

export function jwtAuthGuard() {
  return applyDecorators(...(isDevMode() ? [] : [UseGuards(JwtAuthGuard)]));
}
