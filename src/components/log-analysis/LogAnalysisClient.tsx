// src/components/log-analysis/LogAnalysisClient.tsx
"use client";

import React, { useState, useTransition, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { handleLogAnalysis, getRecentLogs } from '@/lib/actions';
import type { AnalyzeSystemLogsOutput } from '@/ai/flows/analyze-system-logs';
import type { LogEntry } from '@/types';
import { Loader2, Terminal, Lightbulb, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

const getLogLevelClass = (level: LogEntry['level']): string => {
  switch (level) {
    case 'ERROR': return 'text-destructive';
    case 'WARN': return 'text-yellow-500';
    case 'INFO': return 'text-blue-400';
    case 'DEBUG': return 'text-gray-500';
    default: return '';
  }
};

export function LogAnalysisClient() {
  const [fetchedLogs, setFetchedLogs] = useState<LogEntry[]>([]);
  const [isFetchingLogs, setIsFetchingLogs] = useState(true);
  const [analysisResult, setAnalysisResult] = useState<AnalyzeSystemLogsOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAnalyzing, startTransition] = useTransition();
  const { toast } = useToast();

  const [availableLogFiles, setAvailableLogFiles] = useState<{path: string, name: string}[]>([]);
  const [selectedLogFile, setSelectedLogFile] = useState<string | null>(null);
  
  const fetchAvailableLogs = async () => {
    try {
      const response = await fetch('/api/logs');
      const data = await response.json();
      if (data.logs && Array.isArray(data.logs)) {
        setAvailableLogFiles(data.logs);
        // Select first log by default if available
        if (data.logs.length > 0 && !selectedLogFile) {
          setSelectedLogFile(data.logs[0].path);
        }
      }
    } catch (err) {
      console.error("Error fetching available logs:", err);
      toast({ 
        title: "Error", 
        description: "Could not fetch list of log files", 
        variant: "destructive" 
      });
    }
  };
  
  const fetchLogsForAnalysis = async () => {
    setIsFetchingLogs(true);
    setError(null);
    setAnalysisResult(null); 
    try {
      // First try to use our API endpoint if a log file is selected
      if (selectedLogFile) {
        const response = await fetch(`/api/logs?file=${encodeURIComponent(selectedLogFile)}&limit=100`);
        if (!response.ok) {
          throw new Error(`Failed to fetch log: ${response.status}`);
        }
        const data = await response.json();
        
        // Convert to LogEntry format
        const logs: LogEntry[] = data.content.map((line: string, index: number) => {
          const level = line.includes('error') ? 'ERROR' : 
                       line.includes('warn') ? 'WARN' : 
                       line.includes('debug') ? 'DEBUG' : 'INFO';
          return {
            id: `log-${Date.now()}-${index}`,
            timestamp: new Date().toISOString(),
            level,
            message: line
          };
        });
        
        setFetchedLogs(logs);
      } else {
        // Fallback to using the server action
        const logs = await getRecentLogs(100);
        setFetchedLogs(logs);
      }
      
      if (fetchedLogs.length === 0) {
        toast({
          title: "No Logs Fetched",
          description: "No log entries were found.",
          variant: "default"
        });
      }
    } catch (err) {
      console.error("Error fetching logs for analysis:", err);
      setError("Could not fetch logs for analysis.");
      toast({ title: "Error Fetching Logs", description: "Failed to retrieve logs from the server.", variant: "destructive" });
    } finally {
      setIsFetchingLogs(false);
    }
  };

  useEffect(() => {
    fetchAvailableLogs();
  }, []);
  
  useEffect(() => {
    if (selectedLogFile) {
      fetchLogsForAnalysis();
    }
  }, [selectedLogFile]);

  const handleAnalyzeFetchedLogs = async () => {
    setError(null);
    setAnalysisResult(null);

    if (fetchedLogs.length === 0) {
      setError("No logs available to analyze. Fetch logs first.");
      toast({ title: "No Logs", description: "There are no logs to analyze.", variant: "destructive" });
      return;
    }

    // Format logs into a single string for the AI
    const logsString = fetchedLogs.map(log => `[${log.timestamp}] [${log.level}] ${log.message}`).join('\n');

    startTransition(async () => {
      const result = await handleLogAnalysis({ logs: logsString });
      if (result.success && result.data) {
        setAnalysisResult(result.data);
        toast({
          title: "Analysis Complete",
          description: "Fetched logs have been successfully analyzed by AI.",
        });
      } else {
        setError(result.error || "Failed to analyze logs.");
        toast({
          title: "Analysis Failed",
          description: result.error || "An unknown error occurred.",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <Terminal className="h-6 w-6 text-primary" />
            Intelligent Log Analysis
          </CardTitle>
          <CardDescription>
            Analyze recently fetched system logs. Our AI will identify anomalies, potential issues, and provide actionable insights.
            Implement the `getRecentLogs` server action to provide real log data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-wrap items-center gap-4">
            {availableLogFiles.length > 0 && (
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">Select Log File:</label>
                <select 
                  className="w-full p-2 rounded-md border bg-background" 
                  value={selectedLogFile || ''}
                  onChange={(e) => setSelectedLogFile(e.target.value)}
                  disabled={isFetchingLogs || isAnalyzing}
                >
                  {availableLogFiles.map((log, index) => (
                    <option key={index} value={log.path}>
                      {log.name} ({log.path})
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            <Button onClick={fetchLogsForAnalysis} disabled={isFetchingLogs || isAnalyzing}>
              <RefreshCw className={`mr-2 h-4 w-4 ${isFetchingLogs ? 'animate-spin' : ''}`} />
              {isFetchingLogs ? 'Fetching...' : 'Refresh Logs'}
            </Button>
          </div>

          <h3 className="font-semibold mb-2 text-lg">
            {selectedLogFile ? `Log file: ${selectedLogFile}` : 'System Logs'}:
          </h3>
          <ScrollArea className="h-72 w-full rounded-md border p-3 bg-background font-mono text-sm">
            {isFetchingLogs && <p className="text-muted-foreground">Fetching logs...</p>}
            {!isFetchingLogs && fetchedLogs.length === 0 && (
              <p className="text-muted-foreground">No logs fetched or available. Click "Refresh Logs" or ensure the server action is implemented.</p>
            )}
            {!isFetchingLogs && fetchedLogs.length > 0 && fetchedLogs.map(log => (
              <div key={log.id} className="flex items-start">
                <span className="text-muted-foreground w-28 shrink-0">
                  {new Date(log.timestamp).toLocaleString()}
                </span>
                <span className={cn("font-semibold w-12 shrink-0", getLogLevelClass(log.level))}>
                  [{log.level}]
                </span>
                <p className="break-all">{log.message}</p>
              </div>
            ))}
          </ScrollArea>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button onClick={handleAnalyzeFetchedLogs} disabled={isAnalyzing || isFetchingLogs || fetchedLogs.length === 0}>
            {isAnalyzing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              'Analyze Fetched Logs'
            )}
          </Button>
        </CardFooter>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {analysisResult && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-primary" />
              AI Analysis & Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg mb-1">Analysis:</h3>
              <div className="p-3 bg-muted/50 rounded-md prose prose-sm max-w-none dark:prose-invert">
                 <pre className="whitespace-pre-wrap font-sans text-sm">{analysisResult.analysis}</pre>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-1">Recommendations:</h3>
               <div className="p-3 bg-muted/50 rounded-md prose prose-sm max-w-none dark:prose-invert">
                 <pre className="whitespace-pre-wrap font-sans text-sm">{analysisResult.recommendations}</pre>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
