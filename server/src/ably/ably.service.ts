import { Injectable } from '@nestjs/common';
import * as Ably from 'ably';

@Injectable()
export class AblyService {
  private ably: Ably.Realtime;

  constructor() {
    this.ably = new Ably.Realtime({ key: `${process.env.ABLY_API_KEY}` });
  }

  async generateToken(): Promise<unknown> {
    const tokenRequest = await this.ably.auth.createTokenRequest({
      clientId: '*',
    });
    const generatedToken = await this.ably.auth.requestToken(tokenRequest);
    console.log('there');

    return generatedToken;
  }
}
