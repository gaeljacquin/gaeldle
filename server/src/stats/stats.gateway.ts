import { Injectable, OnModuleInit } from '@nestjs/common';

import { AblyService } from '~/src/ably/ably.service';
import { DailyStatsService } from '~/src/daily-stats/daily-stats.service';
import { UnlimitedStatsService } from '~/src/unlimited-stats/unlimited-stats.service';

@Injectable()
export class StatsGateway implements OnModuleInit {
  constructor(
    private readonly dailyStatsService: DailyStatsService,
    private readonly unlimitedStatsService: UnlimitedStatsService,
    private readonly ablyService: AblyService,
  ) {}

  onModuleInit() {
    this.subscribeDailyStats();
    this.subscribeUnlimitedStats();
  }

  private subscribeDailyStats() {
    const channel = this.ablyService.ably.channels.get('dailyStats');
    channel.subscribe(async (message) => {
      console.info('Received daily stats:', message);
      const data = message.data;
      await this.dailyStatsService.create(data);
    });
  }

  private subscribeUnlimitedStats() {
    const channel = this.ablyService.ably.channels.get('unlimitedStats');
    channel.subscribe(async (message) => {
      console.info('Received unlimited stats:', message);
      const data = message.data;
      await this.unlimitedStatsService.create(data);
    });
  }
}
