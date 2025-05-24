// src/components/ai-diagnosis/AIDiagnosisClient.tsx
"use client";

import React, { useState, useTransition, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { handleAIDiagnostics, getSystemOverviewForAIDiagnosis } from '@/lib/actions';
import type { AIPoweredDiagnosisOutput } from '@/ai/flows/ai-powered-diagnosis';
import { Loader2, Brain, Activity, FileText, History as HistoryIcon, Wand2, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useActionHistory } from '@/contexts/ActionHistoryContext'; 

export function AIDiagnosisClient() {
  const [diagnosisResult, setDiagnosisResult] = useState<AIPoweredDiagnosisOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDiagnosing, startDiagnoseTransition] = useTransition();
  const [isFetchingData, setIsFetchingData] = useState(false);
  const { toast } = useToast();
  const { addAction, actionHistory } = useActionHistory();

  const [systemStatus, setSystemStatus] = useState<string>("System status not yet loaded. Click 'Refresh Data' or implement server actions.");
  const [recentLogs, setRecentLogs] = useState<string>("Recent logs not yet loaded. Click 'Refresh Data' or implement server actions.");
  
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
        description: "Data for AI diagnosis has been updated from server actions.",
      });
    } catch (err) {
      console.error("Error fetching system data for AI diagnosis:", err);
      setError("Could not fetch system data. Ensure server actions are implemented.");
      setSystemStatus("Failed to load system status.");
      setRecentLogs("Failed to load recent logs.");
      toast({
        title: "Data Fetch Failed",
        description: "Could not retrieve live system data for diagnosis.",
        variant: "destructive",
      });
    } finally {
      setIsFetchingData(false);
    }
  };
  
  useEffect(() => {
    // Initial fetch of system data
    fetchSystemDataForDiagnosis();
  }, []);


  const handleDiagnose = () => {
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
          action: "AI System Diagnosis Performed",
          user: "System",
          status: "Executed (Simulated)",
          details: `Diagnosis: ${result.data.diagnosis.substring(0,100)}...`
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

  const handleExecuteAction = (actionText: string) => {
    addAction({
      action: actionText,
      user: "AI Suggested",
      status: "Executed (Simulated)",
      details: "Action executed based on AI diagnosis."
    });
    toast({
      title: "Action Simulated",
      description: `"${actionText}" has been logged as executed.`,
    });
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
            Analyzes current system status, recent logs (fetched from server actions), and action history to provide a diagnosis and suggest remedial actions.
            Implement server actions like `getSystemMetrics`, `getServiceStatus`, `getRecentLogs` for live data.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-end mb-4">
            <Button onClick={fetchSystemDataForDiagnosis} disabled={isFetchingData || isDiagnosing}>
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
            <h3 className="font-semibold mb-1 flex items-center gap-2"><HistoryIcon className="h-4 w-4"/>Action History (Summary):</h3>
            <pre className="p-3 bg-muted/50 rounded-md text-xs font-mono max-h-40 overflow-y-auto whitespace-pre-wrap">{currentActionHistory}</pre>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button onClick={handleDiagnose} disabled={isDiagnosing || isFetchingData}>
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
                    onClick={() => handleExecuteAction(action.trim().replace(/^- /, ''))}
                  >
                    Simulate: {action.trim().replace(/^- /, '')}
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
