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
import { exec } from 'child_process';

// --- Server Actions for fetching system data ---
// IMPORTANT: These are stubs. Implement actual system data retrieval here.

export async function getSystemMetrics(): Promise<SystemMetric[]> {
  try {
    // No ambiente do servidor, precisamos usar a URL absoluta ou acessar diretamente
    if (typeof window === 'undefined') {
      // Estamos no servidor, então vamos importar e usar diretamente o código da API
      try {
        // Importa diretamente a função runCommand de system/route.ts
        const { runCommand } = await import('@/app/api/system/route');
        
        // Executa comandos mais robustos para coletar métricas do sistema
        const cpuInfo = await runCommand('grep "cpu " /proc/stat | awk \'{usage=($2+$4)*100/($2+$4+$5)} END {print usage}\'');
        const memoryInfo = await runCommand('free | grep Mem | awk \'{print $3/$2 * 100.0}\'');
        const diskInfo = await runCommand('df -h / | awk \'NR==2 {print $5}\'');
        
        // Transform API response to match our type
        const metrics: SystemMetric[] = [
          {
            id: 'cpu',
            name: 'CPU Usage',
            value: parseFloat(cpuInfo.trim()) || 0,
            maxValue: 100,
            unit: '%',
            description: 'Current CPU utilization'
          },
          {
            id: 'memory',
            name: 'Memory Usage',
            value: parseFloat(memoryInfo.trim()) || 0,
            maxValue: 100,
            unit: '%',
            description: 'Current memory utilization'
          },
          {
            id: 'disk',
            name: 'Disk Usage',
            value: parseFloat(diskInfo.replace('%', '').trim()) || 0,
            maxValue: 100,
            unit: '%',
            description: 'Current disk utilization'
          }
        ];
        return metrics;
      } catch (error) {
        console.error("Failed to directly access system commands:", error);
        // Cai para o fallback com os dados padrão
      }
    }
    
    // Estamos no navegador - usar URL relativa completa
    const response = await fetch(`/api/system`, {
      cache: 'no-store'
    });
  
    if (!response.ok) {
      throw new Error(`Failed to fetch system metrics: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Transform API response to match our type
    const metrics: SystemMetric[] = [
      {
        id: 'cpu',
        name: 'CPU Usage',
        value: data.cpu,
        maxValue: 100,
        unit: '%',
        description: 'Current CPU utilization'
      },
      {
        id: 'memory',
        name: 'Memory Usage',
        value: data.memory,
        maxValue: 100,
        unit: '%',
        description: 'Current memory utilization'
      },
      {
        id: 'disk',
        name: 'Disk Usage',
        value: parseFloat(data.disk.replace('%', '')),
        maxValue: 100,
        unit: '%',
        description: 'Current disk utilization'
      }
    ];
    
    return metrics;
  } catch (error) {
    console.error("Error fetching system metrics:", error);
    return DEFAULT_SYSTEM_METRICS;
  }
}

export async function getServiceStatus(): Promise<ServiceStatus[]> {
  try {
    if (typeof window === 'undefined') {
      // Estamos no servidor, então vamos importar e usar diretamente o código da API
      try {
        // Importa diretamente a função runCommand de system/route.ts
        const { runCommand } = await import('@/app/api/system/route');
        
        // Get service statuses
        const services = ['apache2', 'mysql', 'nginx']; // Add or remove services as needed
        const serviceStatuses: Record<string, string> = {};
        
        for (const service of services) {
          try {
            // Add error suppression to prevent systemctl errors from crashing
            const status = await runCommand(`systemctl is-active ${service} 2>/dev/null || echo "inactive"`);
            serviceStatuses[service] = status.trim();
          } catch (error) {
            console.log(`Service check error for ${service}:`, error);
            serviceStatuses[service] = 'inactive';
          }
        }
        
        // Transform API response to match our type
        const servicesArray: ServiceStatus[] = Object.entries(serviceStatuses).map(([name, status]) => ({
          id: name,
          name: name.charAt(0).toUpperCase() + name.slice(1), // Capitalize first letter
          status: status === 'active' ? 'Running' : 'Stopped',
          details: `Status: ${status}`
        }));
        
        return servicesArray;
      } catch (error) {
        console.error("Failed to directly access service status:", error);
        // Cai para o fallback com os dados padrão
      }
    }
    
    // Estamos no navegador - usar URL relativa completa
    const response = await fetch(`/api/system`, {
      cache: 'no-store'
    });
  
    if (!response.ok) {
      throw new Error(`Failed to fetch service status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Transform API response to match our type
    const services: ServiceStatus[] = Object.entries(data.services || {}).map(([name, status]) => ({
      id: name,
      name: name.charAt(0).toUpperCase() + name.slice(1), // Capitalize first letter
      status: status === 'active' ? 'Running' : 'Stopped',
      details: `Status: ${status}`
    }));
    
    return services;
  } catch (error) {
    console.error("Error fetching service status:", error);
    return DEFAULT_SERVICE_STATUS;
  }
}

export async function getRecentLogs(limit: number = 20): Promise<LogEntry[]> {
  try {
    if (typeof window === 'undefined') {
      // Estamos no servidor, então vamos importar e usar diretamente o código da API
      try {
        // Importa diretamente a função runCommand de system/route.ts
        const { runCommand } = await import('@/app/api/system/route');
        
        // Get recent logs
        const recentLogsOutput = await runCommand(`tail -n ${limit} /var/log/syslog 2>/dev/null || echo "Não foi possível acessar o arquivo. Permissão negada."`);
        const recentLogLines = recentLogsOutput.split('\n').filter(Boolean);
        
        // Parse log entries and attempt to determine log level
        const logs: LogEntry[] = recentLogLines.map((logLine: string, index: number) => {
          // Extract timestamp pattern if it exists
          const timestampMatch = logLine.match(/^(\w{3}\s+\d+\s+\d+:\d+:\d+)/);
          const timestamp = timestampMatch ? timestampMatch[1] : new Date().toISOString();
          
          // Determine log level based on keywords
          let level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG' = 'INFO';
          if (/error|failed|fatal/i.test(logLine)) level = 'ERROR';
          else if (/warning|warn/i.test(logLine)) level = 'WARN';
          else if (/debug/i.test(logLine)) level = 'DEBUG';
          
          return {
            id: `log-${Date.now()}-${index}`,
            timestamp,
            level,
            message: logLine
          };
        });
        
        return logs;
      } catch (error) {
        console.error("Failed to directly access log files:", error);
        // Cai para o fallback com os dados padrão
      }
    }
    
    // Estamos no navegador - usar URL relativa completa
    const response = await fetch(`/api/system`, {
      cache: 'no-store'
    });
  
    if (!response.ok) {
      throw new Error(`Failed to fetch recent logs: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Parse log entries and attempt to determine log level
    const logs: LogEntry[] = (data.recentLogs || []).slice(0, limit).map((logLine: string, index: number) => {
      // Extract timestamp pattern if it exists
      const timestampMatch = logLine.match(/^(\w{3}\s+\d+\s+\d+:\d+:\d+)/);
      const timestamp = timestampMatch ? timestampMatch[1] : new Date().toISOString();
      
      // Determine log level based on keywords
      let level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG' = 'INFO';
      if (/error|failed|fatal/i.test(logLine)) level = 'ERROR';
      else if (/warning|warn/i.test(logLine)) level = 'WARN';
      else if (/debug/i.test(logLine)) level = 'DEBUG';
      
      return {
        id: `log-${Date.now()}-${index}`,
        timestamp,
        level,
        message: logLine
      };
    });
    
    return logs;
  } catch (error) {
    console.error("Error fetching recent logs:", error);
    return DEFAULT_RECENT_LOGS;
  }
}

export async function getSystemAlerts(): Promise<SystemAlert[]> {
  try {
    // When running server-side, compute alerts directly
    if (typeof window === 'undefined') {
      try {
        const metrics = await getSystemMetrics();
        const services = await getServiceStatus();
        
        const alerts: SystemAlert[] = [];
        
        // Check critical system metrics for alerts (higher thresholds)
        metrics.forEach(metric => {
          if (metric.value > 95) {
            alerts.push({
              id: `alert-${Date.now()}-${metric.id}-critical`,
              severity: 'Critical',
              message: `${metric.name} is critically high (${metric.value}${metric.unit || ''}) - Immediate attention required`,
              timestamp: new Date().toISOString()
            });
          } else if (metric.value > 85) {
            alerts.push({
              id: `alert-${Date.now()}-${metric.id}-warning`,
              severity: 'Warning',
              message: `${metric.name} is elevated (${metric.value}${metric.unit || ''}) - Monitor closely`,
              timestamp: new Date().toISOString()
            });
          }
        });
        
        // Check service status for critical alerts only
        services
          .filter(service => service.status !== 'Running')
          .forEach(service => {
            alerts.push({
              id: `alert-${Date.now()}-${service.id}`,
              severity: 'Critical',
              message: `Critical service ${service.name} is ${service.status.toLowerCase()} - Service disruption likely`,
              timestamp: new Date().toISOString()
            });
          });
          
        // Check for system-specific security and error conditions
        try {
          const { executeSystemCommand } = await import('@/lib/actions');
          
          // Check for authentication failures
          const authFailures = await executeSystemCommand('grep "authentication failure" /var/log/auth.log 2>/dev/null | tail -5 | wc -l');
          if (authFailures.success && parseInt(authFailures.output?.trim() || '0') > 0) {
            alerts.push({
              id: `alert-${Date.now()}-auth-failures`,
              severity: 'Warning',
              message: `${authFailures.output?.trim()} recent authentication failures detected - Possible security issue`,
              timestamp: new Date().toISOString()
            });
          }
          
          // Check for disk errors
          const diskErrors = await executeSystemCommand('dmesg | grep -i "error\\|fail" | grep -i "disk\\|sda\\|nvme" | tail -3 | wc -l');
          if (diskErrors.success && parseInt(diskErrors.output?.trim() || '0') > 0) {
            alerts.push({
              id: `alert-${Date.now()}-disk-errors`,
              severity: 'Critical',
              message: `${diskErrors.output?.trim()} disk-related errors found in system logs - Check storage health`,
              timestamp: new Date().toISOString()
            });
          }
          
          // Check for out of memory conditions
          const oomKiller = await executeSystemCommand('dmesg | grep -i "killed process\\|out of memory" | tail -3 | wc -l');
          if (oomKiller.success && parseInt(oomKiller.output?.trim() || '0') > 0) {
            alerts.push({
              id: `alert-${Date.now()}-oom`,
              severity: 'Critical',
              message: `${oomKiller.output?.trim()} out-of-memory events detected - System may be under memory pressure`,
              timestamp: new Date().toISOString()
            });
          }
          
          // Check for high load average
          const loadAverage = await executeSystemCommand('uptime | awk -F\'load average:\' \'{ print $2 }\' | awk \'{print $1}\' | sed \'s/,//\'');
          if (loadAverage.success) {
            const load = parseFloat(loadAverage.output?.trim() || '0');
            if (load > 5.0) {
              alerts.push({
                id: `alert-${Date.now()}-high-load`,
                severity: 'Warning',
                message: `System load average is high (${load.toFixed(2)}) - Performance may be degraded`,
                timestamp: new Date().toISOString()
              });
            }
          }
          
        } catch (cmdError) {
          console.log('Could not execute additional system checks:', cmdError);
        }
        
        // If no alerts, add a positive status message
        if (alerts.length === 0) {
          alerts.push({
            id: `alert-${Date.now()}-all-clear`,
            severity: 'Info',
            message: 'All system metrics are within normal ranges - System operating normally',
            timestamp: new Date().toISOString()
          });
        }
          
        return alerts;
      } catch (error) {
        console.error("Error generating server-side alerts:", error);
        return [{
          id: `alert-${Date.now()}-error`,
          severity: 'Warning',
          message: 'Unable to fetch system alerts - Check system monitoring configuration',
          timestamp: new Date().toISOString()
        }];
      }
    }
    
    // Client-side fallback - simple metric-based alerts
    const metrics = await getSystemMetrics();
    const services = await getServiceStatus();
    const alerts: SystemAlert[] = [];
    
    // Check critical system metrics for alerts (higher thresholds)
    metrics.forEach(metric => {
      if (metric.value > 95) {
        alerts.push({
          id: `alert-${Date.now()}-${metric.id}-critical`,
          severity: 'Critical',
          message: `${metric.name} is critically high (${metric.value}${metric.unit || ''}) - Immediate attention required`,
          timestamp: new Date().toISOString()
        });
      } else if (metric.value > 85) {
        alerts.push({
          id: `alert-${Date.now()}-${metric.id}-warning`,
          severity: 'Warning',
          message: `${metric.name} is elevated (${metric.value}${metric.unit || ''}) - Monitor closely`,
          timestamp: new Date().toISOString()
        });
      }
    });
    
    // Check service status for critical alerts only
    services
      .filter(service => service.status !== 'Running')
      .forEach(service => {
        alerts.push({
          id: `alert-${Date.now()}-${service.id}`,
          severity: 'Critical',
          message: `Critical service ${service.name} is ${service.status.toLowerCase()} - Service disruption likely`,
          timestamp: new Date().toISOString()
        });
      });
    
    // If no alerts, add a positive status message
    if (alerts.length === 0) {
      alerts.push({
        id: `alert-${Date.now()}-all-clear`,
        severity: 'Info',
        message: 'All system metrics are within normal ranges - System operating normally',
        timestamp: new Date().toISOString()
      });
    }
    
    return alerts;
  } catch (error) {
    console.error("Error generating system alerts:", error);
    return [{
      id: `alert-${Date.now()}-error`,
      severity: 'Warning',
      message: 'Unable to fetch system alerts - Check system monitoring configuration',
      timestamp: new Date().toISOString()
    }];
  }
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
 * Executes a system command.
 * In a real application, this is where you would use Node.js 'child_process'
 * to interact with the operating system.
 * WARNING: Executing arbitrary commands can be dangerous. Implement with extreme care.
 */
const CommandInputSchema = z.object({
  command: z.string().min(1, "Command cannot be empty."),
});

// Lista de comandos seguros que podem ser executados
const SAFE_COMMANDS = [
  'ls', 'df', 'free', 'top', 'ps', 'uname', 'uptime', 'who', 'whoami',
  'cat', 'head', 'tail', 'grep', 'find', 'systemctl', 'ss', 'netstat',
  'ip', 'awk', 'curl', 'last', 'getenforce', 'iptables'
];

const SAFE_PATHS = [
  '/var/log', '/etc', '/proc', '/sys/class', '/dev'
];

export async function executeSystemCommand(
  command: string
): Promise<{ success: boolean; output?: string; error?: string; executed: boolean }> {
  const validationResult = CommandInputSchema.safeParse({ command });
  if (!validationResult.success) {
    return { success: false, error: validationResult.error.flatten().fieldErrors.command?.join(", ") || "Invalid command.", executed: false };
  }

  const validatedCommand = validationResult.data.command;

  // Verificação de segurança - permite comandos que começam com comandos seguros
  const isSafeCommand = SAFE_COMMANDS.some(safeCmd => {
    // Remove pipes e redirecionamentos para análise
    const baseCommand = validatedCommand.split(/[|>&]/, 1)[0].trim();
    const commandWords = baseCommand.split(/\s+/);
    
    // Verifica se o primeiro comando é seguro
    return commandWords[0] === safeCmd || baseCommand.startsWith(safeCmd + ' ');
  });
  
  // Verificação adicional para comandos 'cat', 'head', 'tail' - apenas permitir acesso a certos caminhos
  const isAccessingUnsafePath = (validatedCommand.includes('cat ') || 
                                 validatedCommand.includes('head ') || 
                                 validatedCommand.includes('tail ')) &&
                               SAFE_PATHS.every(safePath => !validatedCommand.includes(safePath));
  
  if (!isSafeCommand || isAccessingUnsafePath) {
    return { 
      success: false, 
      error: "Comando não permitido por razões de segurança. Apenas comandos de leitura em pastas específicas são permitidos.", 
      executed: false 
    };
  }

  console.log(`Server Action: executeSystemCommand called with command: "${validatedCommand}"`);
  
  try {
    return new Promise((resolve) => {
      exec(validatedCommand, { timeout: 10000 }, (error, stdout, stderr) => {
        if (error) {
          console.error(`Error executing command: ${error.message}`);
          resolve({ success: false, error: error.message, executed: true });
          return;
        }
        if (stderr) {
          console.warn(`Command stderr: ${stderr}`);
          // Stderr pode não significar sempre erro, dependendo do comando
          resolve({ 
            success: true, 
            output: `Output:\n${stdout}\nStderr:\n${stderr}`, 
            executed: true 
          });
          return;
        }
        resolve({ success: true, output: stdout, executed: true });
      });
    });
  } catch (err) {
    console.error("Exception during command execution:", err);
    return Promise.resolve({ 
      success: false, 
      error: err instanceof Error ? err.message : "Erro de execução desconhecido", 
      executed: true 
    });
  }
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
