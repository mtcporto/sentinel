// src/components/dashboard/NetworkOverviewItem.tsx
"use client";

import React, { memo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Cable, 
  Wifi, 
  Shield, 
  Router, 
  Network,
  Globe,
  CheckCircle,
  XCircle,
  Activity,
  Download,
  Upload,
  Monitor,
  Eye,
  Server
} from 'lucide-react';
import { NetworkInterface, NetworkInfo, NetworkUpdate } from '@/hooks/use-real-time-network-overview';

interface NetworkSectionProps {
  networkInfo: NetworkInfo;
  updates: NetworkUpdate[];
}

// Individual Interface Component
export const InterfaceItem = memo(({ 
  interface: iface, 
  updates 
}: { 
  interface: NetworkInterface; 
  updates: NetworkUpdate[] 
}) => {
  const recentUpdates = updates.filter(u => 
    (u.field === 'interfaceIP' || u.field === 'interfaceRX' || u.field === 'interfaceTX') &&
    u.message.includes(iface.name) &&
    Date.now() - u.timestamp.getTime() < 30000 // Last 30 seconds
  );

  const hasRecentChange = recentUpdates.length > 0;
  const highActivity = recentUpdates.some(u => u.field === 'interfaceRX' || u.field === 'interfaceTX');

  const getInterfaceIcon = (type: NetworkInterface['type']) => {
    switch (type) {
      case 'ethernet': return Cable;
      case 'wifi': return Wifi;
      case 'vpn': return Shield;
      case 'docker': return Router;
      default: return Network;
    }
  };

  const getInterfaceStyle = (type: NetworkInterface['type'], isImportant: boolean) => {
    const baseStyle = isImportant ? 'ring-1 ring-primary/20 border-primary/30' : '';
    
    switch (type) {
      case 'ethernet': 
        return `${baseStyle} bg-blue-500/5 border-blue-500/30`;
      case 'wifi': 
        return `${baseStyle} bg-green-500/5 border-green-500/30`;
      case 'vpn': 
        return `${baseStyle} bg-purple-500/5 border-purple-500/30`;
      case 'docker': 
        return 'bg-gray-500/5 border-gray-500/20';
      default: 
        return 'bg-muted/30 border-muted';
    }
  };

  const getBadgeVariant = (type: NetworkInterface['type']) => {
    switch (type) {
      case 'ethernet': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'wifi': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'vpn': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'docker': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
      default: return 'secondary';
    }
  };

  const Icon = getInterfaceIcon(iface.type);

  return (
    <div 
      className={`
        p-3 rounded-lg border transition-all duration-500
        ${getInterfaceStyle(iface.type, iface.isImportant)}
        ${hasRecentChange ? 'ring-2 ring-blue-500/50 shadow-lg' : ''}
        ${highActivity ? 'animate-pulse' : ''}
      `}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4" />
          <span className="font-medium">{iface.name}</span>
          {hasRecentChange && (
            <Activity className="h-3 w-3 text-blue-500 animate-pulse" />
          )}
        </div>
        <Badge className={getBadgeVariant(iface.type)}>
          {iface.type}
        </Badge>
      </div>
      
      <div className="space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">IP:</span>
          <span className={hasRecentChange && recentUpdates.some(u => u.field === 'interfaceIP') ? 'text-blue-600 font-medium' : ''}>
            {iface.ip}
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1">
            <Download className="h-3 w-3" />
            <span className="text-muted-foreground">RX:</span>
          </div>
          <span className={highActivity && recentUpdates.some(u => u.field === 'interfaceRX') ? 'text-green-600 font-medium' : ''}>
            {iface.rxFormatted}
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1">
            <Upload className="h-3 w-3" />
            <span className="text-muted-foreground">TX:</span>
          </div>
          <span className={highActivity && recentUpdates.some(u => u.field === 'interfaceTX') ? 'text-blue-600 font-medium' : ''}>
            {iface.txFormatted}
          </span>
        </div>
      </div>

      {/* Show recent updates */}
      {recentUpdates.length > 0 && (
        <div className="mt-2 text-xs text-blue-600 bg-blue-50 dark:bg-blue-950/30 p-1 rounded">
          {recentUpdates[0].message}
        </div>
      )}
    </div>
  );
});

InterfaceItem.displayName = 'InterfaceItem';

