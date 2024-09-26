'use client'

import { CountdownProvider, useCountdown } from "@/contexts/countdown";

const CountdownDisplay = () => {
  const countdown = useCountdown();

  return (
    <>
      <p className="text-md font-semibold">
        {countdown}
      </p>
    </>
  );
};

export default function DisplayCountdown() {
  return (
    <CountdownProvider>
      <CountdownDisplay />
    </CountdownProvider>
  )
}
