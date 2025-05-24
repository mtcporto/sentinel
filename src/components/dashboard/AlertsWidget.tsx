// src/components/dashboard/AlertsWidget.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { AlertTriangle, Info, XCircle, LucideIcon, Loader2 } from 'lucide-react';
import type { SystemAlert } from '@/types';
import { getSystemAlerts } from '@/lib/actions';
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

interface DisplayAlert extends SystemAlert {
  formattedTimestamp: string;
}

export function AlertsWidget() {
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [displayAlerts, setDisplayAlerts] = useState<DisplayAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAlerts() {
      try {
        setIsLoading(true);
        setError(null);
        const fetchedAlerts = await getSystemAlerts();
        setAlerts(fetchedAlerts);
      } catch (err) {
        console.error("Failed to fetch system alerts:", err);
        setError("Could not load system alerts.");
      } finally {
        setIsLoading(false);
      }
    }
    fetchAlerts();
  }, []);

  useEffect(() => {
    // Format timestamps on the client-side to avoid hydration mismatch
    if (alerts.length > 0) {
      setDisplayAlerts(
        alerts.map(alert => ({
          ...alert,
          formattedTimestamp: formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true })
        }))
      );
    } else {
      setDisplayAlerts([]);
    }
  }, [alerts]);

  if (isLoading) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl">System Alerts</CardTitle>
          <CardDescription>Important notifications and warnings.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-32">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-2">Loading alerts...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl">System Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl">System Alerts</CardTitle>
        <CardDescription>
          Important notifications and warnings.
           {displayAlerts.length === 0 && !isLoading && " (No data available - implement server action)"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {displayAlerts.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No active alerts. System appears stable.
            {!isLoading && " (Implement `getSystemAlerts` server action for live data)"}
          </p>
        ) : (
          <ul className="space-y-3">
            {displayAlerts.map((alert) => {
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
                      {alert.formattedTimestamp}
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
