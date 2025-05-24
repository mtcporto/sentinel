// src/components/dashboard/RecentLogsWidget.tsx
"use client";

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { LogEntry } from '@/types';
import { MOCK_RECENT_LOGS } from '@/lib/consts';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

const getLogLevelClass = (level: LogEntry['level']): string => {
  switch (level) {
    case 'ERROR':
      return 'text-destructive';
    case 'WARN':
      return 'text-yellow-500';
    case 'INFO':
      return 'text-blue-400';
    case 'DEBUG':
      return 'text-gray-500';
    default:
      return '';
  }
};

export function RecentLogsWidget() {
  // In a real app, logs would be dynamic. Here we use mock data.
  const logs = MOCK_RECENT_LOGS;

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl">Recent Logs</CardTitle>
        <CardDescription>A snippet of the latest system log entries.</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-64 w-full rounded-md border p-3 bg-background">
          <div className="font-mono text-xs space-y-1.5">
            {logs.map((log) => (
              <div key={log.id} className="flex items-start">
                <span className="text-muted-foreground w-20 shrink-0">
                  {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                </span>
                <span className={cn("font-semibold w-12 shrink-0", getLogLevelClass(log.level))}>
                  [{log.level}]
                </span>
                <p className="break-all">{log.message}</p>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
