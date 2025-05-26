// src/hooks/use-real-time-network-overview.ts
"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { executeSystemCommand } from '@/lib/actions';

export interface NetworkInterface {
  name: string;
  ip: string;
  status: string;
  type: 'ethernet' | 'wifi' | 'vpn' | 'docker' | 'loopback' | 'other';
  priority: number;
  rxBytes: number;
  txBytes: number;
  rxFormatted: string;
  txFormatted: string;
  isImportant: boolean;
}

export interface NetworkInfo {
  interfaces: NetworkInterface[];
  publicIP: string;
  vpnStatus: { connected: boolean; name?: string; ip?: string };
  internetConnected: boolean;
  dnsServers: string[];
  connectionCount: number;
  activeConnections: string[];
}

export interface NetworkUpdate {
  id: string;
  field: string;
  timestamp: Date;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  oldValue?: any;
  newValue?: any;
}

interface UseRealTimeNetworkOverviewOptions {
  refreshInterval?: number;
  enableAutoRefresh?: boolean;
}

export const useRealTimeNetworkOverview = (options: UseRealTimeNetworkOverviewOptions = {}) => {
  const {
    refreshInterval = 15000, // 15 seconds for network data
    enableAutoRefresh = true
  } = options;

  const [networkInfo, setNetworkInfo] = useState<NetworkInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [updates, setUpdates] = useState<NetworkUpdate[]>([]);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const previousDataRef = useRef<NetworkInfo | null>(null);

  // Utility functions
  const classifyInterface = (name: string): { type: NetworkInterface['type']; priority: number; isImportant: boolean } => {
    if (name === 'lo') return { type: 'loopback', priority: 10, isImportant: false };
    if (name.startsWith('enp') || name.startsWith('eth')) return { type: 'ethernet', priority: 1, isImportant: true };
    if (name.startsWith('wlp') || name.startsWith('wlan')) return { type: 'wifi', priority: 2, isImportant: true };
    if (name.startsWith('tun') || name.startsWith('tap')) return { type: 'vpn', priority: 3, isImportant: true };
    if (name.startsWith('docker')) return { type: 'docker', priority: 9, isImportant: false };
    return { type: 'other', priority: 8, isImportant: false };
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const detectChanges = (oldData: NetworkInfo | null, newData: NetworkInfo): NetworkUpdate[] => {
    if (!oldData) return [];
    
    const changes: NetworkUpdate[] = [];
    const timestamp = new Date();

    // Check public IP changes
    if (oldData.publicIP !== newData.publicIP) {
      changes.push({
        id: `publicip-${timestamp.getTime()}`,
        field: 'publicIP',
        timestamp,
        severity: newData.publicIP === 'N/A' ? 'critical' : 'warning',
        message: `Public IP changed from ${oldData.publicIP} to ${newData.publicIP}`,
        oldValue: oldData.publicIP,
        newValue: newData.publicIP
      });
    }

    // Check internet connectivity changes
    if (oldData.internetConnected !== newData.internetConnected) {
      changes.push({
        id: `internet-${timestamp.getTime()}`,
        field: 'internetConnected',
        timestamp,
        severity: newData.internetConnected ? 'info' : 'critical',
        message: `Internet connection ${newData.internetConnected ? 'restored' : 'lost'}`,
        oldValue: oldData.internetConnected,
        newValue: newData.internetConnected
      });
    }

    // Check VPN status changes
    if (oldData.vpnStatus.connected !== newData.vpnStatus.connected) {
      changes.push({
        id: `vpn-${timestamp.getTime()}`,
        field: 'vpnStatus',
        timestamp,
        severity: 'info',
        message: `VPN ${newData.vpnStatus.connected ? 'connected' : 'disconnected'}`,
        oldValue: oldData.vpnStatus.connected,
        newValue: newData.vpnStatus.connected
      });
    }

    // Check DNS server changes
    const oldDNS = oldData.dnsServers.sort().join(',');
    const newDNS = newData.dnsServers.sort().join(',');
    if (oldDNS !== newDNS) {
      changes.push({
        id: `dns-${timestamp.getTime()}`,
        field: 'dnsServers',
        timestamp,
        severity: 'warning',
        message: `DNS servers configuration changed`,
        oldValue: oldData.dnsServers,
        newValue: newData.dnsServers
      });
    }

    // Check interface changes
    oldData.interfaces.forEach(oldInterface => {
      const newInterface = newData.interfaces.find(i => i.name === oldInterface.name);
      if (!newInterface) {
        changes.push({
          id: `interface-removed-${oldInterface.name}-${timestamp.getTime()}`,
          field: 'interfaces',
          timestamp,
          severity: oldInterface.isImportant ? 'warning' : 'info',
          message: `Network interface ${oldInterface.name} removed`,
          oldValue: oldInterface,
          newValue: null
        });
      } else {
        // Check for IP changes
        if (oldInterface.ip !== newInterface.ip) {
          changes.push({
            id: `interface-ip-${oldInterface.name}-${timestamp.getTime()}`,
            field: 'interfaceIP',
            timestamp,
            severity: 'warning',
            message: `Interface ${oldInterface.name} IP changed from ${oldInterface.ip} to ${newInterface.ip}`,
            oldValue: oldInterface.ip,
            newValue: newInterface.ip
          });
        }

        // Check for significant bandwidth changes (>10% difference)
        const rxDiff = Math.abs(newInterface.rxBytes - oldInterface.rxBytes) / Math.max(oldInterface.rxBytes, 1);
        const txDiff = Math.abs(newInterface.txBytes - oldInterface.txBytes) / Math.max(oldInterface.txBytes, 1);
        
        if (rxDiff > 0.1 && newInterface.rxBytes > oldInterface.rxBytes) {
          changes.push({
            id: `interface-rx-${oldInterface.name}-${timestamp.getTime()}`,
            field: 'interfaceRX',
            timestamp,
            severity: 'info',
            message: `High download activity on ${oldInterface.name}: ${newInterface.rxFormatted}`,
            oldValue: oldInterface.rxBytes,
            newValue: newInterface.rxBytes
          });
        }

        if (txDiff > 0.1 && newInterface.txBytes > oldInterface.txBytes) {
          changes.push({
            id: `interface-tx-${oldInterface.name}-${timestamp.getTime()}`,
            field: 'interfaceTX',
            timestamp,
            severity: 'info',
            message: `High upload activity on ${oldInterface.name}: ${newInterface.txFormatted}`,
            oldValue: oldInterface.txBytes,
            newValue: newInterface.txBytes
          });
        }
      }
    });

    // Check for new interfaces
    newData.interfaces.forEach(newInterface => {
      const existed = oldData.interfaces.find(i => i.name === newInterface.name);
      if (!existed) {
        changes.push({
          id: `interface-added-${newInterface.name}-${timestamp.getTime()}`,
          field: 'interfaces',
          timestamp,
          severity: newInterface.isImportant ? 'info' : 'info',
          message: `New network interface ${newInterface.name} detected (${newInterface.ip})`,
          oldValue: null,
          newValue: newInterface
        });
      }
    });

    // Check connection count changes
    const connectionDiff = Math.abs(newData.connectionCount - oldData.connectionCount);
    if (connectionDiff > 10) { // Significant change in connection count
      changes.push({
        id: `connections-${timestamp.getTime()}`,
        field: 'connectionCount',
        timestamp,
        severity: newData.connectionCount > oldData.connectionCount + 50 ? 'warning' : 'info',
        message: `Network connections changed: ${oldData.connectionCount} → ${newData.connectionCount}`,
        oldValue: oldData.connectionCount,
        newValue: newData.connectionCount
      });
    }

    return changes;
  };

  const fetchNetworkInfo = useCallback(async (): Promise<NetworkInfo | null> => {
    try {
      const [
        interfacesResult,
        bandwidthResult,
        publicIPResult,
        dnsResult,
        vpnStatusResult,
        connectionsResult
      ] = await Promise.allSettled([
        executeSystemCommand('ip addr show | grep -E "^[0-9]+:|inet " | awk \'/^[0-9]+:/ {iface=$2} /inet / {print iface " " $2}\''),
        executeSystemCommand('cat /proc/net/dev | tail -n +3'),
        executeSystemCommand('curl -s --connect-timeout 5 https://ipinfo.io/ip || echo "N/A"'),
        executeSystemCommand('cat /etc/resolv.conf | grep nameserver | awk \'{print $2}\' | head -3'),
        executeSystemCommand('ps aux | grep -E "(openvpn|wireguard)" | grep -v grep | head -1'),
        executeSystemCommand('ss -tuln | wc -l')
      ]);

      // Process interfaces
      const interfaces: NetworkInterface[] = [];
      const bandwidthData: Record<string, { rx: number; tx: number }> = {};

      // Process bandwidth data first
      if (bandwidthResult.status === 'fulfilled' && bandwidthResult.value.success && bandwidthResult.value.output) {
        const lines = bandwidthResult.value.output.trim().split('\n');
        lines.forEach(line => {
          const parts = line.trim().split(/\s+/);
          if (parts.length >= 10) {
            const name = parts[0].replace(':', '');
            const rxBytes = parseInt(parts[1]) || 0;
            const txBytes = parseInt(parts[9]) || 0;
            bandwidthData[name] = { rx: rxBytes, tx: txBytes };
          }
        });
      }

      // Process interfaces
      if (interfacesResult.status === 'fulfilled' && interfacesResult.value.success && interfacesResult.value.output) {
        const lines = interfacesResult.value.output.trim().split('\n');
        lines.forEach(line => {
          const parts = line.trim().split(' ');
          if (parts.length >= 2) {
            const name = parts[0].replace(':', '');
            const ip = parts[1].split('/')[0];
            const { type, priority, isImportant } = classifyInterface(name);
            const bandwidth = bandwidthData[name] || { rx: 0, tx: 0 };
            
            interfaces.push({
              name,
              ip,
              status: 'UP',
              type,
              priority,
              rxBytes: bandwidth.rx,
              txBytes: bandwidth.tx,
              rxFormatted: formatBytes(bandwidth.rx),
              txFormatted: formatBytes(bandwidth.tx),
              isImportant
            });
          }
        });
      }

      // Sort interfaces by priority
      interfaces.sort((a, b) => a.priority - b.priority);

      // Check public IP and connectivity
      const publicIP = publicIPResult.status === 'fulfilled' && publicIPResult.value.success
        ? publicIPResult.value.output?.trim() || 'N/A'
        : 'N/A';
      
      const internetConnected = publicIP !== 'N/A' && /^\d+\.\d+\.\d+\.\d+$/.test(publicIP);

      // Check VPN status
      const vpnConnected = vpnStatusResult.status === 'fulfilled' && 
                          vpnStatusResult.value.success && 
                          vpnStatusResult.value.output && 
                          vpnStatusResult.value.output.trim().length > 0;
      
      const vpnInterface = interfaces.find(iface => iface.type === 'vpn');
      const vpnStatus = {
        connected: vpnConnected || !!vpnInterface,
        name: vpnInterface ? vpnInterface.name : undefined,
        ip: vpnInterface ? vpnInterface.ip : undefined
      };

      // Process DNS
      const dnsServers: string[] = [];
      if (dnsResult.status === 'fulfilled' && dnsResult.value.success && dnsResult.value.output) {
        dnsResult.value.output.trim().split('\n').forEach(server => {
          if (server.trim()) dnsServers.push(server.trim());
        });
      }

      // Process connection count
      const connectionCount = connectionsResult.status === 'fulfilled' && connectionsResult.value.success
        ? parseInt(connectionsResult.value.output?.trim() || '0') - 1 // Subtract header line
        : 0;

      return {
        interfaces,
        publicIP,
        vpnStatus,
        internetConnected,
        dnsServers,
        connectionCount,
        activeConnections: [] // Can be expanded later if needed
      };

    } catch (err) {
      console.error('Network info fetch error:', err);
      throw new Error('Erro ao coletar informações de rede');
    }
  }, []);

  const refresh = useCallback(async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const newData = await fetchNetworkInfo();
      if (!newData) return;

      const changes = detectChanges(previousDataRef.current, newData);
      
      setNetworkInfo(newData);
      setLastUpdate(new Date());
      
      if (changes.length > 0) {
        setUpdates(prev => [...changes, ...prev.slice(0, 19)]); // Keep last 20 updates
      }
      
      previousDataRef.current = newData;
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setIsLoading(false);
    }
  }, [fetchNetworkInfo, isLoading]);

  const clearUpdates = useCallback(() => {
    setUpdates([]);
  }, []);

  // Initial load and auto-refresh setup
  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!enableAutoRefresh) return;

    intervalRef.current = setInterval(() => {
      refresh();
    }, refreshInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [refresh, refreshInterval, enableAutoRefresh]);

  return {
    networkInfo,
    isLoading,
    error,
    lastUpdate,
    updates,
    refresh,
    clearUpdates
  };
};
