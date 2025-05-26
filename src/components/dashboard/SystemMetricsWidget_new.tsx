// src/components/dashboard/SystemMetricsWidget.tsx
"use client";

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Loader2, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useRealTimeMetrics } from '@/hooks/use-real-time-metrics';
import { MetricItem } from './MetricItem';

export function SystemMetricsWidget() {
  const {
    metrics,
    isLoading,
    error,
    lastUpdate,
    updates,
    getMetricUpdate,
    refresh
  } = useRealTimeMetrics({
    refreshInterval: 5000, // 5 seconds
    enableOptimisticUpdates: true
  });

  const formatLastUpdate = (date: Date | null) => {
    if (!date) return '';
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    return date.toLocaleTimeString();
  };

  if (isLoading) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl">System Metrics</CardTitle>
          <CardDescription>Real-time overview of key system resources.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-40">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-2">Loading metrics...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-xl">System Metrics</CardTitle>
            <CardDescription>Real-time overview of key system resources.</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={refresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-destructive">
            <WifiOff className="h-5 w-5" />
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (metrics.length === 0) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl">System Metrics</CardTitle>
           <CardDescription>Real-time overview of key system resources. (No data available - implement server action)</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No system metrics data available. Please implement the `getSystemMetrics` server action to see live data.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-xl">System Metrics</CardTitle>
          <CardDescription>Real-time overview of key system resources.</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          {lastUpdate && (
            <div className="flex items-center gap-1">
              <Wifi className="h-4 w-4 text-green-500" />
              <Badge variant="secondary" className="text-xs">
                {formatLastUpdate(lastUpdate)}
              </Badge>
            </div>
          )}
          <Button variant="outline" size="sm" onClick={refresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="grid gap-6">
        {metrics.map((metric) => (
          <MetricItem
            key={metric.id}
            metric={metric}
            update={getMetricUpdate(metric.id)}
            className="animate-in fade-in-50 duration-300"
          />
        ))}
      </CardContent>
    </Card>
  );
}
