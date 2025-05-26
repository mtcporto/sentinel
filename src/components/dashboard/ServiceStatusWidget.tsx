// src/components/dashboard/ServiceStatusWidget.tsx
"use client";

import React, { memo } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ServiceItem } from './ServiceItem';
import { useRealTimeServices } from '@/hooks/use-real-time-services';
import { RefreshCw, Loader2, Activity, AlertCircle } from 'lucide-react';

export const ServiceStatusWidget = memo(() => {
  const { 
    services, 
    isLoading, 
    error, 
    lastUpdate, 
    updates, 
    refresh, 
    clearUpdates 
  } = useRealTimeServices({
    refreshInterval: 10000, // 10 seconds
    enableAutoRefresh: true
  });

  const handleRefresh = async () => {
    await refresh();
    setTimeout(clearUpdates, 3000); // Clear visual indicators after 3 seconds
  };

  const runningServices = services.filter(s => s.status === 'Running').length;
  const totalServices = services.length;
  const hasIssues = services.some(s => s.status === 'Error');
  const hasRecentUpdates = updates.length > 0;

  if (isLoading && services.length === 0) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl">Service Status</CardTitle>
          <CardDescription>Current status of critical system services.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-40">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-2">Loading service statuses...</p>
        </CardContent>
      </Card>
    );
  }

  if (error && services.length === 0) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl">Service Status</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-40">
          <AlertCircle className="h-8 w-8 text-destructive mr-2" />
          <p className="text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }
  
  if (services.length === 0) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl">Service Status</CardTitle>
          <CardDescription>Current status of critical system services.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-40">
          <p className="text-muted-foreground">No service status data available. Please implement the `getServiceStatus` server action.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
              Service Status
              {hasRecentUpdates && (
                <Activity className="h-4 w-4 text-primary animate-pulse" />
              )}
            </CardTitle>
            <CardDescription>
              {runningServices}/{totalServices} services running
              {hasIssues && " • Issues detected"}
              {lastUpdate && (
                <span className="ml-2 text-xs">
                  • Updated {lastUpdate.toLocaleTimeString()}
                </span>
              )}
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {services.map((service) => (
            <ServiceItem
              key={service.id}
              service={service}
              updates={updates}
            />
          ))}
        </ul>
      </CardContent>
    </Card>
  );
});

ServiceStatusWidget.displayName = 'ServiceStatusWidget';
