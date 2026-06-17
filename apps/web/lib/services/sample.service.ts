import { orpcClient } from '@/lib/orpc';

export async function uploadImage(image: string, extension: string = 'jpg') {
  const result = await orpcClient.sample.uploadImage({
    image,
    extension,
  });

  return result;
}

export async function sendMessage(message: string) {
  const result = await orpcClient.sample.sendMessage({
    message,
  });

  return result;
}

export async function clearQueue() {
  const result = await orpcClient.sample.clearQueue();

  return result;
}
