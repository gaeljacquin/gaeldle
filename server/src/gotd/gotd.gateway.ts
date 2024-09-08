import { Injectable, OnModuleInit } from '@nestjs/common';
import { AblyService } from '~/src/ably/ably.service';
import keyNameByEnv from '~/utils/key-name-env';
import { GotdService } from '~/src/gotd/gotd.service';

@Injectable()
export class GotdGateway implements OnModuleInit {
  private rounds: Map<string, unknown>;

  constructor(
    private readonly ablyService: AblyService,
    private readonly gotdService: GotdService,
  ) {
    this.rounds = new Map();
  }

  onModuleInit() {
    this.subscribeGotdClassic();
    this.subscribeGotdClassicUnlimited();
  }

  private async subscribeGotdClassic() {
    const channelName = keyNameByEnv('gotdClassic');
    const channel = this.ablyService.ably.channels.get(channelName);
    const gotd = await this.gotdService.findIt(1);
    const igdbId = (gotd as { igdbId: number }).igdbId;

    channel.subscribe(async (message) => {
      const data = message.data;
      const connectionId = message.connectionId;
      // console.log(data.game);
      // console.log('there2');
      const correct = parseInt(data.game.igdbId, 10) === igdbId;
      this.rounds.set(connectionId, correct);
      const answer = this.rounds.get(connectionId);
      const resChannel = this.ablyService.ably.channels.get(connectionId);
      const res = { message: { answer: answer } };

      // console.log(res);
      // console.log(channel);
      // console.log(resChannel);

      resChannel.publish('return-event', res);
      // channel.publish('return-event', res);
    });
  }

  private subscribeGotdClassicUnlimited() {
    // const channelName = keyNameByEnv('gnumber');
    const channelName = 'gnumber';
    const channel = this.ablyService.ably.channels.get(channelName);

    channel.subscribe((message) => {
      const data = message.data;
      const connectionId = message.connectionId;
      const guess = data.gnumber;
      console.log(this.rounds);
      console.log(data);

      if (!this.rounds.has(connectionId)) {
        const answer = Math.floor(Math.random() * 100) + 1;
        this.rounds.set(connectionId, answer);
      }

      const answer = this.rounds.get(connectionId);
      const gameOver = answer === guess;
      console.info('Received data:', data);
      console.dir(answer);
      console.dir(guess);
      console.log('uwu: ', gameOver);

      // // Send response back to the client
      // const responseChannel = this.ablyService.ably.channels.get(connectionId);
      // const response = {
      //   message:
      //     answer === guess
      //       ? 'Congratulations! You guessed the number!'
      //       : guess < answer
      //         ? 'Too low!'
      //         : 'Too high!',
      //   gameOver: answer === guess,
      // };

      // if (response.gameOver) {
      //   this.rounds.delete(connectionId);
      // }

      // channel.publish('guess-response', response);
    });
  }
}
