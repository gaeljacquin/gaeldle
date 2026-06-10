'use client';

import { ViewTransition } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@workspace/ui/card';
import { Button } from '@workspace/ui/button';
import Image from 'next/image';
import { useMutation } from '@tanstack/react-query';
import {
  uploadImage as uploadSampleImage,
  sendMessage as sendSampleMessage,
  purgeQueue as purgeSampleQueue,
} from '@/lib/services/sample.service';
import { toast } from 'sonner';
import {
  IconUpload,
  IconLoader2,
  IconSettings,
  IconMail,
  IconQueuePopOut,
} from '@tabler/icons-react';
import { DashboardPageHeader } from '@/components/dashboard-header';

export default function Settings() {
  const uploadSampleImageMutation = useMutation({
    mutationFn: async () => {
      // Fetch and convert the placeholder image to base64
      const response = await fetch('/placeholder.jpg');
      const blob = await response.blob();

      const base64data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
      });

      return uploadSampleImage(base64data, 'jpg');
    },
    onSuccess: () => {
      toast.success('Test image uploaded to R2 bucket successfully!');
    },
    onError: (error) => {
      console.error('Upload failed:', error);
      toast.error('Failed to upload test image to R2 bucket');
    },
  });

  const sendSampleMessageMutation = useMutation({
    mutationFn: async () => {
      const message = 'Shouting into the void!';
      return sendSampleMessage(message);
    },
    onSuccess: (data) => {
      console.log(data);
      const msg = data.message + (data.messageId ? ' - ' + data.messageId : '');
      console.log('message:', msg);
      toast.success(data.message);
      toast.info(data.messageId ?? 'No message id.');
    },
    onError: (error) => {
      console.error('Sending failed:', error);
      toast.error('Failed to send sample message.');
    },
  });

  const purgeSampleQueueMutation = useMutation({
    mutationFn: async () => {
      return purgeSampleQueue();
    },
    onSuccess: (data) => {
      toast.success(data.message);
    },
    onError: (error) => {
      console.error('Clearing queue failed:', error);
      toast.error('Failed to clear sample queue.');
    },
  });

  return (
    <ViewTransition>
      <div className="flex flex-col min-h-full bg-background">
        <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="container mx-auto px-4 py-4">
            <DashboardPageHeader title="Settings" icon={IconSettings} />
          </div>
        </div>

        <div className="container mx-auto px-4 py-8 flex-1 space-y-8">
          <div className="max-w-2xl space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Cloudflare R2 Test</CardTitle>
                <CardDescription>
                  Test uploading an image to your Cloudflare R2 bucket.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col items-center gap-4">
                  <div className="relative size-40 border-2 border-dashed border-muted-foreground/25 flex items-center justify-center bg-muted/50 overflow-hidden">
                    <Image
                      src="/placeholder.jpg"
                      alt="Test Placeholder"
                      fill
                      className="object-cover"
                      loading="eager"
                      sizes="10vw"
                    />
                  </div>
                  <div className="text-center space-y-2">
                    <p className="text-xs font-mono text-muted-foreground">
                      public/placeholder.jpg
                    </p>
                    <Button
                      onClick={() => uploadSampleImageMutation.mutate()}
                      disabled={uploadSampleImageMutation.isPending}
                      className="font-bold cursor-pointer"
                    >
                      {uploadSampleImageMutation.isPending ? (
                        <IconLoader2 className="mr-2 size-4 animate-spin" />
                      ) : (
                        <IconUpload className="mr-2 size-4" />
                      )}
                      {uploadSampleImageMutation.isPending
                        ? 'Uploading...'
                        : 'Upload to R2'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="max-w-2xl space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>AWS SQS Test</CardTitle>
                <CardDescription>
                  Test sending a message to an SQS queue and clearing it.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-row items-center justify-center gap-4">
                  <div className="text-center space-y-2">
                    <Button
                      onClick={() => sendSampleMessageMutation.mutate()}
                      disabled={sendSampleMessageMutation.isPending}
                      className="font-bold cursor-pointer"
                    >
                      {sendSampleMessageMutation.isPending ? (
                        <IconLoader2 className="mr-2 size-4 animate-spin" />
                      ) : (
                        <IconMail className="mr-2 size-4" />
                      )}
                      {sendSampleMessageMutation.isPending
                        ? 'Sending message...'
                        : 'Send message'}
                    </Button>
                  </div>
                  <div className="text-center space-y-2">
                    <Button
                      onClick={() => purgeSampleQueueMutation.mutate()}
                      disabled={purgeSampleQueueMutation.isPending}
                      className="font-bold cursor-pointer bg-fuchsia-600"
                    >
                      {purgeSampleQueueMutation.isPending ? (
                        <IconLoader2 className="mr-2 size-4 animate-spin" />
                      ) : (
                        <IconQueuePopOut className="mr-2 size-4" />
                      )}
                      {purgeSampleQueueMutation.isPending
                        ? 'Clearing queue...'
                        : 'Clear queue'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ViewTransition>
  );
}