// Network Interfaces Section
export const NetworkInterfacesSection = memo(({ networkInfo, updates }: NetworkSectionProps) => {
  const interfaceUpdates = updates.filter(u => 
    u.field === 'interfaces' || u.field === 'interfaceIP' || u.field === 'interfaceRX' || u.field === 'interfaceTX'
  );
  
  const hasRecentChanges = interfaceUpdates.some(u => Date.now() - u.timestamp.getTime() < 30000);

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Monitor className="h-4 w-4 text-primary" />
        <span className="font-medium">Interfaces de Rede</span>
        {hasRecentChanges && (
          <Activity className="h-3 w-3 text-primary animate-pulse" />
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {networkInfo.interfaces.map((iface) => (
          <InterfaceItem 
            key={iface.name} 
            interface={iface} 
            updates={interfaceUpdates}
          />
        ))}
      </div>
    </div>
  );
});

NetworkInterfacesSection.displayName = 'NetworkInterfacesSection';

// Connectivity Status Section
export const ConnectivityStatusSection = memo(({ networkInfo, updates }: NetworkSectionProps) => {
  const connectivityUpdates = updates.filter(u => 
    u.field === 'publicIP' || u.field === 'internetConnected' || u.field === 'vpnStatus'
  );
  
  const hasRecentChanges = connectivityUpdates.some(u => Date.now() - u.timestamp.getTime() < 30000);

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Globe className="h-4 w-4 text-primary" />
        <span className="font-medium">Status de Conectividade</span>
        {hasRecentChanges && (
          <Activity className="h-3 w-3 text-primary animate-pulse" />
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Internet Connection */}
        <div className={`
          p-3 rounded-lg border transition-all duration-500
          ${networkInfo.internetConnected 
            ? 'bg-green-500/5 border-green-500/30' 
            : 'bg-red-500/5 border-red-500/30'
          }
          ${hasRecentChanges && connectivityUpdates.some(u => u.field === 'internetConnected') 
            ? 'ring-2 ring-blue-500/50 shadow-lg' 
            : ''
          }
        `}>
          <div className="flex items-center gap-2 mb-2">
            {networkInfo.internetConnected ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <XCircle className="h-4 w-4 text-red-600" />
            )}
            <span className="font-medium">Internet</span>
          </div>
          <p className="text-sm text-muted-foreground">
            {networkInfo.internetConnected ? 'Conectado' : 'Desconectado'}
          </p>
        </div>

        {/* Public IP */}
        <div className={`
          p-3 rounded-lg border transition-all duration-500
          bg-blue-500/5 border-blue-500/30
          ${hasRecentChanges && connectivityUpdates.some(u => u.field === 'publicIP') 
            ? 'ring-2 ring-blue-500/50 shadow-lg' 
            : ''
          }
        `}>
          <div className="flex items-center gap-2 mb-2">
            <Globe className="h-4 w-4 text-blue-600" />
            <span className="font-medium">IP Público</span>
          </div>
          <p className={`
            text-sm
            ${hasRecentChanges && connectivityUpdates.some(u => u.field === 'publicIP') 
              ? 'text-blue-600 font-medium' 
              : 'text-muted-foreground'
            }
          `}>
            {networkInfo.publicIP}
          </p>
        </div>

        {/* VPN Status */}
        <div className={`
          p-3 rounded-lg border transition-all duration-500
          ${networkInfo.vpnStatus.connected 
            ? 'bg-purple-500/5 border-purple-500/30' 
            : 'bg-gray-500/5 border-gray-500/20'
          }
          ${hasRecentChanges && connectivityUpdates.some(u => u.field === 'vpnStatus') 
            ? 'ring-2 ring-blue-500/50 shadow-lg' 
            : ''
          }
        `}>
          <div className="flex items-center gap-2 mb-2">
            <Shield className={`h-4 w-4 ${networkInfo.vpnStatus.connected ? 'text-purple-600' : 'text-gray-400'}`} />
            <span className="font-medium">VPN</span>
          </div>
          <p className="text-sm text-muted-foreground">
            {networkInfo.vpnStatus.connected ? (
              <>
                Conectado
                {networkInfo.vpnStatus.name && (
                  <span className="block text-xs">({networkInfo.vpnStatus.name})</span>
                )}
              </>
            ) : (
              'Desconectado'
            )}
          </p>
        </div>
      </div>

      {/* Show recent connectivity updates */}
      {hasRecentChanges && (
        <div className="mt-3 space-y-1">
          {connectivityUpdates.slice(0, 2).map((update) => (
            <div key={update.id} className="text-xs text-blue-600 bg-blue-50 dark:bg-blue-950/30 p-2 rounded">
              <span className="font-medium">{update.timestamp.toLocaleTimeString()}</span>: {update.message}
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

ConnectivityStatusSection.displayName = 'ConnectivityStatusSection';

// DNS and Network Info Section
export const DNSNetworkInfoSection = memo(({ networkInfo, updates }: NetworkSectionProps) => {
  const dnsUpdates = updates.filter(u => u.field === 'dnsServers');
  const connectionUpdates = updates.filter(u => u.field === 'connectionCount');
  
  const hasRecentChanges = [...dnsUpdates, ...connectionUpdates].some(u => 
    Date.now() - u.timestamp.getTime() < 30000
  );

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Server className="h-4 w-4 text-primary" />
        <span className="font-medium">DNS e Informações de Rede</span>
        {hasRecentChanges && (
          <Activity className="h-3 w-3 text-primary animate-pulse" />
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* DNS Servers */}
        <div className={`
          p-3 rounded-lg border transition-all duration-500
          bg-amber-500/5 border-amber-500/30
          ${hasRecentChanges && dnsUpdates.length > 0 ? 'ring-2 ring-blue-500/50 shadow-lg' : ''}
        `}>
          <div className="flex items-center gap-2 mb-2">
            <Server className="h-4 w-4 text-amber-600" />
            <span className="font-medium">Servidores DNS</span>
            {dnsUpdates.length > 0 && (
              <Activity className="h-3 w-3 text-blue-500 animate-pulse" />
            )}
          </div>
          <div className="space-y-1">
            {networkInfo.dnsServers.length > 0 ? (
              networkInfo.dnsServers.map((dns, index) => (
                <p key={index} className={`
                  text-sm
                  ${hasRecentChanges && dnsUpdates.length > 0 ? 'text-blue-600 font-medium' : 'text-muted-foreground'}
                `}>
                  {dns}
                </p>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Nenhum DNS configurado</p>
            )}
          </div>
        </div>

        {/* Connection Count */}
        <div className={`
          p-3 rounded-lg border transition-all duration-500
          bg-indigo-500/5 border-indigo-500/30
          ${hasRecentChanges && connectionUpdates.length > 0 ? 'ring-2 ring-blue-500/50 shadow-lg' : ''}
        `}>
          <div className="flex items-center gap-2 mb-2">
            <Eye className="h-4 w-4 text-indigo-600" />
            <span className="font-medium">Conexões Ativas</span>
            {connectionUpdates.length > 0 && (
              <Activity className="h-3 w-3 text-blue-500 animate-pulse" />
            )}
          </div>
          <p className={`
            text-2xl font-bold
            ${hasRecentChanges && connectionUpdates.length > 0 ? 'text-blue-600' : 'text-indigo-600'}
          `}>
            {networkInfo.connectionCount}
          </p>
          <p className="text-sm text-muted-foreground">
            conexões de rede
          </p>
        </div>
      </div>

      {/* Show recent DNS/network updates */}
      {hasRecentChanges && (
        <div className="mt-3 space-y-1">
          {[...dnsUpdates, ...connectionUpdates].slice(0, 2).map((update) => (
            <div key={update.id} className="text-xs text-blue-600 bg-blue-50 dark:bg-blue-950/30 p-2 rounded">
              <span className="font-medium">{update.timestamp.toLocaleTimeString()}</span>: {update.message}
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

DNSNetworkInfoSection.displayName = 'DNSNetworkInfoSection';

// Main NetworkOverviewItem Component
const NetworkOverviewItem = memo(({ networkInfo, updates }: NetworkSectionProps) => {
  return (
    <div className="space-y-6">
      <NetworkInterfacesSection networkInfo={networkInfo} updates={updates} />
      <ConnectivityStatusSection networkInfo={networkInfo} updates={updates} />
      <DNSNetworkInfoSection networkInfo={networkInfo} updates={updates} />
    </div>
  );
});

NetworkOverviewItem.displayName = 'NetworkOverviewItem';

export default NetworkOverviewItem;
export { NetworkOverviewItem };
