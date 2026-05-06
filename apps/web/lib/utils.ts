import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Converts various error types into a user-friendly string message.
 * Specifically handles JSON parsing errors that occur when the server is unreachable
 * or returns a non-JSON error page.
 */
export function getFriendlyErrorMessage(error: unknown, fallback: string = 'An unexpected error occurred'): string {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    // Handle JSON parsing errors (server down/wrong response)
    if (message.includes('json.parse') ||
        message.includes('unexpected end of json') ||
        message.includes('unexpected token')) {
      return 'Could not reach server. The database might be offline.';
    }

    // Handle network errors
    if (message.includes('fetch failed') ||
        message.includes('network error') ||
        message.includes('failed to fetch')) {
      return 'Network error. Please check your connection.';
    }

    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return fallback;
}
