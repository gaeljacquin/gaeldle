import { Injectable } from '@nestjs/common';
import { PrismaService } from '~/src/prisma/prisma.service';

@Injectable()
export class AppService {
  constructor(private readonly prisma: PrismaService) {}

  getHello(): string {
    return 'Hello World!';
  }

  async wakeUp() {
    await this.prisma.$executeRaw`
      SELECT 1;
    `;

    return { message: 'Wakey wakey!' };
  }
}
