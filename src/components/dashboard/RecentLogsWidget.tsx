// src/components/dashboard/RecentLogsWidget.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { LogEntry } from '@/types';
import { getRecentLogs } from '@/lib/actions';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { Loader2 } from 'lucide-react';

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

interface DisplayLogEntry extends LogEntry {
  formattedTimestamp: string;
}

export function RecentLogsWidget() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [displayLogs, setDisplayLogs] = useState<DisplayLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLogs() {
      try {
        setIsLoading(true);
        setError(null);
        const fetchedLogs = await getRecentLogs(10); // Fetch 10 recent logs
        setLogs(fetchedLogs);
      } catch (err) {
        console.error("Failed to fetch recent logs:", err);
        setError("Could not load recent logs.");
      } finally {
        setIsLoading(false);
      }
    }
    fetchLogs();
    // TODO: Consider adding a refresh mechanism if real-time updates are desired
  }, []);

  useEffect(() => {
    // Format timestamps on the client-side to avoid hydration mismatch
    if (logs.length > 0) {
      setDisplayLogs(
        logs.map(log => ({
          ...log,
          formattedTimestamp: formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })
        }))
      );
    } else {
      setDisplayLogs([]);
    }
  }, [logs]);


  if (isLoading) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl">Recent Logs</CardTitle>
          <CardDescription>A snippet of the latest system log entries.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-2">Loading recent logs...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl">Recent Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl">Recent Logs</CardTitle>
        <CardDescription>
          A snippet of the latest system log entries. 
          {displayLogs.length === 0 && !isLoading && " (No data available - implement server action)"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-64 w-full rounded-md border p-3 bg-background">
          {displayLogs.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">No recent logs found. Implement the `getRecentLogs` server action.</p>
            </div>
          ) : (
            <div className="font-mono text-xs space-y-1.5">
              {displayLogs.map((log) => (
                <div key={log.id} className="flex items-start">
                  <span className="text-muted-foreground w-20 shrink-0">
                    {log.formattedTimestamp}
                  </span>
                  <span className={cn("font-semibold w-12 shrink-0", getLogLevelClass(log.level))}>
                    [{log.level}]
                  </span>
                  <p className="break-all">{log.message}</p>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
