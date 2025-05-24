// src/components/log-analysis/LogAnalysisClient.tsx
"use client";

import React, { useState, useTransition } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { handleLogAnalysis } from '@/lib/actions';
import type { AnalyzeSystemLogsOutput } from '@/ai/flows/analyze-system-logs';
import { Loader2, Terminal, Lightbulb } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function LogAnalysisClient() {
  const [logs, setLogs] = useState('');
  const [analysisResult, setAnalysisResult] = useState<AnalyzeSystemLogsOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setAnalysisResult(null);

    if (!logs.trim()) {
      setError("Please paste some logs to analyze.");
      return;
    }

    const formData = new FormData();
    formData.append('logs', logs);

    startTransition(async () => {
      const result = await handleLogAnalysis(formData);
      if (result.success && result.data) {
        setAnalysisResult(result.data);
        toast({
          title: "Analysis Complete",
          description: "Logs have been successfully analyzed by AI.",
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
            Paste your system logs below. Our AI will analyze them to identify anomalies, potential issues, and provide actionable insights.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent>
            <Textarea
              placeholder="Paste your system logs here... (e.g., /var/log/syslog, auth.log, application logs)"
              value={logs}
              onChange={(e) => setLogs(e.target.value)}
              rows={15}
              className="font-mono text-sm bg-background focus:ring-accent"
              aria-label="System Logs Input"
            />
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button type="submit" disabled={isPending || !logs.trim()}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                'Analyze Logs'
              )}
            </Button>
          </CardFooter>
        </form>
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
