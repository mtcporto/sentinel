// src/lib/actions.ts
"use server";

import { analyzeSystemLogs, type AnalyzeSystemLogsInput, type AnalyzeSystemLogsOutput } from '@/ai/flows/analyze-system-logs';
import { aiPoweredDiagnosis, type AIPoweredDiagnosisInput, type AIPoweredDiagnosisOutput } from '@/ai/flows/ai-powered-diagnosis';
import { z } from 'zod';

const LogAnalysisSchema = z.object({
  logs: z.string().min(1, "Logs cannot be empty."),
});

export async function handleLogAnalysis(formData: FormData): Promise<{ success: boolean; data?: AnalyzeSystemLogsOutput; error?: string }> {
  const rawFormData = {
    logs: formData.get('logs') as string,
  };

  const validationResult = LogAnalysisSchema.safeParse(rawFormData);
  if (!validationResult.success) {
    return { success: false, error: validationResult.error.flatten().fieldErrors.logs?.join(", ") || "Invalid input." };
  }
  
  try {
    const input: AnalyzeSystemLogsInput = { logs: validationResult.data.logs };
    const result = await analyzeSystemLogs(input);
    return { success: true, data: result };
  } catch (error) {
    console.error("Log analysis error:", error);
    return { success: false, error: error instanceof Error ? error.message : "An unknown error occurred during log analysis." };
  }
}

const AIDiagnosisSchema = z.object({
  systemStatus: z.string().min(1, "System status cannot be empty."),
  recentLogs: z.string().min(1, "Recent logs cannot be empty."),
  actionHistory: z.string().optional(), // Action history can be empty
});


export async function handleAIDiagnostics(
  inputData: Pick<AIPoweredDiagnosisInput, 'systemStatus' | 'recentLogs' | 'actionHistory'>
): Promise<{ success: boolean; data?: AIPoweredDiagnosisOutput; error?: string }> {
  const validationResult = AIDiagnosisSchema.safeParse(inputData);

  if (!validationResult.success) {
     const errorMessages = Object.values(validationResult.error.flatten().fieldErrors).flat().join(", ") || "Invalid input for AI Diagnosis.";
    return { success: false, error: errorMessages };
  }

  try {
    const input: AIPoweredDiagnosisInput = { 
      systemStatus: validationResult.data.systemStatus,
      recentLogs: validationResult.data.recentLogs,
      actionHistory: validationResult.data.actionHistory || "No specific actions logged recently.", // Provide default if empty
    };
    const result = await aiPoweredDiagnosis(input);
    return { success: true, data: result };
  } catch (error) {
    console.error("AI diagnostics error:", error);
    return { success: false, error: error instanceof Error ? error.message : "An unknown error occurred during AI diagnostics." };
  }
}
