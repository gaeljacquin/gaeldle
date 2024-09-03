import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  FC,
} from "react";

const CountdownContext = createContext<string>("");

export const useCountdown = () => useContext(CountdownContext);

interface CountdownProviderProps {
  children: ReactNode;
}

export const CountdownProvider: FC<CountdownProviderProps> = ({ children }) => {
  const [countdownRemaining, setCountdownRemaining] = useState("Next round...");

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const nextDay = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1,
        0,
        0,
        0
      );
      const countdownDiff = nextDay.getTime() - now.getTime();

      const hours = Math.floor(
        (countdownDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      const minutes = Math.floor((countdownDiff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((countdownDiff % (1000 * 60)) / 1000);

      setCountdownRemaining(`Next round in ${hours}h ${minutes}m ${seconds}s`);

      if (countdownDiff < 0) {
        setCountdownRemaining("Next round will be available shortly 🤩");
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <CountdownContext.Provider value={countdownRemaining}>
      {children}
    </CountdownContext.Provider>
  );
};
