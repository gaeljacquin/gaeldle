import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(input: string | number): string {
  const date = new Date(input);
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function absoluteUrl(path: string) {
  return `${process.env.NEXT_PUBLIC_APP_URL}${path}`;
}

export function checkNewGotd(date: Date) {
  const today = new Date();
  const todayDate = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );
  const givenDate = new Date(date);
  const checkDate = new Date(
    givenDate.getFullYear(),
    givenDate.getMonth(),
    givenDate.getDate()
  );

  return todayDate.getTime() !== checkDate.getTime();
}

export function keyNameByEnv(key: string) {
  if (process.env.NODE_ENV === "development") {
    key += "_dev";
  }

  return key;
}

export function myhostname() {
  let hostname = "";

  if (process.env.NODE_ENV === "development") {
    hostname += "http://";
  } else {
    hostname += "https://";
  }

  hostname += process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL;

  return hostname;
}
