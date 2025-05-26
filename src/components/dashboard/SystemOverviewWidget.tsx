// src/components/dashboard/SystemOverviewWidget.tsx
"use client";

import React, { memo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useRealTimeSystemOverview } from '@/hooks/use-real-time-system-overview';
import {
  BasicInfoSection,
  LoadAverageSection,
  MemorySection,
  DiskUsageSection,
  TopProcessesSection
} from './SystemOverviewItem';
import { 
  Server, 
  Loader2,
  AlertTriangle,
  Activity,
  RefreshCw
} from 'lucide-react';

export const SystemOverviewWidget = memo(() => {
  const { 
    systemInfo, 
    isLoading, 
    error, 
    lastUpdate, 
    updates, 
    refresh, 
    clearUpdates 
  } = useRealTimeSystemOverview({
    refreshInterval: 20000, // 20 seconds
    enableAutoRefresh: true
  });

  const handleRefresh = async () => {
    await refresh();
    setTimeout(clearUpdates, 5000); // Clear visual indicators after 5 seconds
  };

  const criticalUpdates = updates.filter(u => u.severity === 'critical').length;
  const warningUpdates = updates.filter(u => u.severity === 'warning').length;
  const hasRecentUpdates = updates.length > 0;
  if (isLoading && !systemInfo) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Server className="h-5 w-5 text-primary" />
            Visão Geral do Sistema
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-40">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-2">Coletando informações do sistema...</p>
        </CardContent>
      </Card>
    );
  }

  if (error && !systemInfo) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Server className="h-5 w-5 text-primary" />
            Visão Geral do Sistema
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-40">
          <AlertTriangle className="h-8 w-8 text-destructive" />
          <p className="ml-2 text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!systemInfo) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Server className="h-5 w-5 text-primary" />
            Visão Geral do Sistema
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-40">
          <p className="text-muted-foreground">No system data available</p>
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
              <Server className="h-5 w-5 text-primary" />
              Visão Geral do Sistema
              {hasRecentUpdates && (
                <Activity className="h-4 w-4 text-primary animate-pulse" />
              )}
            </CardTitle>
            <div className="text-sm text-muted-foreground mt-1">
              {criticalUpdates > 0 && (
                <span className="text-red-600 font-medium">
                  {criticalUpdates} critical alert{criticalUpdates > 1 ? 's' : ''}
                </span>
              )}
              {warningUpdates > 0 && (
                <span className={`text-yellow-600 font-medium ${criticalUpdates > 0 ? 'ml-2' : ''}`}>
                  {warningUpdates} warning{warningUpdates > 1 ? 's' : ''}
                </span>
              )}
              {lastUpdate && (
                <span className="ml-2">
                  • Updated {lastUpdate.toLocaleTimeString()}
                </span>
              )}
            </div>
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
      <CardContent className="space-y-6">
        
        {/* Informações Básicas */}
        <BasicInfoSection systemInfo={systemInfo} updates={updates} />

        <Separator />

        {/* Load Average e CPU */}
        <LoadAverageSection systemInfo={systemInfo} updates={updates} />

        <Separator />

        {/* Memória */}
        <MemorySection systemInfo={systemInfo} updates={updates} />

        <Separator />

        {/* Uso de Disco */}
        <DiskUsageSection systemInfo={systemInfo} updates={updates} />

        <Separator />

        {/* Top Processos */}
        <TopProcessesSection systemInfo={systemInfo} updates={updates} />

      </CardContent>
    </Card>
  );
});

SystemOverviewWidget.displayName = 'SystemOverviewWidget';
