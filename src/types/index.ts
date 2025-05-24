export interface SystemMetric {
  id: string;
  name: string;
  value: number;
  unit?: string;
  maxValue?: number;
  description?: string;
}

export interface ServiceStatus {
  id: string;
  name: string;
  status: 'Running' | 'Stopped' | 'Error' | 'Pending';
  details?: string;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  message: string;
}

export interface SystemAlert {
  id: string;
  severity: 'Critical' | 'Warning' | 'Info';
  message: string;
  timestamp: string;
}

export interface ActionRecord {
  id: string;
  timestamp: string;
  action: string;
  user: string; // "System" or "AI Suggested"
  status: 'Pending Approval' | 'Approved' | 'Executed (Simulated)' | 'Failed (Simulated)';
  details?: string;
}
