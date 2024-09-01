'use client'

import { useEffect, useState } from 'react';
import io from 'socket.io-client';
import { Loader2 } from 'lucide-react'
import { Button } from "./ui/button"

const simulateFetch = () => new Promise(resolve => setTimeout(resolve, 3000));

const socket = io(`${process.env.serverUrl}`);

export default function Dev() {
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('');

  const handleClick = async () => {
    setIsLoading(true)
    await simulateFetch()
    setIsLoading(false)
  }

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

  return process.env.NODE_ENV === 'development' && (
    <div className="mt-10 mb-10">
      <Button
        onClick={handleClick}
        disabled={isLoading}
        className="px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed"
        aria-busy={isLoading}
      >
        {isLoading ? 'Loading...' : 'Fetch Data'}
      </Button>

      {isLoading && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          aria-hidden="true"
        >
          <Loader2 className="w-8 h-8 text-white animate-spin" />
        </div>
      )}

      <div className='mt-5'>
        <Button onClick={saveDailyStats}>Save Daily Stats</Button>
        <p>Message from server: {message}</p>
      </div>

      <div className='mt-5'>
        <Button onClick={saveUnlimitedStats}>Save Unlimited Stats</Button>
        <p>Message from server: {message}</p>
      </div>
    </div>
  )
}
