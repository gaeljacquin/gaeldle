import { Injectable, OnModuleInit } from '@nestjs/common';
import * as Ably from 'ably';

import { DailyStatsService } from '~/src/daily-stats/daily-stats.service';
import { UnlimitedStatsService } from '~/src/unlimited-stats/unlimited-stats.service';

@Injectable()
export class StatsGateway implements OnModuleInit {
  private ably: Ably.Realtime;

  constructor(
    private readonly dailyStatsService: DailyStatsService,
    private readonly unlimitedStatsService: UnlimitedStatsService,
  ) {
    this.ably = new Ably.Realtime(`${process.env.ABLY_API_KEY}`);
  }

  onModuleInit() {
    this.subscribeDailyStats();
    this.subscribeUnlimitedStats();
  }

  private subscribeDailyStats() {
    const channel = this.ably.channels.get('dailyStats');
    channel.subscribe(async (message) => {
      console.info('Received daily stats:', message);
      const data = message.data;
      await this.dailyStatsService.create(data);
    });
  }

  private subscribeUnlimitedStats() {
    const channel = this.ably.channels.get('unlimitedStats');
    channel.subscribe(async (message) => {
      console.info('Received unlimited stats:', message);
      const data = message.data;
      await this.unlimitedStatsService.create(data);
    });
  }
}
