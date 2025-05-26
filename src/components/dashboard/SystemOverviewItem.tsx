// src/components/dashboard/SystemOverviewItem.tsx
"use client";

import React, { memo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Server, 
  Clock, 
  HardDrive, 
  Network, 
  Cpu, 
  MemoryStick,
  Users,
  Activity,
  Zap,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';
import type { SystemInfo, SystemOverviewUpdate } from '@/hooks/use-real-time-system-overview';

interface SystemOverviewItemProps {
  systemInfo: SystemInfo;
  updates?: SystemOverviewUpdate[];
  className?: string;
}

const getUpdateIcon = (update: SystemOverviewUpdate) => {
  if (update.previousValue < update.newValue) {
    return <TrendingUp className="h-3 w-3 text-red-500" />;
  } else if (update.previousValue > update.newValue) {
    return <TrendingDown className="h-3 w-3 text-green-500" />;
  }
  return <Minus className="h-3 w-3 text-muted-foreground" />;
};

const getSeverityColor = (severity: SystemOverviewUpdate['severity']) => {
  switch (severity) {
    case 'critical': return 'text-red-500 bg-red-50 border-red-200';
    case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    default: return 'text-blue-500 bg-blue-50 border-blue-200';
  }
};

// Basic Info Section
export const BasicInfoSection = memo<{ systemInfo: SystemInfo; updates: SystemOverviewUpdate[] }>(({ 
  systemInfo, 
  updates 
}) => {
  const recentUpdates = updates.filter(u => u.section === 'basic' && 
    Date.now() - u.timestamp.getTime() < 30000);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Server className="h-4 w-4 text-blue-500" />
          <span className="font-medium">Hostname:</span>
          <Badge variant="secondary">{systemInfo.hostname}</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Cpu className="h-4 w-4 text-green-500" />
          <span className="font-medium">Kernel:</span>
          <span className="text-sm text-muted-foreground">{systemInfo.kernel}</span>
        </div>
        <div className="flex items-center gap-2">
          <HardDrive className="h-4 w-4 text-purple-500" />
          <span className="font-medium">SO:</span>
          <span className="text-sm text-muted-foreground">{systemInfo.distro}</span>
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-orange-500" />
          <span className="font-medium">Uptime:</span>
          <Badge variant="outline">{systemInfo.uptime}</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-indigo-500" />
          <span className="font-medium">Usuários ativos:</span>
          <Badge variant="secondary">{systemInfo.activeUsers}</Badge>
          {recentUpdates.find(u => u.field === 'activeUsers') && (
            <div className="flex items-center gap-1 text-xs text-primary">
              {getUpdateIcon(recentUpdates.find(u => u.field === 'activeUsers')!)}
              <span>Changed</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Network className="h-4 w-4 text-cyan-500" />
          <span className="font-medium">Conexões:</span>
          <Badge variant="secondary">{systemInfo.networkConnections}</Badge>
          {recentUpdates.find(u => u.section === 'network') && (
            <div className="flex items-center gap-1 text-xs text-primary">
              <Activity className="h-3 w-3 animate-pulse" />
              <span>Updated</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

// Load Average Section
export const LoadAverageSection = memo<{ systemInfo: SystemInfo; updates: SystemOverviewUpdate[] }>(({ 
  systemInfo, 
  updates 
}) => {
  const loadUpdates = updates.filter(u => u.section === 'load' && 
    Date.now() - u.timestamp.getTime() < 30000);
  
  const hasLoadChanges = loadUpdates.length > 0;

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Activity className={`h-4 w-4 text-yellow-500 ${hasLoadChanges ? 'animate-pulse' : ''}`} />
        <span className="font-medium">Carga do Sistema</span>
        <Badge variant="secondary">{systemInfo.cpuCores} cores</Badge>
        {hasLoadChanges && (
          <div className="flex items-center gap-1 text-xs text-primary">
            <Activity className="h-3 w-3 animate-pulse" />
            <span>Load changed</span>
          </div>
        )}
      </div>
      <div className="grid grid-cols-3 gap-4 text-sm">
        <div className={`transition-all duration-300 ${
          loadUpdates.find(u => u.field === 'load1') ? 'ring-2 ring-primary/20 rounded-md p-2' : ''
        }`}>
          <div className="flex justify-between mb-1">
            <span className="text-muted-foreground">1 min:</span>
            <span className="font-mono">{systemInfo.loadNumbers.load1.toFixed(2)}</span>
          </div>
          <Progress 
            value={Math.min((systemInfo.loadNumbers.load1 / systemInfo.cpuCores) * 100, 100)} 
            className="h-2"
          />
        </div>
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-muted-foreground">5 min:</span>
            <span className="font-mono">{systemInfo.loadNumbers.load5.toFixed(2)}</span>
          </div>
          <Progress 
            value={Math.min((systemInfo.loadNumbers.load5 / systemInfo.cpuCores) * 100, 100)} 
            className="h-2"
          />
        </div>
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-muted-foreground">15 min:</span>
            <span className="font-mono">{systemInfo.loadNumbers.load15.toFixed(2)}</span>
          </div>
          <Progress 
            value={Math.min((systemInfo.loadNumbers.load15 / systemInfo.cpuCores) * 100, 100)} 
            className="h-2"
          />
        </div>
      </div>
    </div>
  );
});

// Memory Section
export const MemorySection = memo<{ systemInfo: SystemInfo; updates: SystemOverviewUpdate[] }>(({ 
  systemInfo, 
  updates 
}) => {
  const memoryUpdates = updates.filter(u => u.section === 'memory' && 
    Date.now() - u.timestamp.getTime() < 30000);
  
  const hasMemoryChanges = memoryUpdates.length > 0;

  return (
    <div className={`transition-all duration-300 ${
      hasMemoryChanges ? 'ring-2 ring-primary/20 rounded-md p-3' : ''
    }`}>
      <div className="flex items-center gap-2 mb-3">
        <MemoryStick className={`h-4 w-4 text-blue-500 ${hasMemoryChanges ? 'animate-pulse' : ''}`} />
        <span className="font-medium">Memória</span>
        <Badge 
          variant={systemInfo.memoryDetails.percentage > 80 ? "destructive" : 
                  systemInfo.memoryDetails.percentage > 60 ? "default" : "secondary"}
        >
          {systemInfo.memoryDetails.percentage}%
        </Badge>
        {hasMemoryChanges && (
          <div className="flex items-center gap-1 text-xs text-primary">
            {getUpdateIcon(memoryUpdates[0])}
            <span>
              {memoryUpdates[0].previousValue}% → {memoryUpdates[0].newValue}%
            </span>
          </div>
        )}
      </div>
      <div className="mb-3">
        <Progress 
          value={systemInfo.memoryDetails.percentage} 
          className="h-3"
        />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
        <div>
          <span className="text-muted-foreground">Total:</span>
          <div className="font-mono">{systemInfo.memoryDetails.total}</div>
        </div>
        <div>
          <span className="text-muted-foreground">Usado:</span>
          <div className="font-mono">{systemInfo.memoryDetails.used}</div>
        </div>
        <div>
          <span className="text-muted-foreground">Livre:</span>
          <div className="font-mono">{systemInfo.memoryDetails.free}</div>
        </div>
        <div>
          <span className="text-muted-foreground">Disponível:</span>
          <div className="font-mono">{systemInfo.memoryDetails.available}</div>
        </div>
      </div>
    </div>
  );
});

// Disk Usage Section
export const DiskUsageSection = memo<{ systemInfo: SystemInfo; updates: SystemOverviewUpdate[] }>(({ 
  systemInfo, 
  updates 
}) => {
  const diskUpdates = updates.filter(u => u.section === 'disk' && 
    Date.now() - u.timestamp.getTime() < 30000);

  if (systemInfo.diskUsage.length === 0) return null;

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <HardDrive className="h-4 w-4 text-purple-500" />
        <span className="font-medium">Sistemas de Arquivos</span>
        {diskUpdates.length > 0 && (
          <div className="flex items-center gap-1 text-xs text-primary">
            <Activity className="h-3 w-3 animate-pulse" />
            <span>{diskUpdates.length} filesystem(s) changed</span>
          </div>
        )}
      </div>
      <div className="space-y-3">
        {systemInfo.diskUsage.map((disk, index) => {
          const diskUpdate = diskUpdates.find(u => u.field === disk.filesystem);
          const hasChange = !!diskUpdate;
          
          return (
            <div key={index} className={`space-y-2 transition-all duration-300 ${
              hasChange ? 'ring-2 ring-primary/20 rounded-md p-2' : ''
            }`}>
              <div className="flex items-center justify-between text-sm">
                <span className="font-mono text-xs">{disk.filesystem}</span>
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground">Usado: {disk.used}</span>
                  <span className="text-muted-foreground">Livre: {disk.available}</span>
                  <Badge 
                    variant={disk.percentageNum > 80 ? "destructive" : 
                            disk.percentageNum > 60 ? "default" : "secondary"}
                    className="min-w-[3rem] justify-center"
                  >
                    {disk.percentage}
                  </Badge>
                  {hasChange && (
                    <div className="flex items-center gap-1 text-xs text-primary">
                      {getUpdateIcon(diskUpdate)}
                      <span>{diskUpdate.previousValue}% → {diskUpdate.newValue}%</span>
                    </div>
                  )}
                </div>
              </div>
              <Progress 
                value={disk.percentageNum} 
                className="h-2"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
});

// Top Processes Section
export const TopProcessesSection = memo<{ systemInfo: SystemInfo; updates: SystemOverviewUpdate[] }>(({ 
  systemInfo, 
  updates 
}) => {
  const processUpdates = updates.filter(u => u.section === 'processes' && 
    Date.now() - u.timestamp.getTime() < 30000);

  if (systemInfo.topProcesses.length === 0) return null;

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Zap className="h-4 w-4 text-red-500" />
        <span className="font-medium">Processos com Maior CPU</span>
        {processUpdates.length > 0 && (
          <div className="flex items-center gap-1 text-xs text-primary">
            <Activity className="h-3 w-3 animate-pulse" />
            <span>Process activity</span>
          </div>
        )}
      </div>
      <div className="space-y-2">
        {systemInfo.topProcesses.map((process, index) => {
          const cpuPercent = parseFloat(process.cpu) || 0;
          const getCpuColor = (cpu: number) => {
            if (cpu >= 50) return "destructive";
            if (cpu >= 20) return "default";
            return "secondary";
          };
          
          return (
            <div key={index} className="flex items-center justify-between text-xs p-2 rounded-md bg-muted/50">
              <div className="flex items-center gap-2">
                <Badge variant={getCpuColor(cpuPercent)} className="text-xs min-w-[3rem] justify-center">
                  {process.cpu}%
                </Badge>
                <span className="font-mono text-muted-foreground">PID:{process.pid}</span>
                <span className="text-muted-foreground">{process.user}</span>
                <Badge variant="outline" className="text-xs">
                  {process.mem}% RAM
                </Badge>
              </div>
              <span className="font-mono text-xs truncate max-w-[200px]">{process.command}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
});

BasicInfoSection.displayName = 'BasicInfoSection';
LoadAverageSection.displayName = 'LoadAverageSection';
MemorySection.displayName = 'MemorySection';
DiskUsageSection.displayName = 'DiskUsageSection';
TopProcessesSection.displayName = 'TopProcessesSection';
