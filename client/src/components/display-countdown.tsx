'use client'

import { CountdownProvider, useCountdown } from "@/contexts/countdownContext";

const CountdownDisplay = () => {
  const countdownRemaining = useCountdown();

  return (
    <>
      <p className="text-md font-semibold">
        {countdownRemaining}
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
