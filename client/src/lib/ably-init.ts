import Ably from "ably";
import { myhostname } from "./utils";

export default function ablyInit(channelName: string) {
  const hostname = myhostname();
  const ably = new Ably.Realtime({
    authUrl: `${hostname}/api/ably`,
    authMethod: "GET",
  });
  const channel = ably.channels.get(channelName);

  return channel;
}
