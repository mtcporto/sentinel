// src/hooks/use-real-time-system-overview.ts
"use client";

import { useState, useCallback, useRef, useEffect } from 'react';
import { executeSystemCommand } from '@/lib/actions';

export interface SystemInfo {
  hostname: string;
  kernel: string;
  distro: string;
  uptime: string;
  loadAverage: string;
  loadNumbers: { load1: number; load5: number; load15: number };
  cpuCores: number;
  diskUsage: { filesystem: string; used: string; available: string; percentage: string; percentageNum: number }[];
  topProcesses: { user: string; pid: string; cpu: string; mem: string; command: string }[];
  networkConnections: number;
  activeUsers: number;
  memoryDetails: { total: string; used: string; free: string; available: string; percentage: number };
}

export interface SystemOverviewUpdate {
  section: 'basic' | 'load' | 'memory' | 'disk' | 'processes' | 'network';
  field?: string;
  previousValue?: any;
  newValue?: any;
  timestamp: Date;
  severity: 'info' | 'warning' | 'critical';
}

export interface SystemOverviewState {
  systemInfo: SystemInfo | null;
  isLoading: boolean;
  error: string | null;
  lastUpdate: Date | null;
  updates: SystemOverviewUpdate[];
}

export interface UseRealTimeSystemOverviewOptions {
  refreshInterval?: number;
  enableAutoRefresh?: boolean;
}

