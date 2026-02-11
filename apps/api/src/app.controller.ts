import { Controller, Get } from '@nestjs/common';
import { AppService } from '@/app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  /*
   * # GET /
   * curl -i http://localhost:8080/
   */
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  /*
   * # GET /health
   * curl -i http://localhost:8080/health
   */
  @Get('health')
  getHealth() {
    return this.appService.getHealth();
  }
}
