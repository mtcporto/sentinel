// src/hooks/use-real-time-security-overview.ts
"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { executeSystemCommand } from '@/lib/actions';

export interface SecurityInfo {
  failedLogins: { user: string; ip: string; time: string; count: number }[];
  activeUsers: { user: string; tty: string; from: string; loginTime: string }[];
  sudoActivity: { user: string; command: string; time: string }[];
  suspiciousProcesses: { pid: string; user: string; command: string; cpu: string }[];
  openSSHConnections: { user: string; ip: string; time: string }[];
  lastLogins: { user: string; time: string; from: string }[];
  systemSecurityStatus: { firewall: string; selinux: string; apparmor: string };
}

export interface SecurityUpdate {
  id: string;
  timestamp: Date;
  field: keyof SecurityInfo | 'failedLoginIP' | 'activeUserLogin' | 'sudoCommand' | 'suspiciousProcess' | 'sshConnection' | 'lastLogin' | 'securityStatus';
  message: string;
  previousValue?: any;
  currentValue?: any;
}

interface UseRealTimeSecurityOverviewOptions {
  refreshInterval?: number;
  enableAutoRefresh?: boolean;
}

export function useRealTimeSecurityOverview(
  options: UseRealTimeSecurityOverviewOptions = {}
) {
  const {
    refreshInterval = 30000, // 30 seconds (security data changes less frequently)
    enableAutoRefresh = true
  } = options;

  const [securityInfo, setSecurityInfo] = useState<SecurityInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [updates, setUpdates] = useState<SecurityUpdate[]>([]);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const previousDataRef = useRef<SecurityInfo | null>(null);

  const generateUpdate = (
    field: SecurityUpdate['field'],
    message: string,
    previousValue?: any,
    currentValue?: any
  ): SecurityUpdate => ({
    id: `security-update-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date(),
    field,
    message,
    previousValue,
    currentValue
  });

  const compareSecurityData = (prev: SecurityInfo | null, current: SecurityInfo): SecurityUpdate[] => {
    if (!prev) return [];
    
    const updates: SecurityUpdate[] = [];

    // Check failed logins
    if (current.failedLogins.length !== prev.failedLogins.length) {
      const newFailures = current.failedLogins.filter(
        current => !prev.failedLogins.some(
          prev => prev.user === current.user && prev.ip === current.ip && prev.time === current.time
        )
      );
      
      newFailures.forEach(failure => {
        updates.push(generateUpdate(
          'failedLoginIP',
          `Nova tentativa de login falhada detectada: ${failure.user} de ${failure.ip}`,
          prev.failedLogins.length,
          current.failedLogins.length
        ));
      });
    }

    // Check active users
    if (current.activeUsers.length !== prev.activeUsers.length) {
      const newUsers = current.activeUsers.filter(
        current => !prev.activeUsers.some(
          prev => prev.user === current.user && prev.tty === current.tty
        )
      );
      
      newUsers.forEach(user => {
        updates.push(generateUpdate(
          'activeUserLogin',
          `Novo usuário ativo detectado: ${user.user} em ${user.tty} (de ${user.from})`,
          prev.activeUsers.length,
          current.activeUsers.length
        ));
      });

      const removedUsers = prev.activeUsers.filter(
        prev => !current.activeUsers.some(
          current => current.user === prev.user && current.tty === prev.tty
        )
      );

      removedUsers.forEach(user => {
        updates.push(generateUpdate(
          'activeUserLogin',
          `Usuário desconectado: ${user.user} de ${user.tty}`,
          prev.activeUsers.length,
          current.activeUsers.length
        ));
      });
    }

    // Check sudo activity
    if (current.sudoActivity.length !== prev.sudoActivity.length) {
      const newSudoCommands = current.sudoActivity.filter(
        current => !prev.sudoActivity.some(
          prev => prev.user === current.user && prev.command === current.command && prev.time === current.time
        )
      );
      
      newSudoCommands.forEach(sudo => {
        updates.push(generateUpdate(
          'sudoCommand',
          `Nova atividade sudo detectada: ${sudo.user} executou ${sudo.command}`,
          prev.sudoActivity.length,
          current.sudoActivity.length
        ));
      });
    }

    // Check suspicious processes
    if (current.suspiciousProcesses.length !== prev.suspiciousProcesses.length) {
      const newSuspiciousProcesses = current.suspiciousProcesses.filter(
        current => !prev.suspiciousProcesses.some(
          prev => prev.pid === current.pid
        )
      );
      
      newSuspiciousProcesses.forEach(process => {
        updates.push(generateUpdate(
          'suspiciousProcess',
          `Novo processo suspeito detectado: PID ${process.pid} (${process.command}) - CPU: ${process.cpu}%`,
          prev.suspiciousProcesses.length,
          current.suspiciousProcesses.length
        ));
      });
    }

    // Check SSH connections
    if (current.openSSHConnections.length !== prev.openSSHConnections.length) {
      const newConnections = current.openSSHConnections.filter(
        current => !prev.openSSHConnections.some(
          prev => prev.ip === current.ip
        )
      );
      
      newConnections.forEach(connection => {
        updates.push(generateUpdate(
          'sshConnection',
          `Nova conexão SSH detectada de ${connection.ip}`,
          prev.openSSHConnections.length,
          current.openSSHConnections.length
        ));
      });
    }

    // Check system security status
    if (
      current.systemSecurityStatus.firewall !== prev.systemSecurityStatus.firewall ||
      current.systemSecurityStatus.selinux !== prev.systemSecurityStatus.selinux ||
      current.systemSecurityStatus.apparmor !== prev.systemSecurityStatus.apparmor
    ) {
      if (current.systemSecurityStatus.firewall !== prev.systemSecurityStatus.firewall) {
        updates.push(generateUpdate(
          'securityStatus',
          `Status do firewall alterado: ${prev.systemSecurityStatus.firewall} → ${current.systemSecurityStatus.firewall}`,
          prev.systemSecurityStatus.firewall,
          current.systemSecurityStatus.firewall
        ));
      }
      
      if (current.systemSecurityStatus.selinux !== prev.systemSecurityStatus.selinux) {
        updates.push(generateUpdate(
          'securityStatus',
          `Status do SELinux alterado: ${prev.systemSecurityStatus.selinux} → ${current.systemSecurityStatus.selinux}`,
          prev.systemSecurityStatus.selinux,
          current.systemSecurityStatus.selinux
        ));
      }
      
      if (current.systemSecurityStatus.apparmor !== prev.systemSecurityStatus.apparmor) {
        updates.push(generateUpdate(
          'securityStatus',
          `Status do AppArmor alterado: ${prev.systemSecurityStatus.apparmor} → ${current.systemSecurityStatus.apparmor}`,
          prev.systemSecurityStatus.apparmor,
          current.systemSecurityStatus.apparmor
        ));
      }
    }

    return updates;
  };

  const fetchSecurityInfo = useCallback(async () => {
    try {
      setError(null);

      const [
        failedLoginsResult,
        activeUsersResult,
        sudoActivityResult,
        suspiciousProcessesResult,
        sshConnectionsResult,
        lastLoginsResult,
        firewallResult,
        selinuxResult,
        apparmorResult
      ] = await Promise.allSettled([
        executeSystemCommand('grep "Failed password" /var/log/auth.log 2>/dev/null | tail -10 | awk \'{print $9 " " $11 " " $1 " " $2 " " $3}\' || echo "No failed logins found"'),
        executeSystemCommand('who'),
        executeSystemCommand('grep "sudo" /var/log/auth.log 2>/dev/null | tail -5 | awk \'{print $5 " " $6 " " $1 " " $2 " " $3}\' || echo "No sudo activity found"'),
        executeSystemCommand('ps aux | awk \'$3 > 80 || $4 > 80 {print $2 " " $1 " " $11 " " $3}\' | head -5'),
        executeSystemCommand('ss -tn | grep ":22 " | head -5'),
        executeSystemCommand('last -n 5 | head -5'),
        executeSystemCommand('systemctl is-active ufw 2>/dev/null || systemctl is-active firewalld 2>/dev/null || echo "inactive"'),
        executeSystemCommand('getenforce 2>/dev/null || echo "disabled"'),
        executeSystemCommand('systemctl is-active apparmor 2>/dev/null || echo "inactive"')
      ]);

      // Process failed logins
      const failedLogins: SecurityInfo['failedLogins'] = [];
      if (failedLoginsResult.status === 'fulfilled' && failedLoginsResult.value.success && failedLoginsResult.value.output) {
        const lines = failedLoginsResult.value.output.trim().split('\n');
        lines.forEach(line => {
          if (line !== "No failed logins found" && line.trim()) {
            const parts = line.trim().split(' ');
            if (parts.length >= 5) {
              failedLogins.push({
                user: parts[0] || 'unknown',
                ip: parts[1] || 'unknown',
                time: `${parts[2]} ${parts[3]} ${parts[4]}` || 'unknown',
                count: 1
              });
            }
          }
        });
      }

      // Process active users
      const activeUsers: SecurityInfo['activeUsers'] = [];
      if (activeUsersResult.status === 'fulfilled' && activeUsersResult.value.success && activeUsersResult.value.output) {
        const lines = activeUsersResult.value.output.trim().split('\n');
        lines.forEach(line => {
          const parts = line.trim().split(/\s+/);
          if (parts.length >= 5) {
            activeUsers.push({
              user: parts[0] || 'unknown',
              tty: parts[1] || 'unknown',
              from: parts[2] || 'local',
              loginTime: `${parts[3]} ${parts[4]}` || 'unknown'
            });
          }
        });
      }

      // Process sudo activity
      const sudoActivity: SecurityInfo['sudoActivity'] = [];
      if (sudoActivityResult.status === 'fulfilled' && sudoActivityResult.value.success && sudoActivityResult.value.output) {
        const lines = sudoActivityResult.value.output.trim().split('\n');
        lines.forEach(line => {
          if (line !== "No sudo activity found" && line.trim()) {
            const parts = line.trim().split(' ');
            if (parts.length >= 5) {
              sudoActivity.push({
                user: parts[0] || 'unknown',
                command: parts[1] || 'unknown',
                time: `${parts[2]} ${parts[3]} ${parts[4]}` || 'unknown'
              });
            }
          }
        });
      }

      // Process suspicious processes
      const suspiciousProcesses: SecurityInfo['suspiciousProcesses'] = [];
      if (suspiciousProcessesResult.status === 'fulfilled' && suspiciousProcessesResult.value.success && suspiciousProcessesResult.value.output) {
        const lines = suspiciousProcessesResult.value.output.trim().split('\n');
        lines.forEach(line => {
          const parts = line.trim().split(' ');
          if (parts.length >= 4) {
            suspiciousProcesses.push({
              pid: parts[0] || 'unknown',
              user: parts[1] || 'unknown',
              command: parts[2] || 'unknown',
              cpu: parts[3] || '0'
            });
          }
        });
      }

      // Process SSH connections
      const openSSHConnections: SecurityInfo['openSSHConnections'] = [];
      if (sshConnectionsResult.status === 'fulfilled' && sshConnectionsResult.value.success && sshConnectionsResult.value.output) {
        const lines = sshConnectionsResult.value.output.trim().split('\n');
        lines.forEach(line => {
          const parts = line.trim().split(/\s+/);
          if (parts.length >= 4) {
            const connection = parts[3] || '';
            const [local, remote] = connection.split(' ') || ['', ''];
            if (remote) {
              openSSHConnections.push({
                user: 'ssh',
                ip: remote.split(':')[0] || 'unknown',
                time: 'active'
              });
            }
          }
        });
      }

      // Process last logins
      const lastLogins: SecurityInfo['lastLogins'] = [];
      if (lastLoginsResult.status === 'fulfilled' && lastLoginsResult.value.success && lastLoginsResult.value.output) {
        const lines = lastLoginsResult.value.output.trim().split('\n');
        lines.forEach(line => {
          const parts = line.trim().split(/\s+/);
          if (parts.length >= 7 && parts[0] !== 'wtmp') {
            lastLogins.push({
              user: parts[0] || 'unknown',
              time: `${parts[3]} ${parts[4]} ${parts[5]} ${parts[6]}` || 'unknown',
              from: parts[2] || 'local'
            });
          }
        });
      }

      // System security status
      const firewall = firewallResult.status === 'fulfilled' && firewallResult.value.success 
        ? firewallResult.value.output?.trim() || 'inactive' 
        : 'inactive';

      const selinux = selinuxResult.status === 'fulfilled' && selinuxResult.value.success 
        ? selinuxResult.value.output?.trim() || 'disabled' 
        : 'disabled';

      const apparmor = apparmorResult.status === 'fulfilled' && apparmorResult.value.success 
        ? apparmorResult.value.output?.trim() || 'inactive' 
        : 'inactive';

      const newSecurityInfo: SecurityInfo = {
        failedLogins: failedLogins.slice(0, 5),
        activeUsers: activeUsers.slice(0, 8),
        sudoActivity: sudoActivity.slice(0, 5),
        suspiciousProcesses: suspiciousProcesses.slice(0, 5),
        openSSHConnections: openSSHConnections.slice(0, 5),
        lastLogins: lastLogins.slice(0, 5),
        systemSecurityStatus: { firewall, selinux, apparmor }
      };

      // Compare with previous data to detect changes
      const newUpdates = compareSecurityData(previousDataRef.current, newSecurityInfo);
      
      if (newUpdates.length > 0) {
        setUpdates(prev => [...newUpdates, ...prev].slice(0, 50)); // Keep last 50 updates
      }

      // Update state
      previousDataRef.current = newSecurityInfo;
      setSecurityInfo(newSecurityInfo);
      setLastUpdate(new Date());
      setIsLoading(false);

    } catch (err) {
      setError('Erro ao coletar informações de segurança');
      console.error('Security info error:', err);
      setIsLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    await fetchSecurityInfo();
  }, [fetchSecurityInfo]);

  const clearUpdates = useCallback(() => {
    setUpdates([]);
  }, []);

  // Auto-refresh logic
  useEffect(() => {
    if (enableAutoRefresh && refreshInterval > 0) {
      fetchSecurityInfo(); // Initial fetch
      
      intervalRef.current = setInterval(fetchSecurityInfo, refreshInterval);
      
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    } else {
      fetchSecurityInfo(); // Initial fetch only
    }
  }, [fetchSecurityInfo, refreshInterval, enableAutoRefresh]);

  return {
    securityInfo,
    isLoading,
    error,
    lastUpdate,
    updates,
    refresh,
    clearUpdates
  };
};
