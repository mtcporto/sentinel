// src/components/dashboard/SystemConsolidatedWidget.tsx
"use client";

import React, { memo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useRealTimeMetrics } from '@/hooks/use-real-time-metrics';
import { useRealTimeSystemOverview } from '@/hooks/use-real-time-system-overview';
import { 
  Server, 
  Loader2,
  AlertTriangle,
  Activity,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Cpu,
  HardDrive,
  MemoryStick,
  Info
} from 'lucide-react';

// Component for individual metric with expandable details
const MetricWithDetails = memo(({ 
  metric, 
  icon: Icon, 
  color,
  details,
  title,
  unit = '%'
}: {
  metric: any;
  icon: any;
  color: string;
  details?: React.ReactNode;
  title: string;
  unit?: string;
}) => {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  return (
    <div className="space-y-2">
      {/* Main Metric Display */}
      <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors">
        <Icon className={`h-8 w-8 ${color}`} />
        <div className="flex-1">
          <div className="text-sm font-medium">{title}</div>
          <div className="text-2xl font-bold">
            {metric ? `${metric.value}${unit}` : 'N/A'}
          </div>
          {metric && metric.maxValue && (
            <div className="text-xs text-muted-foreground">
              de {metric.maxValue}{unit}
            </div>
          )}
        </div>
        {details && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setIsDetailsOpen(!isDetailsOpen)}
            className="h-8 w-8 p-0"
          >
            {isDetailsOpen ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>
      
      {/* Expandable Details */}
      {details && (
        <Collapsible open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <CollapsibleContent className="space-y-2 animate-in slide-in-from-top-1 pl-4">
            <div className="p-3 rounded-lg bg-muted/30 border-l-2 border-primary/20">
              {details}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
});

MetricWithDetails.displayName = 'MetricWithDetails';

export const SystemConsolidatedWidget = memo(() => {
  const [isTechnicalDetailsOpen, setIsTechnicalDetailsOpen] = useState(false);
  
  // Hooks for basic metrics
  const {
    metrics,
    isLoading: metricsLoading,
    error: metricsError,
    lastUpdate: metricsLastUpdate,
    refresh: refreshMetrics
  } = useRealTimeMetrics({
    refreshInterval: 5000,
    enableOptimisticUpdates: true
  });

  // Hooks for detailed information
  const { 
    systemInfo, 
    isLoading: systemLoading, 
    error: systemError, 
    lastUpdate: systemLastUpdate, 
    updates, 
    refresh: refreshSystem,
    clearUpdates 
  } = useRealTimeSystemOverview({
    refreshInterval: 20000,
    enableAutoRefresh: true
  });

  const isLoading = metricsLoading || systemLoading;
  const error = metricsError || systemError;
  const lastUpdate = metricsLastUpdate || systemLastUpdate;

  const handleRefresh = async () => {
    await Promise.all([refreshMetrics(), refreshSystem()]);
    setTimeout(clearUpdates, 5000);
  };

  // Extract specific metrics for quick display
  const cpuMetric = metrics.find(m => m.id.includes('cpu') || m.name.toLowerCase().includes('cpu'));
  const memoryMetric = metrics.find(m => m.id.includes('memory') || m.name.toLowerCase().includes('memory'));
  const diskMetric = metrics.find(m => m.id.includes('disk') || m.name.toLowerCase().includes('disk'));

  const criticalUpdates = updates.filter(u => u.severity === 'critical').length;
  const warningUpdates = updates.filter(u => u.severity === 'warning').length;
  const hasRecentUpdates = updates.length > 0;

  const formatLastUpdate = (date: Date | null) => {
    if (!date) return '';
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    return date.toLocaleTimeString();
  };

  // CPU Details Component
  const cpuDetails = systemInfo && (
    <div className="space-y-3">
      <div className="text-sm font-medium">Load Average</div>
      <div className="grid grid-cols-3 gap-4 text-sm">
        <div>
          <span className="text-muted-foreground">1min:</span>
          <div className="font-mono">{systemInfo.loadNumbers?.load1?.toFixed(2) || 'N/A'}</div>
        </div>
        <div>
          <span className="text-muted-foreground">5min:</span>
          <div className="font-mono">{systemInfo.loadNumbers?.load5?.toFixed(2) || 'N/A'}</div>
        </div>
        <div>
          <span className="text-muted-foreground">15min:</span>
          <div className="font-mono">{systemInfo.loadNumbers?.load15?.toFixed(2) || 'N/A'}</div>
        </div>
      </div>
      {systemInfo.cpuCores && (
        <div className="text-xs text-muted-foreground">
          CPU Cores: {systemInfo.cpuCores}
        </div>
      )}
    </div>
  );

  // Memory Details Component
  const memoryDetails = systemInfo && (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-muted-foreground">Total:</span>
          <div className="font-mono">{systemInfo.memoryDetails?.total || 'N/A'}</div>
        </div>
        <div>
          <span className="text-muted-foreground">Usado:</span>
          <div className="font-mono">{systemInfo.memoryDetails?.used || 'N/A'}</div>
        </div>
        <div>
          <span className="text-muted-foreground">Livre:</span>
          <div className="font-mono">{systemInfo.memoryDetails?.free || 'N/A'}</div>
        </div>
        <div>
          <span className="text-muted-foreground">Disponível:</span>
          <div className="font-mono">{systemInfo.memoryDetails?.available || 'N/A'}</div>
        </div>
      </div>
      <div className="text-xs text-muted-foreground">
        Uso: {systemInfo.memoryDetails?.percentage || 0}%
      </div>
    </div>
  );

  // Disk Details Component
  const diskDetails = systemInfo && systemInfo.diskUsage && systemInfo.diskUsage.length > 0 && (
    <div className="space-y-3">
      <div className="text-sm font-medium">Filesystems</div>
      <div className="space-y-2">
        {systemInfo.diskUsage.map((fs: any, index: number) => (
          <div key={index} className="p-2 rounded bg-muted/30 text-sm">
            <div className="font-medium">{fs.filesystem}</div>
            <div className="grid grid-cols-2 gap-2 mt-1 text-xs">
              <div>
                <span className="text-muted-foreground">Usado:</span>
                <div className="font-mono">{fs.used}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Disponível:</span>
                <div className="font-mono">{fs.available}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Uso:</span>
                <div className="font-mono">{fs.percentage}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Uso (num):</span>
                <div className="font-mono">{fs.percentageNum}%</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  if (isLoading && !metrics.length && !systemInfo) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Server className="h-5 w-5 text-primary" />
            Sistema - Visão Consolidada
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-40">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-2">Carregando informações do sistema...</p>
        </CardContent>
      </Card>
    );
  }

  if (error && !metrics.length && !systemInfo) {
    return (
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xl flex items-center gap-2">
            <Server className="h-5 w-5 text-primary" />
            Sistema - Visão Consolidada
          </CardTitle>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="text-xl flex items-center gap-2">
            <Server className="h-5 w-5 text-primary" />
            Sistema - Visão Consolidada
            {hasRecentUpdates && (
              <Activity className="h-4 w-4 text-primary animate-pulse" />
            )}
          </CardTitle>
          <div className="flex items-center gap-2 mt-1">
            {criticalUpdates > 0 && (
              <Badge variant="destructive" className="text-xs">
                {criticalUpdates} crítico{criticalUpdates > 1 ? 's' : ''}
              </Badge>
            )}
            {warningUpdates > 0 && (
              <Badge variant="secondary" className="text-xs">
                {warningUpdates} aviso{warningUpdates > 1 ? 's' : ''}
              </Badge>
            )}
            {lastUpdate && (
              <span className="text-xs text-muted-foreground">
                • Atualizado {formatLastUpdate(lastUpdate)}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Quick Metrics with Expandable Details */}
        <div className="space-y-4">
          {/* CPU with Load Average Details */}
          <MetricWithDetails
            metric={cpuMetric}
            icon={Cpu}
            color="text-blue-500"
            title="CPU"
            details={cpuDetails}
          />

          {/* Memory with Memory Details */}
          <MetricWithDetails
            metric={memoryMetric}
            icon={MemoryStick}
            color="text-green-500"
            title="Memória"
            details={memoryDetails}
          />

          {/* Disk with Filesystem Details */}
          <MetricWithDetails
            metric={diskMetric}
            icon={HardDrive}
            color="text-orange-500"
            title="Disco"
            details={diskDetails}
          />
        </div>

        <Separator />

        {/* General Information - Enhanced */}
        {systemInfo && (
          <div className="p-4 rounded-lg bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20">
            <h4 className="text-lg font-semibold mb-4 flex items-center gap-2 text-primary">
              <Info className="h-5 w-5" />
              Informações Gerais do Sistema
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Hostname</span>
                <div className="text-sm font-bold text-foreground bg-background/50 px-2 py-1 rounded">
                  {systemInfo.hostname || 'Unknown'}
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Sistema Operacional</span>
                <div className="text-sm font-bold text-foreground bg-background/50 px-2 py-1 rounded">
                  {systemInfo.distro || 'Unknown'}
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Tempo de Atividade</span>
                <div className="text-sm font-bold text-foreground bg-background/50 px-2 py-1 rounded">
                  {systemInfo.uptime || 'Unknown'}
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Usuários Ativos</span>
                <div className="text-sm font-bold text-foreground bg-background/50 px-2 py-1 rounded">
                  {systemInfo.activeUsers || 0}
                </div>
              </div>
            </div>
          </div>
        )}

        <Separator />

        {/* Technical Details - Expandable */}
        <Collapsible open={isTechnicalDetailsOpen} onOpenChange={setIsTechnicalDetailsOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between">
              <span className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Processos e Detalhes Avançados
              </span>
              {isTechnicalDetailsOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          
          <CollapsibleContent className="space-y-4 pt-4">
            {/* Top Processes */}
            {systemInfo?.topProcesses && systemInfo.topProcesses.length > 0 && (
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Top Processos por CPU
                </h4>
                <div className="space-y-2">
                  {systemInfo.topProcesses.slice(0, 5).map((process: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border text-sm">
                      <div className="flex-1 truncate">
                        <div className="font-medium">{process.name}</div>
                        <div className="text-xs text-muted-foreground">PID: {process.pid}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-sm font-bold">{process.cpu}%</div>
                        <div className="text-xs text-muted-foreground">{process.memory}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
});

SystemConsolidatedWidget.displayName = 'SystemConsolidatedWidget';

export default SystemConsolidatedWidget;
