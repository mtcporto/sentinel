// src/components/dashboard/SystemMetricsWidget.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { SystemMetric } from '@/types';
import { MOCK_SYSTEM_METRICS } from '@/lib/consts';
import { Cpu, HardDrive, MemoryStick } from 'lucide-react';

const ICON_MAP: Record<string, React.ElementType> = {
  cpu: Cpu,
  memory: MemoryStick,
  disk: HardDrive,
};

export function SystemMetricsWidget() {
  const [metrics, setMetrics] = useState<SystemMetric[]>(MOCK_SYSTEM_METRICS);

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prevMetrics =>
        prevMetrics.map(metric => {
          let newValue = metric.value + (Math.random() * 10 - 5);
          if (metric.maxValue) {
            newValue = Math.max(0, Math.min(newValue, metric.maxValue));
          } else {
             newValue = Math.max(0, newValue);
          }
          return { ...metric, value: parseFloat(newValue.toFixed(1)) };
        })
      );
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl">System Metrics</CardTitle>
        <CardDescription>Real-time overview of key system resources.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6">
        {metrics.map((metric) => {
          const IconComponent = ICON_MAP[metric.id] || Cpu;
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
