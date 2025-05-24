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
   { id: 'action1', timestamp: new Date(Date.now() - 2 * 60 * 60000).toISOString(), action: 'Restart Nginx service', user: 'AI Suggested', status: 'Executed (Simulated)', details: 'Nginx was restarted due to high error rate. (Mocked initial state)' },
   { id: 'action2', timestamp: new Date(Date.now() - 1 * 60 * 60000).toISOString(), action: 'Block IP 203.0.113.45', user: 'Admin', status: 'Approved', details: 'IP blocked due to suspicious activity. (Mocked initial state)' },
];

// Default empty states for fetched data - used if server actions cannot retrieve real data.
// This encourages implementing the server actions rather than relying on hardcoded examples.
export const DEFAULT_SYSTEM_METRICS: SystemMetric[] = [];
export const DEFAULT_SERVICE_STATUS: ServiceStatus[] = [];
export const DEFAULT_RECENT_LOGS: LogEntry[] = [];
export const DEFAULT_ALERTS: SystemAlert[] = [];