export const useRealTimeSystemOverview = (options: UseRealTimeSystemOverviewOptions = {}) => {
  const {
    refreshInterval = 20000, // 20 seconds for system overview
    enableAutoRefresh = true
  } = options;

  const [state, setState] = useState<SystemOverviewState>({
    systemInfo: null,
    isLoading: true,
    error: null,
    lastUpdate: null,
    updates: []
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const previousSystemInfoRef = useRef<SystemInfo | null>(null);
  const isInitialLoadRef = useRef(true);

  const fetchSystemInfo = useCallback(async (): Promise<SystemInfo> => {
    // Execute múltiplos comandos para coletar informações do sistema
    const [
      hostnameResult,
      kernelResult,
      distroResult,
      uptimeResult,
      loadResult,
      cpuCoresResult,
      diskResult,
      processResult,
      networkResult,
      usersResult,
      memoryResult
    ] = await Promise.allSettled([
      executeSystemCommand('hostname'),
      executeSystemCommand('uname -r'),
      executeSystemCommand('cat /etc/os-release | grep PRETTY_NAME | cut -d= -f2 | tr -d \'"\''),
      executeSystemCommand('uptime -p'),
      executeSystemCommand('uptime | awk -F\'load average:\' \'{ print $2 }\''),
      executeSystemCommand('nproc'),
      executeSystemCommand('df -h | grep -v tmpfs | grep -v udev'),
      executeSystemCommand('ps aux --sort=-%cpu | head -6 | tail -5'),
      executeSystemCommand('ss -tuln | wc -l'),
      executeSystemCommand('who | wc -l'),
      executeSystemCommand('free | grep Mem')
    ]);

    // Processar resultados
    const hostname = hostnameResult.status === 'fulfilled' && hostnameResult.value.success 
      ? hostnameResult.value.output?.trim() || 'Unknown' 
      : 'Unknown';

    const kernel = kernelResult.status === 'fulfilled' && kernelResult.value.success 
      ? kernelResult.value.output?.trim() || 'Unknown' 
      : 'Unknown';

    const distro = distroResult.status === 'fulfilled' && distroResult.value.success 
      ? distroResult.value.output?.trim() || 'Unknown' 
      : 'Unknown';

    const uptime = uptimeResult.status === 'fulfilled' && uptimeResult.value.success 
      ? uptimeResult.value.output?.trim().replace('up ', '') || 'Unknown' 
      : 'Unknown';

    const loadAverage = loadResult.status === 'fulfilled' && loadResult.value.success 
      ? loadResult.value.output?.trim() || 'Unknown' 
      : 'Unknown';

    // Processar números do load average
    const loadNumbers = { load1: 0, load5: 0, load15: 0 };
    if (loadAverage !== 'Unknown') {
      const loadParts = loadAverage.replace(/,/g, '').trim().split(/\s+/);
      if (loadParts.length >= 3) {
        loadNumbers.load1 = parseFloat(loadParts[0]) || 0;
        loadNumbers.load5 = parseFloat(loadParts[1]) || 0;
        loadNumbers.load15 = parseFloat(loadParts[2]) || 0;
      }
    }

    const cpuCores = cpuCoresResult.status === 'fulfilled' && cpuCoresResult.value.success 
      ? parseInt(cpuCoresResult.value.output?.trim() || '1') 
      : 1;

    // Processar uso de disco
    const diskUsage: SystemInfo['diskUsage'] = [];
    if (diskResult.status === 'fulfilled' && diskResult.value.success && diskResult.value.output) {
      const diskLines = diskResult.value.output.trim().split('\n').slice(1); // Remove header
      diskLines.forEach(line => {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 6) {
          const percentage = parts[4];
          const percentageNum = parseInt(percentage.replace('%', '')) || 0;
          diskUsage.push({
            filesystem: parts[0],
            used: parts[2],
            available: parts[3],
            percentage,
            percentageNum
          });
        }
      });
    }

    // Processar processos top
    const topProcesses: SystemInfo['topProcesses'] = [];
    if (processResult.status === 'fulfilled' && processResult.value.success && processResult.value.output) {
      const processLines = processResult.value.output.trim().split('\n');
      processLines.forEach(line => {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 11) {
          topProcesses.push({
            user: parts[0],
            pid: parts[1],
            cpu: parts[2],
            mem: parts[3],
            command: parts.slice(10).join(' ').substring(0, 30) + '...'
          });
        }
      });
    }

    const networkConnections = networkResult.status === 'fulfilled' && networkResult.value.success 
      ? parseInt(networkResult.value.output?.trim() || '0') 
      : 0;

    const activeUsers = usersResult.status === 'fulfilled' && usersResult.value.success 
      ? parseInt(usersResult.value.output?.trim() || '0') 
      : 0;

    // Processar detalhes de memória
    let memoryDetails = { total: 'Unknown', used: 'Unknown', free: 'Unknown', available: 'Unknown', percentage: 0 };
    if (memoryResult.status === 'fulfilled' && memoryResult.value.success && memoryResult.value.output) {
      const memLine = memoryResult.value.output.trim();
      const parts = memLine.split(/\s+/);
      if (parts.length >= 3) {
        const totalKB = parseInt(parts[1]) || 0;
        const usedKB = parseInt(parts[2]) || 0;
        const availableKB = parseInt(parts[6]) || 0;
        const freeKB = parseInt(parts[3]) || 0;
        
        const totalGB = (totalKB / 1024 / 1024).toFixed(1);
        const usedGB = (usedKB / 1024 / 1024).toFixed(1);
        const availableGB = (availableKB / 1024 / 1024).toFixed(1);
        const freeGB = (freeKB / 1024 / 1024).toFixed(1);
        const percentage = totalKB > 0 ? Math.round((usedKB / totalKB) * 100) : 0;
        
        memoryDetails = {
          total: `${totalGB}GB`,
          used: `${usedGB}GB`,
          free: `${freeGB}GB`,
          available: `${availableGB}GB`,
          percentage
        };
      }
    }

    return {
      hostname,
      kernel,
      distro,
      uptime,
      loadAverage,
      loadNumbers,
      cpuCores,
      diskUsage,
      topProcesses,
      networkConnections,
      activeUsers,
      memoryDetails
    };
  }, []);

  const detectChanges = useCallback((prev: SystemInfo, current: SystemInfo): SystemOverviewUpdate[] => {
    const updates: SystemOverviewUpdate[] = [];
    const now = new Date();

    // Check load average changes
    if (prev.loadNumbers.load1 !== current.loadNumbers.load1) {
      const severity = current.loadNumbers.load1 > current.cpuCores ? 'critical' : 
                     current.loadNumbers.load1 > current.cpuCores * 0.8 ? 'warning' : 'info';
      updates.push({
        section: 'load',
        field: 'load1',
        previousValue: prev.loadNumbers.load1,
        newValue: current.loadNumbers.load1,
        timestamp: now,
        severity
      });
    }

    // Check memory changes
    if (prev.memoryDetails.percentage !== current.memoryDetails.percentage) {
      const severity = current.memoryDetails.percentage > 85 ? 'critical' : 
                     current.memoryDetails.percentage > 70 ? 'warning' : 'info';
      updates.push({
        section: 'memory',
        field: 'percentage',
        previousValue: prev.memoryDetails.percentage,
        newValue: current.memoryDetails.percentage,
        timestamp: now,
        severity
      });
    }

    // Check disk usage changes
    current.diskUsage.forEach((currentDisk, index) => {
      const prevDisk = prev.diskUsage[index];
      if (prevDisk && prevDisk.percentageNum !== currentDisk.percentageNum) {
        const severity = currentDisk.percentageNum > 85 ? 'critical' : 
                       currentDisk.percentageNum > 70 ? 'warning' : 'info';
        updates.push({
          section: 'disk',
          field: currentDisk.filesystem,
          previousValue: prevDisk.percentageNum,
          newValue: currentDisk.percentageNum,
          timestamp: now,
          severity
        });
      }
    });

    // Check network connections change
    if (Math.abs(prev.networkConnections - current.networkConnections) > 10) {
      updates.push({
        section: 'network',
        field: 'connections',
        previousValue: prev.networkConnections,
        newValue: current.networkConnections,
        timestamp: now,
        severity: 'info'
      });
    }

    // Check active users change
    if (prev.activeUsers !== current.activeUsers) {
      updates.push({
        section: 'basic',
        field: 'activeUsers',
        previousValue: prev.activeUsers,
        newValue: current.activeUsers,
        timestamp: now,
        severity: 'info'
      });
    }

    return updates;
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, error: null }));
      const newSystemInfo = await fetchSystemInfo();
      
      setState(prevState => {
        const updates: SystemOverviewUpdate[] = [];
        
        // Only detect changes after initial load
        if (!isInitialLoadRef.current && previousSystemInfoRef.current) {
          const detectedUpdates = detectChanges(previousSystemInfoRef.current, newSystemInfo);
          updates.push(...detectedUpdates);
        }

        // Store current state as previous for next comparison
        previousSystemInfoRef.current = prevState.systemInfo;
        isInitialLoadRef.current = false;

        return {
          systemInfo: newSystemInfo,
          isLoading: false,
          error: null,
          lastUpdate: new Date(),
          updates
        };
      });

    } catch (error) {
      console.error('Failed to fetch system overview data:', error);
      setState(prevState => ({
        ...prevState,
        isLoading: false,
        error: 'Erro ao coletar informações do sistema'
      }));
    }
  }, [fetchSystemInfo, detectChanges]);

  const startMonitoring = useCallback(() => {
    if (intervalRef.current || !enableAutoRefresh) return;
    
    fetchData(); // Initial fetch
    intervalRef.current = setInterval(fetchData, refreshInterval);
  }, [fetchData, refreshInterval, enableAutoRefresh]);

  const stopMonitoring = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const refresh = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    await fetchData();
  }, [fetchData]);

  const clearUpdates = useCallback(() => {
    setState(prev => ({
      ...prev,
      updates: []
    }));
  }, []);

  // Auto-start monitoring on mount
  useEffect(() => {
    startMonitoring();
    return () => stopMonitoring();
  }, [startMonitoring, stopMonitoring]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    ...state,
    refresh,
    startMonitoring,
    stopMonitoring,
    clearUpdates
  };
};
