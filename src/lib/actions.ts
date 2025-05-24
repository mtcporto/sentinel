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
  DEFAULT_ALERTS
} from './consts';

// --- Server Actions for fetching system data ---
// IMPORTANT: These are stubs. Implement actual system data retrieval here.

export async function getSystemMetrics(): Promise<SystemMetric[]> {
  // TODO: Implement logic to get real system metrics (CPU, Memory, Disk)
  // Example for Linux: use commands like `top`, `free`, `df`
  console.log("Server Action: getSystemMetrics called (stubbed - returns default empty data)");
  return Promise.resolve(DEFAULT_SYSTEM_METRICS); 
}

export async function getServiceStatus(): Promise<ServiceStatus[]> {
  // TODO: Implement logic to get real service status (e.g., Nginx, MySQL)
  // Example for Linux: use `systemctl status <service_name>`
  console.log("Server Action: getServiceStatus called (stubbed - returns default empty data)");
  return Promise.resolve(DEFAULT_SERVICE_STATUS);
}

export async function getRecentLogs(limit: number = 20): Promise<LogEntry[]> {
  // TODO: Implement logic to get recent system logs (e.g., from /var/log/syslog)
  // Remember to handle file reading, parsing, and potential errors.
  console.log(`Server Action: getRecentLogs called with limit ${limit} (stubbed - returns default empty data)`);
  return Promise.resolve(DEFAULT_RECENT_LOGS);
}

export async function getSystemAlerts(): Promise<SystemAlert[]> {
  // TODO: Implement logic to generate or retrieve system alerts
  // This might involve analyzing logs or monitoring specific conditions.
  console.log("Server Action: getSystemAlerts called (stubbed - returns default empty data)");
  return Promise.resolve(DEFAULT_ALERTS);
}

/**
 * Provides a formatted overview of the system status and recent logs,
 * suitable for input to the AI diagnosis flow.
 * This function now relies on the (stubbed) data fetching functions.
 */
export async function getSystemOverviewForAIDiagnosis(): Promise<{ systemStatus: string; recentLogs: string }> {
  console.log("Server Action: getSystemOverviewForAIDiagnosis called");
  
  const metrics = await getSystemMetrics();
  const services = await getServiceStatus();
  const logs = await getRecentLogs(10); // Get a few recent logs for the AI

  let systemStatusReport = "System Status:\n";
  if (metrics.length > 0) {
    metrics.forEach(m => systemStatusReport += `- ${m.name}: ${m.value}${m.unit || ''}${m.maxValue ? `/${m.maxValue}${m.unit || ''}` : ''}\n`);
  } else {
    systemStatusReport += "- Metrics data: Not available (implement getSystemMetrics).\n";
  }
  
  systemStatusReport += "\nService Status:\n";
  if (services.length > 0) {
    services.forEach(s => systemStatusReport += `- ${s.name}: ${s.status}\n`);
  } else {
    systemStatusReport += "- Service status data: Not available (implement getServiceStatus).\n";
  }

  let recentLogsReport = "Recent Logs (last 10 entries):\n";
  if (logs.length > 0) {
    logs.forEach(l => recentLogsReport += `[${new Date(l.timestamp).toLocaleString()}] [${l.level}] ${l.message}\n`);
  } else {
    recentLogsReport += "- Recent logs: Not available (implement getRecentLogs).\n";
  }

  return {
    systemStatus: systemStatusReport,
    recentLogs: recentLogsReport,
  };
}

/**
 * Simulates the execution of a system command.
 * In a real application, this is where you would use Node.js 'child_process'
 * to interact with the operating system.
 * WARNING: Executing arbitrary commands can be dangerous. Implement with extreme care.
 */
const CommandInputSchema = z.object({
  command: z.string().min(1, "Command cannot be empty."),
});

export async function executeSystemCommand(
  command: string
): Promise<{ success: boolean; output?: string; error?: string; executed: boolean }> {
  const validationResult = CommandInputSchema.safeParse({ command });
  if (!validationResult.success) {
    return { success: false, error: validationResult.error.flatten().fieldErrors.command?.join(", ") || "Invalid command.", executed: false };
  }

  const validatedCommand = validationResult.data.command;

  console.log(`Server Action: executeSystemCommand called with command: "${validatedCommand}"`);
  
  // **SECURITY WARNING & IMPLEMENTATION NOTE:**
  // This is a STUB. It does NOT execute any actual system commands.
  // To make this functional on your local machine:
  // 1. Uncomment the 'child_process' import:
  //    // import { exec } from 'child_process';
  // 2. Replace the simulation below with actual command execution.
  //    Be extremely cautious with security, especially if this app were accessible externally.
  //    Consider input sanitization and limiting commands.
  //
  // Example of real execution (use with caution):
  // try {
  //   return new Promise((resolve) => {
  //     exec(validatedCommand, (error, stdout, stderr) => {
  //       if (error) {
  //         console.error(`Error executing command: ${error.message}`);
  //         resolve({ success: false, error: error.message, executed: true });
  //         return;
  //       }
  //       if (stderr) {
  //         console.warn(`Command stderr: ${stderr}`);
  //         // Depending on the command, stderr might not always mean failure
  //         resolve({ success: true, output: `Output:\n${stdout}\nStderr:\n${stderr}`, executed: true });
  //         return;
  //       }
  //       resolve({ success: true, output: stdout, executed: true });
  //     });
  //   });
  // } catch (err) {
  //   console.error("Exception during command execution:", err);
  //   return Promise.resolve({ success: false, error: err instanceof Error ? err.message : "Unknown execution error", executed: true });
  // }

  // Simulating command execution
  if (validatedCommand.startsWith("echo")) {
    return Promise.resolve({ success: true, output: `Simulated output for: ${validatedCommand}`, executed: true });
  } else if (validatedCommand.startsWith("fail_sim")) {
     return Promise.resolve({ success: false, error: `Simulated failure for: ${validatedCommand}`, executed: true });
  }
  
  // For this stub, all other commands are "conceptually" executed but produce a standard message.
  const simulatedOutput = `Command "${validatedCommand}" would be executed here in a real environment. This is a simulation.`;
  console.log(simulatedOutput);
  return Promise.resolve({ success: true, output: simulatedOutput, executed: true });
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
