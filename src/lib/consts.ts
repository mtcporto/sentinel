import type { NavItem } from '@/components/layout/AppSidebar';
import type { ActionRecord, SystemAlert, LogEntry, ServiceStatus, SystemMetric } from '@/types';
import { LayoutDashboard, FileText, History, BotMessageSquare } from 'lucide-react';

export const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/log-analysis', label: 'Log Analysis', icon: FileText },
  { href: '/ai-diagnosis', label: 'AI Diagnosis', icon: BotMessageSquare },
  { href: '/action-history', label: 'Action History', icon: History },
];

// Mock data for initial action history state.
// Other dynamic data will be fetched via server actions.
export const MOCK_ACTION_HISTORY_INITIAL_STATE: ActionRecord[] = [
   { id: 'action1', timestamp: new Date(Date.now() - 2 * 60 * 60000).toISOString(), action: 'Restart Nginx service', user: 'AI Suggested', status: 'Executed (Simulated)', details: 'Nginx was restarted due to high error rate.' },
   { id: 'action2', timestamp: new Date(Date.now() - 1 * 60 * 60000).toISOString(), action: 'Block IP 203.0.113.45', user: 'Admin', status: 'Approved', details: 'IP blocked due to suspicious activity.' },
];

// These are examples of what the AI diagnosis flow might expect.
// In a real scenario, this data would be dynamically generated from live system information.
export const EXAMPLE_SYSTEM_STATUS_FOR_AI = `CPU: 75%, Memory: 8.2/16 GB, Disk /: 450/500 GB
Services: Nginx (Running), MySQL (Error - Out of Memory), Redis (Stopped)
Key Metrics: High I/O wait times, numerous MySQL connection errors.`;

export const EXAMPLE_RECENT_LOGS_FOR_AI = `
[ERROR] mysql: Out of memory error when allocating 1024 bytes
[WARN] nginx: worker process 1234 exited unexpectedly
[INFO] systemd: Starting MySQL server...
[ERROR] mysql: Failed to start.
[INFO] ufw: Deny IN=eth0 OUT= MAC=... SRC=1.2.3.4 DST=... LEN=40 TOS=0x00 PREC=0x00 TTL=245 ID=0 DF PROTO=TCP SPT=58888 DPT=22 WINDOW=1024 RES=0x00 SYN URGP=0
`;

// Default empty states for fetched data
export const DEFAULT_SYSTEM_METRICS: SystemMetric[] = [];
export const DEFAULT_SERVICE_STATUS: ServiceStatus[] = [];
export const DEFAULT_RECENT_LOGS: LogEntry[] = [];
export const DEFAULT_ALERTS: SystemAlert[] = [];
