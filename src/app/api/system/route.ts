import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

// Helper function to execute shell commands
export async function runCommand(command: string) {
  try {
    const { stdout, stderr } = await execPromise(command);
    if (stderr) {
      console.error(`Command error: ${stderr}`);
    }
    return stdout;
  } catch (error) {
    console.error(`Execution error: ${error}`);
    throw error;
  }
}

export async function GET() {
  try {
    // Collect system metrics
    const cpuInfo = await runCommand('top -bn1 | grep "Cpu(s)" | awk \'{print $2 + $4}\'');
    const memoryInfo = await runCommand('free -m | grep "Mem:" | awk \'{print $3/$2 * 100}\'');
    const diskInfo = await runCommand('df -h / | awk \'NR==2 {print $5}\'');
    
    // Get service statuses
    const services = ['apache2', 'mysql', 'nginx']; // Add or remove services as needed
    const serviceStatuses: Record<string, string> = {};
    
    for (const service of services) {
      try {
        const status = await runCommand(`systemctl is-active ${service}`);
        serviceStatuses[service] = status.trim();
      } catch (error) {
        serviceStatuses[service] = 'inactive';
      }
    }
    
    // Get recent logs (last 5 entries from syslog)
    const recentLogs = await runCommand('tail -n 5 /var/log/syslog');
    
    return NextResponse.json({
      cpu: parseFloat(cpuInfo.trim()),
      memory: parseFloat(memoryInfo.trim()),
      disk: diskInfo.trim(),
      services: serviceStatuses,
      recentLogs: recentLogs.split('\n').filter(Boolean)
    });
  } catch (error) {
    console.error('Error fetching system data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch system data' },
      { status: 500 }
    );
  }
}
