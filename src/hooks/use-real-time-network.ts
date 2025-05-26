"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { executeSystemCommand } from '@/lib/actions';

interface NetworkInterface {
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

interface NetworkInfo {
  interfaces: NetworkInterface[];
  publicIP: string;
  vpnStatus: { connected: boolean; name?: string; ip?: string };
  internetConnected: boolean;
  dnsServers: string[];
}

interface NetworkUpdate {
  interfacesChanged: boolean;
  publicIPChanged: boolean;
  vpnStatusChanged: boolean;
  internetStatusChanged: boolean;
  timestamp: Date;
}

interface UseRealTimeNetworkOptions {
  refreshInterval?: number;
  enableOptimisticUpdates?: boolean;
}

export function useRealTimeNetwork(options: UseRealTimeNetworkOptions = {}) {
  const {
    refreshInterval = 10000, // 10 seconds default for network data
    enableOptimisticUpdates = true
  } = options;

  const [networkInfo, setNetworkInfo] = useState<NetworkInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [updates, setUpdates] = useState<NetworkUpdate | null>(null);
  
  const previousNetworkRef = useRef<NetworkInfo | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Helper functions
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const classifyInterface = (name: string): { type: NetworkInterface['type'], priority: number, isImportant: boolean } => {
    const lowerName = name.toLowerCase();
    
    if (lowerName.startsWith('enp') || lowerName.startsWith('eth') || lowerName.startsWith('eno')) {
      return { type: 'ethernet', priority: 1, isImportant: true };
    }
    if (lowerName.startsWith('wlp') || lowerName.startsWith('wlan') || lowerName.startsWith('wifi')) {
      return { type: 'wifi', priority: 2, isImportant: true };
    }
    if (lowerName.startsWith('tun') || lowerName.startsWith('tap') || lowerName.includes('vpn')) {
      return { type: 'vpn', priority: 3, isImportant: true };
    }
    if (lowerName.startsWith('lo')) {
      return { type: 'loopback', priority: 6, isImportant: false };
    }
    if (lowerName.startsWith('docker') || lowerName.startsWith('br-') || lowerName.startsWith('veth')) {
      return { type: 'docker', priority: 5, isImportant: false };
    }
    
    return { type: 'other', priority: 4, isImportant: false };
  };

  const fetchNetworkInfo = useCallback(async (): Promise<NetworkInfo> => {
    try {
      // Get network interfaces with IP addresses
      const interfacesResult = await executeSystemCommand('ip addr show | grep -E "^[0-9]+:|inet " | awk \'/^[0-9]+:/ {iface=$2} /inet / {print iface " " $2}\'');
      
      // Get network traffic data
      const trafficResult = await executeSystemCommand('cat /proc/net/dev | tail -n +3');
      
      // Get public IP
      const publicIPResult = await executeSystemCommand('curl -s --connect-timeout 5 https://ipinfo.io/ip || echo "N/A"');
      
      // Get DNS servers
      const dnsResult = await executeSystemCommand('cat /etc/resolv.conf | grep nameserver | awk \'{print $2}\' | head -3');
      
      // Check if commands succeeded and extract output
      const interfacesData = interfacesResult.success ? (interfacesResult.output || '') : '';
      const trafficData = trafficResult.success ? (trafficResult.output || '') : '';
      const publicIPData = publicIPResult.success ? (publicIPResult.output || '') : 'N/A';
      const dnsData = dnsResult.success ? (dnsResult.output || '') : '';
      
      // Parse interfaces
      const interfaces: NetworkInterface[] = [];
      const interfaceLines = interfacesData.split('\n').filter(Boolean);
      const trafficLines = trafficData.split('\n').filter(Boolean);
      
      // Create traffic map
      const trafficMap: Record<string, { rx: number; tx: number }> = {};
      for (const line of trafficLines) {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 10) {
          const interfaceName = parts[0].replace(':', '');
          trafficMap[interfaceName] = {
            rx: parseInt(parts[1]) || 0,
            tx: parseInt(parts[9]) || 0
          };
        }
      }
      
      for (const line of interfaceLines) {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 2) {
          const interfaceName = parts[0].replace(':', '');
          const ip = parts[1].split('/')[0];
          
          const classification = classifyInterface(interfaceName);
          const traffic = trafficMap[interfaceName] || { rx: 0, tx: 0 };
          
          // Get interface status
          const statusResult = await executeSystemCommand(`ip link show ${interfaceName} | grep -o 'state [A-Z]*' | awk '{print $2}'`);
          const status = statusResult.success ? (statusResult.output || 'UNKNOWN') : 'UNKNOWN';
          
          interfaces.push({
            name: interfaceName,
            ip,
            status: status.toLowerCase(),
            type: classification.type,
            priority: classification.priority,
            rxBytes: traffic.rx,
            txBytes: traffic.tx,
            rxFormatted: formatBytes(traffic.rx),
            txFormatted: formatBytes(traffic.tx),
            isImportant: classification.isImportant
          });
        }
      }
      
      // Sort interfaces by priority and name
      interfaces.sort((a, b) => {
        if (a.priority !== b.priority) {
          return a.priority - b.priority;
        }
        return a.name.localeCompare(b.name);
      });
      
      // Check VPN status (simplified)
      const vpnResult = await executeSystemCommand('pgrep -f openvpn || pgrep -f wireguard || echo ""');
      const vpnCheck = vpnResult.success ? (vpnResult.output || '') : '';
      const vpnStatus = {
        connected: vpnCheck.trim() !== '',
        name: vpnCheck.trim() !== '' ? 'VPN' : undefined,
        ip: undefined
      };
      
      // Check internet connectivity
      const internetResult = await executeSystemCommand('ping -c 1 -W 3 8.8.8.8 >/dev/null 2>&1 && echo "connected" || echo "disconnected"');
      const internetCheck = internetResult.success ? (internetResult.output || 'disconnected') : 'disconnected';
      const internetConnected = internetCheck.trim() === 'connected';
      
      return {
        interfaces,
        publicIP: publicIPData.trim(),
        vpnStatus,
        internetConnected,
        dnsServers: dnsData.split('\n').filter(Boolean)
      };
    } catch (error) {
      console.error('Failed to fetch network info:', error);
      throw error;
    }
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const newNetworkInfo = await fetchNetworkInfo();
      
      // Calculate what changed
      let networkUpdate: NetworkUpdate | null = null;
      
      if (previousNetworkRef.current) {
        const prev = previousNetworkRef.current;
        networkUpdate = {
          interfacesChanged: JSON.stringify(prev.interfaces) !== JSON.stringify(newNetworkInfo.interfaces),
          publicIPChanged: prev.publicIP !== newNetworkInfo.publicIP,
          vpnStatusChanged: JSON.stringify(prev.vpnStatus) !== JSON.stringify(newNetworkInfo.vpnStatus),
          internetStatusChanged: prev.internetConnected !== newNetworkInfo.internetConnected,
          timestamp: new Date()
        };
      }

      setNetworkInfo(prevInfo => {
        const hasChanges = !previousNetworkRef.current || 
          JSON.stringify(previousNetworkRef.current) !== JSON.stringify(newNetworkInfo);

        if (hasChanges) {
          previousNetworkRef.current = prevInfo;
          setUpdates(networkUpdate);
          setLastUpdate(new Date());
          return newNetworkInfo;
        }
        
        return prevInfo || newNetworkInfo;
      });

      setIsLoading(false);
    } catch (err) {
      console.error("Failed to fetch network info:", err);
      setError("Could not load network information.");
      setIsLoading(false);
    }
  }, [fetchNetworkInfo]);

  // Start/stop monitoring
  const startMonitoring = useCallback(() => {
    if (intervalRef.current) return;
    
    fetchData(); // Initial fetch
    intervalRef.current = setInterval(fetchData, refreshInterval);
  }, [fetchData, refreshInterval]);

  const stopMonitoring = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
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

  // Manual refresh
  const refresh = useCallback(() => {
    return fetchData();
  }, [fetchData]);

  return {
    networkInfo,
    isLoading,
    error,
    lastUpdate,
    updates,
    refresh,
    startMonitoring,
    stopMonitoring
  };
}
