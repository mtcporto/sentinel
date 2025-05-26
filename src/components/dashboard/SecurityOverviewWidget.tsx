// src/components/dashboard/SecurityOverviewWidget.tsx
"use client";

import React, { memo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useRealTimeSecurityOverview } from '@/hooks/use-real-time-security-overview';
import { 
  Shield, 
  AlertTriangle,
  Lock,
  User,
  FileX,
  Loader2,
  Eye,
  Activity,
  RefreshCw
} from 'lucide-react';

export const SecurityOverviewWidget = memo(() => {
  const { 
    securityInfo, 
    isLoading, 
    error, 
    lastUpdate, 
    updates, 
    refresh, 
    clearUpdates 
  } = useRealTimeSecurityOverview({
    refreshInterval: 30000, // 30 seconds
    enableAutoRefresh: true
  });

  const handleRefresh = async () => {
    await refresh();
    setTimeout(clearUpdates, 3000); // Clear visual indicators after 3 seconds
  };

  // Check if there are recent changes (within last 30 seconds)
  const hasRecentChanges = updates.some(update => 
    Date.now() - update.timestamp.getTime() < 30000
  );

  // Helper functions to check for recent updates in specific sections
  const getRecentUpdatesForField = (field: string) => {
    return updates.filter(update => 
      update.field === field && Date.now() - update.timestamp.getTime() < 30000
    );
  };

  // Helper function to get security status color
  const getSecurityStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'enabled':
      case 'enforcing':
        return 'default';
      case 'inactive':
      case 'disabled':
      case 'permissive':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  if (isLoading) {
    return (
      <Card className="relative overflow-hidden">
        <CardHeader>
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Visão Geral de Segurança
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-40">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-2">Carregando informações de segurança...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="relative overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Visão Geral de Segurança
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!securityInfo) {
    return (
      <Card className="relative overflow-hidden">
        <CardHeader>
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Visão Geral de Segurança
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center py-8 text-muted-foreground">
            Nenhum dado de segurança disponível
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="relative overflow-hidden">
      {hasRecentChanges && (
        <div className="absolute inset-0 ring-2 ring-red-500/30 rounded-lg animate-pulse" />
      )}
      
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Visão Geral de Segurança
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Monitoramento de segurança e atividades suspeitas
            {lastUpdate && ` • Atualizado ${lastUpdate.toLocaleTimeString()}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasRecentChanges && (
            <Badge variant="outline" className="text-red-600 border-red-300 bg-red-50">
              Atividade detectada
            </Badge>
          )}
          <Button
            variant="ghost"
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
        {/* System Security Status */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Lock className="h-4 w-4 text-green-500" />
            <span className="font-medium">Status de Segurança do Sistema</span>
            {getRecentUpdatesForField('securityStatus').length > 0 && (
              <Activity className="h-3 w-3 text-red-500 animate-pulse" />
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <div className={`flex items-center justify-between p-2 rounded-md transition-all duration-500 ${
              getRecentUpdatesForField('securityStatus').some(u => u.message.includes('firewall')) 
                ? 'bg-red-50 border border-red-200 ring-1 ring-red-300' 
                : 'bg-muted/50'
            }`}>
              <span className="text-sm">Firewall:</span>
              <Badge variant={getSecurityStatusColor(securityInfo.systemSecurityStatus.firewall)}>
                {securityInfo.systemSecurityStatus.firewall}
              </Badge>
            </div>
            <div className={`flex items-center justify-between p-2 rounded-md transition-all duration-500 ${
              getRecentUpdatesForField('securityStatus').some(u => u.message.includes('SELinux')) 
                ? 'bg-red-50 border border-red-200 ring-1 ring-red-300' 
                : 'bg-muted/50'
            }`}>
              <span className="text-sm">SELinux:</span>
              <Badge variant={getSecurityStatusColor(securityInfo.systemSecurityStatus.selinux)}>
                {securityInfo.systemSecurityStatus.selinux}
              </Badge>
            </div>
            <div className={`flex items-center justify-between p-2 rounded-md transition-all duration-500 ${
              getRecentUpdatesForField('securityStatus').some(u => u.message.includes('AppArmor')) 
                ? 'bg-red-50 border border-red-200 ring-1 ring-red-300' 
                : 'bg-muted/50'
            }`}>
              <span className="text-sm">AppArmor:</span>
              <Badge variant={getSecurityStatusColor(securityInfo.systemSecurityStatus.apparmor)}>
                {securityInfo.systemSecurityStatus.apparmor}
              </Badge>
            </div>
          </div>
        </div>

        <Separator />

        {/* Active Users */}
        {securityInfo.activeUsers.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <User className="h-4 w-4 text-blue-500" />
              <span className="font-medium">Usuários Ativos</span>
              <Badge variant="secondary">{securityInfo.activeUsers.length}</Badge>
              {getRecentUpdatesForField('activeUserLogin').length > 0 && (
                <Activity className="h-3 w-3 text-blue-500 animate-pulse" />
              )}
            </div>
            <div className="space-y-2">
              {securityInfo.activeUsers.map((user, index) => (
                <div key={index} className={`flex items-center justify-between text-sm p-2 rounded-md transition-all duration-500 ${
                  getRecentUpdatesForField('activeUserLogin').some(u => u.message.includes(user.user)) 
                    ? 'bg-blue-50 border border-blue-200 ring-1 ring-blue-300' 
                    : 'bg-muted/50'
                }`}>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{user.user}</Badge>
                    <span className="text-xs text-muted-foreground">{user.tty}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">{user.from}</div>
                    <div className="text-xs">{user.loginTime}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <Separator />

        {/* Failed Logins */}
        {securityInfo.failedLogins.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <span className="font-medium">Tentativas de Login Falhadas</span>
              <Badge variant="destructive">{securityInfo.failedLogins.length}</Badge>
              {getRecentUpdatesForField('failedLogin').length > 0 && (
                <Activity className="h-3 w-3 text-red-500 animate-pulse" />
              )}
            </div>
            <div className="space-y-2">
              {securityInfo.failedLogins.map((login, index) => (
                <div key={index} className={`flex items-center justify-between text-sm p-2 rounded-md transition-all duration-500 ${
                  getRecentUpdatesForField('failedLogin').some(u => u.message.includes(login.user)) 
                    ? 'bg-red-50 border border-red-200 ring-1 ring-red-300' 
                    : 'bg-destructive/10'
                }`}>
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive">{login.user}</Badge>
                    <span className="text-xs font-mono">{login.ip}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{login.time}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <Separator />

        {/* Sudo Activity */}
        {securityInfo.sudoActivity.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Shield className="h-4 w-4 text-amber-500" />
              <span className="font-medium">Atividade Sudo</span>
              <Badge variant="secondary">{securityInfo.sudoActivity.length}</Badge>
              {getRecentUpdatesForField('sudoCommand').length > 0 && (
                <Activity className="h-3 w-3 text-amber-500 animate-pulse" />
              )}
            </div>
            <div className="space-y-2">
              {securityInfo.sudoActivity.map((activity, index) => (
                <div key={index} className={`flex items-center justify-between text-sm p-2 rounded-md transition-all duration-500 ${
                  getRecentUpdatesForField('sudoCommand').some(u => u.message.includes(activity.user)) 
                    ? 'bg-amber-50 border border-amber-200 ring-1 ring-amber-300' 
                    : 'bg-muted/50'
                }`}>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{activity.user}</Badge>
                    <span className="text-xs font-mono truncate max-w-[200px]">{activity.command}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{activity.time}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <Separator />

        {/* Suspicious Processes */}
        {securityInfo.suspiciousProcesses.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Activity className="h-4 w-4 text-orange-500" />
              <span className="font-medium">Processos com Alto Uso de Recursos</span>
              <Badge variant="secondary">{securityInfo.suspiciousProcesses.length}</Badge>
              {getRecentUpdatesForField('highCpuProcess').length > 0 && (
                <Activity className="h-3 w-3 text-orange-500 animate-pulse" />
              )}
            </div>
            <div className="space-y-2">
              {securityInfo.suspiciousProcesses.map((process, index) => (
                <div key={index} className={`flex items-center justify-between text-sm p-2 rounded-md transition-all duration-500 ${
                  getRecentUpdatesForField('highCpuProcess').some(u => u.message.includes(process.pid)) 
                    ? 'bg-orange-50 border border-orange-200 ring-1 ring-orange-300' 
                    : 'bg-muted/50'
                }`}>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">PID:{process.pid}</Badge>
                    <Badge variant="secondary">{process.user}</Badge>
                    <Badge variant="default">{process.cpu}% CPU</Badge>
                  </div>
                  <span className="text-xs font-mono truncate max-w-[150px]">{process.command}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <Separator />

        {/* SSH Connections */}
        {securityInfo.openSSHConnections.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Eye className="h-4 w-4 text-purple-500" />
              <span className="font-medium">Conexões SSH Ativas</span>
              <Badge variant="secondary">{securityInfo.openSSHConnections.length}</Badge>
              {getRecentUpdatesForField('sshConnection').length > 0 && (
                <Activity className="h-3 w-3 text-purple-500 animate-pulse" />
              )}
            </div>
            <div className="space-y-2">
              {securityInfo.openSSHConnections.map((connection, index) => (
                <div key={index} className={`flex items-center justify-between text-sm p-2 rounded-md transition-all duration-500 ${
                  getRecentUpdatesForField('sshConnection').some(u => u.message.includes(connection.user)) 
                    ? 'bg-purple-50 border border-purple-200 ring-1 ring-purple-300' 
                    : 'bg-muted/50'
                }`}>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{connection.user}</Badge>
                    <span className="text-xs font-mono">{connection.ip}</span>
                  </div>
                  <Badge variant="default" className="text-xs">
                    {connection.time}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        <Separator />

        {/* Last Logins */}
        {securityInfo.lastLogins.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <User className="h-4 w-4 text-gray-500" />
              <span className="font-medium">Últimos Logins</span>
              <Badge variant="secondary">{securityInfo.lastLogins.length}</Badge>
            </div>
            <div className="space-y-2">
              {securityInfo.lastLogins.slice(0, 5).map((login, index) => (
                <div key={index} className="flex items-center justify-between text-sm p-2 rounded-md bg-muted/50">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{login.user}</Badge>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">{login.from}</div>
                    <div className="text-xs">{login.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Updates Display */}
        {updates.length > 0 && (
          <>
            <Separator />
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Activity className="h-4 w-4 text-blue-500" />
                <span className="font-medium">Atualizações Recentes</span>
                <Badge variant="outline">{updates.length}</Badge>
              </div>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {updates.slice(-5).reverse().map((update, index) => (
                  <div key={index} className="text-xs p-2 rounded bg-blue-50 border border-blue-200">
                    <span className="font-medium">{update.timestamp.toLocaleTimeString()}:</span>
                    <span className="ml-1">{update.message}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Security Alerts */}
        {(securityInfo.failedLogins.length > 0 || 
          securityInfo.systemSecurityStatus.firewall === 'inactive') && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {securityInfo.failedLogins.length > 0 && "Detectadas tentativas de login falhadas. "}
              {securityInfo.systemSecurityStatus.firewall === 'inactive' && "Firewall está inativo. "}
              Considere revisar as configurações de segurança.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
});
