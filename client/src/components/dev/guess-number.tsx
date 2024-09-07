'use client'

import { useEffect, useState } from 'react';
import { useChannel } from 'ably/react';
import { Button } from "@/components/ui/button"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form"
import { Input } from '@/components/ui/input';

const FormSchema = z.object({
  gnumber: z.string().transform((val) => parseInt(val, 10)).refine((val) => val >= 1, { message: "Number must be at least 1" }).refine((val) => val <= 100, { message: "Number must be at most 100" })
});

export default function GuessNumber() {
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
  });
  const channelName = "gnumber";
  const { channel } = useChannel(channelName, (message) => {
    console.info(message)
  });

  function transmitNumber(data: unknown) {
    channel.publish('transmitNumber', data);
  }

  function onSubmit(data: z.infer<typeof FormSchema>) {
    transmitNumber(data);
  }

  useEffect(() => {
    channel.subscribe('returnNumber', (message) => {
      console.info('Received data:', message.data);
    });

    return () => {
      channel.unsubscribe();
    };
  }, [channel]);

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col items-center space-y-4 mt-8">
          <FormField
            control={form.control}
            name="gnumber"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormControl>
                  <Input
                    type="number"
                    className="input"
                    placeholder="Enter a number"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button
            type="submit"
            className="flex-1 bg-gael-green hover:bg-gael-green-dark"
          >
            Guess
          </Button>
        </form>
      </Form>
    </>
  )
}
