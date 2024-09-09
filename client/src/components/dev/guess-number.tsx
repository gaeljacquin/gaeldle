'use client'

import { useEffect, useRef, useState } from 'react';
import io, { Socket } from 'socket.io-client';
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
  gnumber: z.coerce.number()
});

export default function GuessNumber() {
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      gnumber: 0,
    },
  });

  function transmitNumber(data: unknown) {
    socket.emit('message', { data });
  }

  function onSubmit(data: z.infer<typeof FormSchema>) {
    console.log(data)
    transmitNumber(data);
  }

  const socketRef = useRef<Socket | null>(null);

  if (!socketRef.current) {
    socketRef.current = io(`${process.env.serverUrl}`);
  }

  const socket = socketRef.current!

  useEffect(() => {
    socket.on('connect', () => {
      console.log('Connected to WebSocket server');
    });

    socket.on('response', (data: unknown) => {
      console.dir(data)
    });

    return () => {
      socket.off('connect');
      socket.off('response');
    };
  }, [socket]);

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
