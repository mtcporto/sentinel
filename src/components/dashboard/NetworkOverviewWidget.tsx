'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Wifi, Globe, Shield, RefreshCw } from 'lucide-react';
import { NetworkOverviewItem } from './NetworkOverviewItem';
import { useRealTimeNetworkOverview } from '@/hooks/use-real-time-network-overview';

export function NetworkOverviewWidget() {
  const { networkInfo, isLoading, lastUpdate, updates, refresh } = useRealTimeNetworkOverview();
  
  // Check if there are recent changes (within last 30 seconds)
  const hasChanges = updates.some(update => 
    Date.now() - update.timestamp.getTime() < 30000
  );

  return (
    <Card className="relative overflow-hidden">
      {hasChanges && (
        <div className="absolute inset-0 ring-2 ring-orange-500/30 rounded-lg animate-pulse" />
      )}
      
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            <Wifi className="h-6 w-6" />
            Visão Geral de Rede
          </CardTitle>
          <CardDescription>
            Status de conectividade e interfaces de rede
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <Badge variant="outline" className="text-orange-600 border-orange-300 bg-orange-50">
              Mudanças detectadas
            </Badge>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={refresh}
            disabled={isLoading}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {networkInfo && <NetworkOverviewItem networkInfo={networkInfo} updates={updates} />}
        
        {!networkInfo && !isLoading && (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum dado de rede disponível
          </div>
        )}
      </CardContent>
    </Card>
  );
}