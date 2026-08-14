import { apiClient } from '@/lib/api-client';

export async function uploadImage(image: string, extension: string = 'jpg') {
  const { data, error } = await apiClient.POST('/api/sample/upload-image', {
    body: { image, extension },
  });

  if (error || !data) {
    throw new Error('Failed to upload sample image');
  }

  return data;
}

export async function sendMessage(message: string) {
  const { data, error } = await apiClient.POST('/api/sample/send-message', {
    body: { message },
  });

  if (error || !data) {
    throw new Error('Failed to send sample message');
  }

  return data;
}

export async function clearQueue() {
  const { data, error } = await apiClient.POST('/api/sample/clear-queue');

  if (error || !data) {
    throw new Error('Failed to clear queue');
  }

  return data;
}
