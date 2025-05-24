// src/components/dashboard/AlertsWidget.tsx
"use client";

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { AlertTriangle, Info, XCircle, LucideIcon } from 'lucide-react';
import type { SystemAlert } from '@/types';
import { MOCK_ALERTS } from '@/lib/consts';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

const getAlertIcon = (severity: SystemAlert['severity']): LucideIcon => {
  switch (severity) {
    case 'Critical':
      return XCircle;
    case 'Warning':
      return AlertTriangle;
    case 'Info':
      return Info;
    default:
      return Info;
  }
};

const getAlertColorClass = (severity: SystemAlert['severity']): string => {
  switch (severity) {
    case 'Critical':
      return 'border-destructive/50 text-destructive bg-destructive/10';
    case 'Warning':
      return 'border-yellow-500/50 text-yellow-500 bg-yellow-500/10';
    case 'Info':
      return 'border-blue-500/50 text-blue-500 bg-blue-500/10';
    default:
      return 'border-muted text-muted-foreground';
  }
};

export function AlertsWidget() {
  // In a real app, alerts would be dynamic. Here we use mock data.
  const alerts = MOCK_ALERTS;

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl">System Alerts</CardTitle>
        <CardDescription>Important notifications and warnings.</CardDescription>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No active alerts. System is stable.</p>
        ) : (
          <ul className="space-y-3">
            {alerts.map((alert) => {
              const IconComponent = getAlertIcon(alert.severity);
              return (
                <li 
                  key={alert.id} 
                  className={cn("flex items-start gap-3 p-3 rounded-md border", getAlertColorClass(alert.severity))}
                >
                  <IconComponent className="h-5 w-5 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">{alert.message}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true })}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
