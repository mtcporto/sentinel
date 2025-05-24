// src/components/dashboard/SystemMetricsWidget.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { SystemMetric } from '@/types';
import { getSystemMetrics } from '@/lib/actions';
import { Cpu, HardDrive, MemoryStick, Loader2 } from 'lucide-react';

const ICON_MAP: Record<string, React.ElementType> = {
  cpu: Cpu,
  memory: MemoryStick,
  disk: HardDrive,
};

export function SystemMetricsWidget() {
  const [metrics, setMetrics] = useState<SystemMetric[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMetrics() {
      try {
        setIsLoading(true);
        setError(null);
        const fetchedMetrics = await getSystemMetrics();
        setMetrics(fetchedMetrics);
      } catch (err) {
        console.error("Failed to fetch system metrics:", err);
        setError("Could not load system metrics.");
      } finally {
        setIsLoading(false);
      }
    }
    fetchMetrics();
    // TODO: Consider adding a refresh interval if real-time updates are desired
    // const interval = setInterval(fetchMetrics, 5000); // e.g., every 5 seconds
    // return () => clearInterval(interval);
  }, []);

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
        <CardHeader>
          <CardTitle className="text-xl">System Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">{error}</p>
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
      <CardHeader>
        <CardTitle className="text-xl">System Metrics</CardTitle>
        <CardDescription>Real-time overview of key system resources.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6">
        {metrics.map((metric) => {
          const IconComponent = ICON_MAP[metric.id.toLowerCase()] || Cpu; // Ensure lowercase for matching
          const percentage = metric.maxValue ? (metric.value / metric.maxValue) * 100 : metric.value;
          return (
            <div key={metric.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <IconComponent className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">{metric.name}</span>
                </div>
                <span className="text-sm font-mono text-foreground">
                  {metric.value}{metric.unit} {metric.maxValue && `/ ${metric.maxValue}${metric.unit}`}
                </span>
              </div>
              <Progress value={percentage} aria-label={`${metric.name} at ${percentage.toFixed(0)}%`} className="h-3" />
              {metric.description && <p className="text-xs text-muted-foreground">{metric.description}</p>}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
