import type { NavItem } from '@/components/layout/AppSidebar';
import type { SystemMetric, ServiceStatus, LogEntry, SystemAlert } from '@/types';
import { LayoutDashboard, FileText, History, BotMessageSquare, ShieldAlert } from 'lucide-react';

export const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/log-analysis', label: 'Log Analysis', icon: FileText },
  { href: '/ai-diagnosis', label: 'AI Diagnosis', icon: BotMessageSquare },
  { href: '/action-history', label: 'Action History', icon: History },
];

export const MOCK_SYSTEM_METRICS: SystemMetric[] = [
  { id: 'cpu', name: 'CPU Usage', value: 0, unit: '%', maxValue: 100, description: 'Overall CPU utilization' },
  { id: 'memory', name: 'Memory Usage', value: 0, unit: 'GB', maxValue: 16, description: 'Total memory consumed' },
  { id: 'disk', name: 'Disk Space', value: 0, unit: 'GB', maxValue: 500, description: 'Used disk space on /' },
];

export const MOCK_SERVICE_STATUS: ServiceStatus[] = [
  { id: 'nginx', name: 'Nginx Web Server', status: 'Running', details: 'Serving web traffic on port 80/443' },
  { id: 'mysql', name: 'MySQL Database', status: 'Running', details: 'Accepting connections on port 3306' },
  { id: 'redis', name: 'Redis Cache', status: 'Stopped', details: 'Service not active' },
  { id: 'firewall', name: 'Firewall (UFW)', status: 'Running', details: 'Firewall active and protecting the system' },
];

export const MOCK_RECENT_LOGS: LogEntry[] = [
  { id: 'log1', timestamp: new Date(Date.now() - 60000).toISOString(), level: 'INFO', message: 'User admin logged in from 192.168.1.100' },
  { id: 'log2', timestamp: new Date(Date.now() - 120000).toISOString(), level: 'WARN', message: 'High CPU usage detected on process 1234 (nginx)' },
  { id: 'log3', timestamp: new Date(Date.now() - 180000).toISOString(), level: 'ERROR', message: 'Failed to connect to database: Connection timed out' },
  { id: 'log4', timestamp: new Date(Date.now() - 240000).toISOString(), level: 'INFO', message: 'System backup completed successfully.' },
  { id: 'log5', timestamp: new Date(Date.now() - 300000).toISOString(), level: 'DEBUG', message: 'API request to /health processed in 50ms' },
];

export const MOCK_ALERTS: SystemAlert[] = [
  { id: 'alert1', severity: 'Critical', message: 'Disk space on /var is above 90%!', timestamp: new Date(Date.now() - 5 * 60000).toISOString() },
  { id: 'alert2', severity: 'Warning', message: 'Unusual login activity detected from IP 10.0.5.12', timestamp: new Date(Date.now() - 15 * 60000).toISOString() },
];

export const MOCK_ACTION_HISTORY_INITIAL_STATE: ActionRecord[] = [
   { id: 'action1', timestamp: new Date(Date.now() - 2 * 60 * 60000).toISOString(), action: 'Restart Nginx service', user: 'AI Suggested', status: 'Executed (Simulated)', details: 'Nginx was restarted due to high error rate.' },
   { id: 'action2', timestamp: new Date(Date.now() - 1 * 60 * 60000).toISOString(), action: 'Block IP 203.0.113.45', user: 'Admin', status: 'Approved', details: 'IP blocked due to suspicious activity.' },
];

export const MOCK_SYSTEM_STATUS_FOR_AI = `CPU: 75%, Memory: 8.2/16 GB, Disk /: 450/500 GB
Services: Nginx (Running), MySQL (Error - Out of Memory), Redis (Stopped)
Key Metrics: High I/O wait times, numerous MySQL connection errors.`;

export const MOCK_RECENT_LOGS_FOR_AI = `
[ERROR] mysql: Out of memory error when allocating 1024 bytes
[WARN] nginx: worker process 1234 exited unexpectedly
[INFO] systemd: Starting MySQL server...
[ERROR] mysql: Failed to start.
[INFO] ufw: Deny IN=eth0 OUT= MAC=... SRC=1.2.3.4 DST=... LEN=40 TOS=0x00 PREC=0x00 TTL=245 ID=0 DF PROTO=TCP SPT=58888 DPT=22 WINDOW=1024 RES=0x00 SYN URGP=0
`;
