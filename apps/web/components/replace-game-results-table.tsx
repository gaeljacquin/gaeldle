'use client';

import {
  IconCircleCheck,
  IconCircleX,
  IconMinus,
} from '@tabler/icons-react';
import { cn } from '@/lib/utils';

export interface ReplaceGameResult {
  current: number;
  replacement: number;
  status: 'updated' | 'skipped' | 'error';
  message: string;
  gameName: string | null;
}

interface ReplaceGameResultsTableProps {
  results: ReplaceGameResult[];
}

function StatusCell({ status }: Readonly<{ status: ReplaceGameResult['status'] }>) {
  if (status === 'updated') {
    return (
      <div className="flex items-center gap-1.5 text-green-600">
        <IconCircleCheck size={14} aria-hidden="true" />
        <span className="text-xs font-medium">Updated</span>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex items-center gap-1.5 text-destructive">
        <IconCircleX size={14} aria-hidden="true" />
        <span className="text-xs font-medium">Error</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 text-muted-foreground">
      <IconMinus size={14} aria-hidden="true" />
      <span className="text-xs font-medium">Skipped</span>
    </div>
  );
}

export function ReplaceGameResultsTable({
  results,
}: Readonly<ReplaceGameResultsTableProps>) {
  if (results.length === 0) return null;

  return (
    <div className="overflow-x-auto border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
              Current
            </th>
            <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
              Replacement
            </th>
            <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
              Status
            </th>
            <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
              Name
            </th>
            <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
              Message
            </th>
          </tr>
        </thead>
        <tbody>
          {results.map((result, i) => (
            <tr
              key={`${result.current}-${result.replacement}`}
              className={cn(
                'border-b last:border-0',
                i % 2 === 0 ? 'bg-background' : 'bg-muted/20',
              )}
            >
              <td className="px-4 py-3 font-mono text-xs">{result.current}</td>
              <td className="px-4 py-3 font-mono text-xs">
                {result.replacement}
              </td>
              <td className="px-4 py-3">
                <StatusCell status={result.status} />
              </td>
              <td className="px-4 py-3 text-xs">
                {result.gameName ?? (
                  <span className="text-muted-foreground">&mdash;</span>
                )}
              </td>
              <td className="px-4 py-3 text-xs text-muted-foreground">
                {result.message}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
