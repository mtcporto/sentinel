// src/components/ai-diagnosis/AIDiagnosisClient.tsx
"use client";

import React, { useState, useTransition, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { handleAIDiagnostics, getSystemOverviewForAIDiagnosis, executeSystemCommand } from '@/lib/actions';
import type { AIPoweredDiagnosisOutput } from '@/ai/flows/ai-powered-diagnosis';
import { Loader2, Brain, Activity, FileText, History as HistoryIcon, Wand2, RefreshCw, Terminal } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useActionHistory } from '@/contexts/ActionHistoryContext'; 

export function AIDiagnosisClient() {
  const [diagnosisResult, setDiagnosisResult] = useState<AIPoweredDiagnosisOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDiagnosing, startDiagnoseTransition] = useTransition();
  const [isFetchingData, setIsFetchingData] = useState(true); // Start true to fetch on load
  const [isExecutingCommand, setIsExecutingCommand] = useState(false);

  const { toast } = useToast();
  const { addAction, actionHistory } = useActionHistory();

  const [systemStatus, setSystemStatus] = useState<string>("Fetching system data...");
  const [recentLogs, setRecentLogs] = useState<string>("Fetching recent logs...");
  
  const currentActionHistory = actionHistory.map(a => `${new Date(a.timestamp).toLocaleString()}: ${a.action} (${a.status})`).join('\n') || "No actions recorded recently.";

  const fetchSystemDataForDiagnosis = async () => {
    setIsFetchingData(true);
    setError(null);
    try {
      const overview = await getSystemOverviewForAIDiagnosis();
      setSystemStatus(overview.systemStatus);
      setRecentLogs(overview.recentLogs);
      toast({
        title: "System Data Refreshed",
        description: "Data for AI diagnosis has been updated.",
      });
    } catch (err) {
      console.error("Error fetching system data for AI diagnosis:", err);
      const errorMessage = err instanceof Error ? err.message : "Could not fetch system data. Ensure server actions are implemented or stubs return data.";
      setError(errorMessage);
      setSystemStatus(`Failed to load system status: ${errorMessage}`);
      setRecentLogs(`Failed to load recent logs: ${errorMessage}`);
      toast({
        title: "Data Fetch Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsFetchingData(false);
    }
  };
  
  useEffect(() => {
    fetchSystemDataForDiagnosis();
  }, []);


  const handleDiagnose = () => {
    if (systemStatus.startsWith("Fetching") || recentLogs.startsWith("Fetching") || systemStatus.startsWith("Failed") || recentLogs.startsWith("Failed")){
       toast({
        title: "Cannot Diagnose",
        description: "System data is not available or failed to load. Please refresh.",
        variant: "destructive",
      });
      return;
    }
    setError(null);
    setDiagnosisResult(null);

    startDiagnoseTransition(async () => {
      const input = {
        systemStatus,
        recentLogs,
        actionHistory: currentActionHistory,
      };
      const result = await handleAIDiagnostics(input);
      if (result.success && result.data) {
        setDiagnosisResult(result.data);
        toast({
          title: "AI Diagnosis Complete",
          description: "System diagnosis has been generated.",
        });
        addAction({
          action: "AI System Diagnosis Requested",
          user: "System",
          status: "Executed (Simulated)", // This itself is a system action
          details: `Diagnosis based on current data.`
        });
      } else {
        setError(result.error || "Failed to perform AI diagnosis.");
        toast({
          title: "AI Diagnosis Failed",
          description: result.error || "An unknown error occurred.",
          variant: "destructive",
        });
      }
    });
  };

  const handleExecuteSuggestedAction = async (actionText: string) => {
    setIsExecutingCommand(true);
    setError(null);
    
    // Attempt to extract a command-like string. This is a heuristic.
    // E.g., "Restart the Nginx service" -> "systemctl restart nginx" (hypothetically)
    // For now, we pass the descriptive action text.
    // In a real system, you'd need a more robust way to map suggestions to commands.
    const commandToExecute = actionText; 

    toast({
      title: "Executing Action...",
      description: `Attempting to execute: "${commandToExecute}"`,
    });

    const result = await executeSystemCommand(commandToExecute);

    if (result.success) {
      toast({
        title: "Action Attempted (Simulated)",
        description: `Command: "${commandToExecute}". Output: ${result.output || "No output."}`,
      });
      addAction({
        action: `Execute: ${commandToExecute}`,
        user: "AI Suggested/User Approved",
        status: "Executed (Simulated)",
        details: `Simulated execution. Output: ${result.output || "N/A"}`,
      });
    } else {
      toast({
        title: "Action Failed (Simulated)",
        description: `Command: "${commandToExecute}". Error: ${result.error || "Unknown error."}`,
        variant: "destructive",
      });
      addAction({
        action: `Attempt Execute: ${commandToExecute}`,
        user: "AI Suggested/User Approved",
        status: "Failed (Simulated)",
        details: `Simulated execution failed. Error: ${result.error || "N/A"}`,
      });
      setError(`Failed to execute "${commandToExecute}": ${result.error}`);
    }
    setIsExecutingCommand(false);
  };


  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            AI-Powered System Diagnosis
          </CardTitle>
          <CardDescription>
            Analyzes current system status, recent logs, and action history (fetched from server actions) to provide a diagnosis and suggest remedial actions.
            Implement server actions in `src/lib/actions.ts` to provide live data from your system.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-end mb-4">
            <Button onClick={fetchSystemDataForDiagnosis} disabled={isFetchingData || isDiagnosing || isExecutingCommand}>
              <RefreshCw className={`mr-2 h-4 w-4 ${isFetchingData ? 'animate-spin' : ''}`} />
              {isFetchingData ? 'Refreshing Data...' : 'Refresh System Data'}
            </Button>
          </div>
          <div>
            <h3 className="font-semibold mb-1 flex items-center gap-2"><Activity className="h-4 w-4"/>Current System Status:</h3>
            <pre className="p-3 bg-muted/50 rounded-md text-xs font-mono whitespace-pre-wrap max-h-60 overflow-y-auto">{systemStatus}</pre>
          </div>
          <div>
            <h3 className="font-semibold mb-1 flex items-center gap-2"><FileText className="h-4 w-4"/>Recent Logs:</h3>
            <pre className="p-3 bg-muted/50 rounded-md text-xs font-mono max-h-60 overflow-y-auto whitespace-pre-wrap">{recentLogs}</pre>
          </div>
           <div>
            <h3 className="font-semibold mb-1 flex items-center gap-2"><HistoryIcon className="h-4 w-4"/>Action History (Summary for AI):</h3>
            <pre className="p-3 bg-muted/50 rounded-md text-xs font-mono max-h-40 overflow-y-auto whitespace-pre-wrap">{currentActionHistory}</pre>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button onClick={handleDiagnose} disabled={isDiagnosing || isFetchingData || isExecutingCommand}>
            {isDiagnosing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Diagnosing...
              </>
            ) : (
               <>
                <Wand2 className="mr-2 h-4 w-4" />
                Diagnose with AI
               </>
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

      {diagnosisResult && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl">AI Diagnosis & Suggested Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg mb-1">Diagnosis:</h3>
              <div className="p-3 bg-muted/50 rounded-md prose prose-sm max-w-none dark:prose-invert">
                 <pre className="whitespace-pre-wrap font-sans text-sm">{diagnosisResult.diagnosis}</pre>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-1">Suggested Actions:</h3>
              <div className="p-3 bg-muted/50 rounded-md prose prose-sm max-w-none dark:prose-invert">
                 <pre className="whitespace-pre-wrap font-sans text-sm">{diagnosisResult.suggestedActions}</pre>
              </div>
              {diagnosisResult.suggestedActions.split('\n').map((action, index) => 
                action.trim() && (
                  <Button 
                    key={index} 
                    variant="outline" 
                    size="sm" 
                    className="mt-2 mr-2"
                    onClick={() => handleExecuteSuggestedAction(action.trim().replace(/^- /, ''))}
                    disabled={isExecutingCommand || isDiagnosing || isFetchingData}
                  >
                    {isExecutingCommand ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Terminal className="mr-2 h-4 w-4" />}
                    Execute: {action.trim().replace(/^- /, '')}
                  </Button>
                )
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
