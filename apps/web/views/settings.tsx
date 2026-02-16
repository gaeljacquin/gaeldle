'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { Label } from "@/components/ui/label";
import { appInfo } from "@/lib/app-info";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useMutation } from "@tanstack/react-query";
import { testUpload } from "@/lib/services/game.service";
import { toast } from "sonner";
import { useState } from "react";
import { IconUpload, IconLoader2 } from "@tabler/icons-react";

export default function Settings() {
  const [isUploading, setIsUploading] = useState(false);

  const uploadMutation = useMutation({
    mutationFn: ({ image, extension }: { image: string; extension: string }) =>
      testUpload(image, extension),
    onSuccess: () => {
      toast.success("Test image uploaded to R2 bucket successfully!");
      setIsUploading(false);
    },
    onError: (error) => {
      console.error("Upload failed:", error);
      toast.error("Failed to upload test image to R2 bucket");
      setIsUploading(false);
    },
  });

  const handleTestUpload = async () => {
    try {
      setIsUploading(true);

      // Fetch the local placeholder image
      const response = await fetch('/placeholder.jpg');
      const blob = await response.blob();

      // Convert to base64
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        const base64data = reader.result as string;

        await uploadMutation.mutateAsync({
          image: base64data,
          extension: 'jpg',
        });
      };
    } catch (error) {
      console.error("Preparation failed:", error);
      toast.error("Failed to prepare image for upload");
      setIsUploading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="mb-8 text-3xl font-bold">Settings</h1>

      <div className="grid gap-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>
              Customize how {appInfo.title} looks on your device.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Theme</Label>
                <p className="text-sm text-muted-foreground">
                  Switch between light and dark mode.
                </p>
              </div>
              <ThemeToggle />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cloudflare R2 Test</CardTitle>
            <CardDescription>
              Test image upload to your Cloudflare R2 bucket.
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
                />
              </div>
              <div className="text-center space-y-2">
                <p className="text-xs font-mono text-muted-foreground">public/placeholder.jpg</p>
                <Button
                  onClick={handleTestUpload}
                  disabled={isUploading}
                  className="font-bold cursor-pointer"
                >
                  {isUploading ? (
                    <IconLoader2 className="mr-2 size-4 animate-spin" />
                  ) : (
                    <IconUpload className="mr-2 size-4" />
                  )}
                  {isUploading ? "Uploading..." : "Upload to R2"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
