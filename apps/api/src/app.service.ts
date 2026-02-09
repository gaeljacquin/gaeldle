import { Injectable } from '@nestjs/common';

type HealthStatus = {
  status: 'ok';
  timestamp: string;
};

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }

  getHealth(): HealthStatus {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
