import { NextResponse } from "next/server";

export async function GET() {
  const response = await fetch(`${process.env.serverUrl}/ably/gen`, {
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.bearerToken}`,
    },
  });
  const data = await response.json();

  return NextResponse.json(data);
}
