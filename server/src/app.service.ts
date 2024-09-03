import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }

  wakeUp() {
    return { message: 'Wakey wakey!' };
  }
}
