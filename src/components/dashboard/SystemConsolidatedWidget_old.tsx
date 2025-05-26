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
import { MetricItem } from './MetricItem';
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
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Cpu,
  HardDrive,
  MemoryStick,
  Info
} from 'lucide-react';

// Componente para métrica individual com detalhes expansíveis
const MetricWithDetails = memo(({ 
  metric, 
  icon: Icon, 
  color,
  details,
  title
}: {
  metric: any;
  icon: any;
  color: string;
  details?: React.ReactNode;
  title: string;
}) => {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  return (
    <div className="space-y-2">
      <MetricItem
        title={title}
        value={metric.value}
        icon={Icon}
        color={color}
        className="transition-all hover:shadow-sm"
      />
      
      {details && (
        <Collapsible open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <CollapsibleTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full justify-between text-xs h-6 p-1"
            >
              <span>Detalhes</span>
              {isDetailsOpen ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2 animate-in slide-in-from-top-1">
            {details}
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
});

MetricWithDetails.displayName = 'MetricWithDetails';

export const SystemConsolidatedWidget = memo(() => {
  const [isTechnicalDetailsOpen, setIsTechnicalDetailsOpen] = useState(false);
  
  // Hooks para métricas básicas
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

  // Hooks para informações detalhadas
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

  // Extrair métricas específicas para display rápido
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

      <CardContent className="space-y-4">
        {/* Métricas Rápidas - Sempre Visíveis */}
        <div className="grid grid-cols-3 gap-4">
          {/* CPU */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <Cpu className="h-8 w-8 text-blue-500" />
            <div>
              <div className="text-sm font-medium">CPU</div>
              <div className="text-lg font-bold">
                {cpuMetric ? `${cpuMetric.value}%` : 'N/A'}
              </div>
              {cpuMetric && (
                <div className="text-xs text-muted-foreground">
                  de {cpuMetric.maxValue || 100}%
                </div>
              )}
            </div>
          </div>

          {/* Memória */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <MemoryStick className="h-8 w-8 text-green-500" />
            <div>
              <div className="text-sm font-medium">Memória</div>
              <div className="text-lg font-bold">
                {memoryMetric ? `${memoryMetric.value}%` : 'N/A'}
              </div>
              {memoryMetric && (
                <div className="text-xs text-muted-foreground">
                  de {memoryMetric.maxValue || 100}%
                </div>
              )}
            </div>
          </div>

          {/* Disco */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <HardDrive className="h-8 w-8 text-orange-500" />
            <div>
              <div className="text-sm font-medium">Disco</div>
              <div className="text-lg font-bold">
                {diskMetric ? `${diskMetric.value}%` : 'N/A'}
              </div>
              {diskMetric && (
                <div className="text-xs text-muted-foreground">
                  de {diskMetric.maxValue || 100}%
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Informações Básicas - Sempre Visíveis */}
        {systemInfo && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Hostname:</span>
              <div className="font-medium">{systemInfo.hostname || 'Unknown'}</div>
            </div>
            <div>
              <span className="text-muted-foreground">SO:</span>
              <div className="font-medium">{systemInfo.distro || 'Unknown'}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Uptime:</span>
              <div className="font-medium">{systemInfo.uptime || 'Unknown'}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Usuários:</span>
              <div className="font-medium">{systemInfo.activeUsers || 0}</div>
            </div>
          </div>
        )}

        <Separator />

        {/* Seção Expandível com Detalhes */}
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between">
              <span>Detalhes do Sistema</span>
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          
          <CollapsibleContent className="space-y-6 pt-4">
            {/* Métricas Detalhadas */}
            {metrics.length > 0 && (
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Métricas Detalhadas
                </h4>
                <div className="grid gap-4">
                  {metrics.map((metric) => (
                    <MetricItem
                      key={metric.id}
                      metric={metric}
                      update={undefined}
                      className="animate-in fade-in-50 duration-300"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Informações Detalhadas do Sistema */}
            {systemInfo && (
              <>
                <Separator />
                
                {/* Informações Básicas */}
                <BasicInfoSection 
                  systemInfo={systemInfo} 
                  updates={updates}
                />
                
                <Separator />
                
                {/* Carga do Sistema */}
                <LoadAverageSection 
                  systemInfo={systemInfo} 
                  updates={updates}
                />
                
                <Separator />
                
                {/* Memória Detalhada */}
                <MemorySection 
                  systemInfo={systemInfo} 
                  updates={updates}
                />
                
                <Separator />
                
                {/* Discos */}
                <DiskUsageSection 
                  systemInfo={systemInfo} 
                  updates={updates}
                />

                {/* Top Processos */}
                {systemInfo.topProcesses && systemInfo.topProcesses.length > 0 && (
                  <>
                    <Separator />
                    <TopProcessesSection 
                      systemInfo={systemInfo} 
                      updates={updates}
                    />
                  </>
                )}
              </>
            )}
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
});

SystemConsolidatedWidget.displayName = 'SystemConsolidatedWidget';
