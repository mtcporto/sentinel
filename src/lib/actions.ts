// src/lib/actions.ts
"use server";

import { analyzeSystemLogs, type AnalyzeSystemLogsInput, type AnalyzeSystemLogsOutput } from '@/ai/flows/analyze-system-logs';
import { aiPoweredDiagnosis, type AIPoweredDiagnosisInput, type AIPoweredDiagnosisOutput } from '@/ai/flows/ai-powered-diagnosis';
import type { SystemMetric, ServiceStatus, LogEntry, SystemAlert } from '@/types';
import { z } from 'zod';
import { 
  DEFAULT_SYSTEM_METRICS, 
  DEFAULT_SERVICE_STATUS, 
  DEFAULT_RECENT_LOGS, 
  DEFAULT_ALERTS,
  EXAMPLE_SYSTEM_STATUS_FOR_AI, // Kept for AI Diagnosis if live data isn't available
  EXAMPLE_RECENT_LOGS_FOR_AI    // Kept for AI Diagnosis if live data isn't available
} from './consts';

// --- Server Actions for fetching system data ---
// IMPORTANT: These are stubs. Implement actual system data retrieval here.

export async function getSystemMetrics(): Promise<SystemMetric[]> {
  // TODO: Implement logic to get real system metrics (CPU, Memory, Disk)
  // Example for Linux: use commands like `top`, `free`, `df`
  console.log("Server Action: getSystemMetrics called (stubbed)");
  return Promise.resolve(DEFAULT_SYSTEM_METRICS); 
  // Example of returning actual data:
  // return Promise.resolve([
  //   { id: 'cpu', name: 'CPU Usage', value: 15, unit: '%', maxValue: 100, description: 'Overall CPU utilization' },
  //   { id: 'memory', name: 'Memory Usage', value: 4.2, unit: 'GB', maxValue: 16, description: 'Total memory consumed' },
  // ]);
}

export async function getServiceStatus(): Promise<ServiceStatus[]> {
  // TODO: Implement logic to get real service status (e.g., Nginx, MySQL)
  // Example for Linux: use `systemctl status <service_name>`
  console.log("Server Action: getServiceStatus called (stubbed)");
  return Promise.resolve(DEFAULT_SERVICE_STATUS);
  // Example:
  // return Promise.resolve([
  //   { id: 'nginx', name: 'Nginx Web Server', status: 'Running', details: 'Serving web traffic' },
  // ]);
}

export async function getRecentLogs(limit: number = 20): Promise<LogEntry[]> {
  // TODO: Implement logic to get recent system logs (e.g., from /var/log/syslog)
  // Remember to handle file reading, parsing, and potential errors.
  console.log(`Server Action: getRecentLogs called with limit ${limit} (stubbed)`);
  return Promise.resolve(DEFAULT_RECENT_LOGS);
  // Example:
  // return Promise.resolve([
  //   { id: 'log1', timestamp: new Date().toISOString(), level: 'INFO', message: 'System boot' },
  // ]);
}

export async function getSystemAlerts(): Promise<SystemAlert[]> {
  // TODO: Implement logic to generate or retrieve system alerts
  // This might involve analyzing logs or monitoring specific conditions.
  console.log("Server Action: getSystemAlerts called (stubbed)");
  return Promise.resolve(DEFAULT_ALERTS);
  // Example:
  // return Promise.resolve([
  //   { id: 'alert1', severity: 'Warning', message: 'High CPU usage detected', timestamp: new Date().toISOString() },
  // ]);
}

/**
 * Provides a formatted overview of the system status and recent logs,
 * suitable for input to the AI diagnosis flow.
 */
export async function getSystemOverviewForAIDiagnosis(): Promise<{ systemStatus: string; recentLogs: string }> {
  // TODO: Fetch real data using getSystemMetrics, getServiceStatus, getRecentLogs
  // and format it into strings similar to EXAMPLE_SYSTEM_STATUS_FOR_AI and EXAMPLE_RECENT_LOGS_FOR_AI.
  // For now, returns example data if stubs above don't provide enough detail.
  console.log("Server Action: getSystemOverviewForAIDiagnosis called (using example data)");
  
  const metrics = await getSystemMetrics();
  const services = await getServiceStatus();
  const logs = await getRecentLogs(5); // Get a few recent logs for the AI

  let systemStatusReport = "System Status:\n";
  if (metrics.length > 0) {
    metrics.forEach(m => systemStatusReport += `${m.name}: ${m.value}${m.unit || ''}${m.maxValue ? `/${m.maxValue}${m.unit || ''}` : ''}\n`);
  } else {
    systemStatusReport += "Metrics data not available.\n";
  }
  if (services.length > 0) {
    services.forEach(s => systemStatusReport += `${s.name}: ${s.status}\n`);
  } else {
    systemStatusReport += "Service status not available.\n";
  }
  // If the stubs return empty, use example data to ensure AI has something to work with.
  const finalSystemStatus = (metrics.length === 0 && services.length === 0) ? EXAMPLE_SYSTEM_STATUS_FOR_AI : systemStatusReport;

  let recentLogsReport = "Recent Logs:\n";
  if (logs.length > 0) {
    logs.forEach(l => recentLogsReport += `[${l.level}] ${new Date(l.timestamp).toLocaleTimeString()} - ${l.message}\n`);
  } else {
    recentLogsReport += "No recent logs available.\n";
  }
  const finalRecentLogs = logs.length === 0 ? EXAMPLE_RECENT_LOGS_FOR_AI : recentLogsReport;

  return {
    systemStatus: finalSystemStatus,
    recentLogs: finalRecentLogs,
  };
}


// --- AI Related Actions ---

const LogAnalysisInputSchema = z.object({
  logs: z.string().min(1, "Logs to analyze cannot be empty."),
});

export async function handleLogAnalysis(input: AnalyzeSystemLogsInput): Promise<{ success: boolean; data?: AnalyzeSystemLogsOutput; error?: string }> {
  const validationResult = LogAnalysisInputSchema.safeParse(input);
  if (!validationResult.success) {
    return { success: false, error: validationResult.error.flatten().fieldErrors.logs?.join(", ") || "Invalid input for log analysis." };
  }
  
  try {
    const result = await analyzeSystemLogs(validationResult.data);
    return { success: true, data: result };
  } catch (error) {
    console.error("Log analysis error:", error);
    return { success: false, error: error instanceof Error ? error.message : "An unknown error occurred during log analysis." };
  }
}

const AIDiagnosisSchema = z.object({
  systemStatus: z.string().min(1, "System status cannot be empty."),
  recentLogs: z.string().min(1, "Recent logs cannot be empty."),
  actionHistory: z.string().optional(),
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
      actionHistory: validationResult.data.actionHistory || "No specific actions logged recently.",
    };
    const result = await aiPoweredDiagnosis(input);
    return { success: true, data: result };
  } catch (error) {
    console.error("AI diagnostics error:", error);
    return { success: false, error: error instanceof Error ? error.message : "An unknown error occurred during AI diagnostics." };
  }
}
