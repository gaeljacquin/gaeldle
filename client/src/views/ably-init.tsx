'use client';

import * as Ably from 'ably';
import { AblyProvider, ChannelProvider } from 'ably/react';
import { ReactNode } from 'react';
import { myhostname } from "@/lib/utils";

interface AblyInitProps {
  children: ReactNode;
  channelName: string;
}

export default function AblyInit({ children, channelName }: AblyInitProps) {
  const hostname = myhostname();
  const client = new Ably.Realtime({ authUrl: `${hostname}/api/ably`, });

  return (
    <AblyProvider client={client}>
      <ChannelProvider channelName={channelName}>
        {children}
      </ChannelProvider>
    </AblyProvider>
  );
}
