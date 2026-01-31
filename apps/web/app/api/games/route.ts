const API_BASE_URL = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:8080";
const STACK_USER_ENDPOINT = "https://api.stack-auth.com/api/v1/users/me";
const STACK_PROJECT_ID = process.env.NEXT_PUBLIC_STACK_PROJECT_ID || "";
const STACK_SECRET_SERVER_KEY = process.env.STACK_SECRET_SERVER_KEY || "";

const DEFAULT_PAGE_SIZE = 10;

const parsePositiveInt = (value: string | null, fallback: number) => {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export async function GET(request: Request) {
  const accessToken = request.headers.get("x-stack-access-token");

  if (!accessToken) {
    return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  if (!STACK_PROJECT_ID || !STACK_SECRET_SERVER_KEY) {
    return Response.json(
      { success: false, error: "Server misconfigured" },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(request.url);
  const page = parsePositiveInt(searchParams.get("page"), 1);
  const pageSize = parsePositiveInt(searchParams.get("pageSize"), DEFAULT_PAGE_SIZE);

  const stackResponse = await fetch(STACK_USER_ENDPOINT, {
    headers: {
      "x-stack-access-type": "server",
      "x-stack-project-id": STACK_PROJECT_ID,
      "x-stack-secret-server-key": STACK_SECRET_SERVER_KEY,
      "x-stack-access-token": accessToken,
    },
  });

  if (!stackResponse.ok) {
    return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const apiResponse = await fetch(
    `${API_BASE_URL}/api/game?page=${page}&pageSize=${pageSize}`,
    {
      headers: {
        "x-stack-access-token": accessToken,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    }
  );

  let payload: unknown = null;
  try {
    payload = await apiResponse.json();
  } catch {
    payload = { success: false, error: "Invalid response from API" };
  }

  return Response.json(payload, { status: apiResponse.status });
}
