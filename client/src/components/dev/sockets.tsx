'use client'

import { useEffect, useState } from 'react';
import io from 'socket.io-client';
import { Button } from "@/components/ui/button"

const socket = io(`${process.env.serverUrl}`);

export default function Sockets() {
  const [message, setMessage] = useState('');

  const testDailyStats = {
    gotdId: 3,
    modeId: 1,
    attempts: 1,
    guesses: [],
    found: true,
    info: null,
    real: false,
  }

  const testUnlimitedStats = {
    igdbId: 1443,
    modeId: 5,
    attempts: 1,
    guesses: [],
    found: true,
    info: null,
    real: false,
  }

  useEffect(() => {
    socket.on('connect', () => {
      console.log('Connected to server');
    });

    socket.on('message', (data: string) => {
      console.log('Message from server:', data);
      setMessage(data);
    });

    socket.on('error', (data: string) => {
      console.log('Message from server:', data);
      setMessage(data);
    });

    return () => {
      socket.off('connect');
      socket.off('message');
    };
  }, []);

  const saveDailyStats = () => {
    socket.emit('saveDailyStats', testDailyStats);
  };

  const saveUnlimitedStats = () => {
    socket.emit('saveUnlimitedStats', testUnlimitedStats);
  };

  return (
    <>
      <div className='mt-5'>
        <Button onClick={saveDailyStats}>Save Daily Stats</Button>
        <p>Message from server: {message}</p>
      </div>

      <div className='mt-5'>
        <Button onClick={saveUnlimitedStats}>Save Unlimited Stats</Button>
        <p>Message from server: {message}</p>
      </div>
    </>
  )
}
