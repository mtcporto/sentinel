// filepath: /var/www/html/sentinel/src/components/dashboard/AlertsWidget.tsx
// src/components/dashboard/AlertsWidget.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertTriangle, Loader2, RefreshCw, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import type { SystemAlert } from '@/types';

export const AlertsWidget = () => {
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchAlerts = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const alertsResponse = await fetch('/api/system/alerts');

      if (!alertsResponse.ok) {
        throw new Error(`Erro ao buscar alertas: ${alertsResponse.statusText}`);
      }

      const alertsData = await alertsResponse.json();
      setAlerts(alertsData.alerts || []);
      setLastUpdate(new Date());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      console.error('Erro ao buscar alertas:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    
    // Atualizar a cada 30 segundos
    const interval = setInterval(fetchAlerts, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const getSeverityIcon = (severity: SystemAlert['severity']) => {
    switch (severity) {
      case 'Critical':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'Warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'Info':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
    }
  };

  const getSeverityBadge = (severity: SystemAlert['severity']) => {
    switch (severity) {
      case 'Critical':
        return <Badge variant="destructive">Crítico</Badge>;
      case 'Warning':
        return <Badge variant="secondary">Aviso</Badge>;
      case 'Info':
        return <Badge variant="outline">Info</Badge>;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(new Date(timestamp));
  };

  const criticalAlerts = alerts.filter(a => a.severity === 'Critical').length;
  const warningAlerts = alerts.filter(a => a.severity === 'Warning').length;

  if (isLoading) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-primary" />
            Alertas do Sistema
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-40">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-2">Carregando alertas...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xl flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-primary" />
            Alertas do Sistema
          </CardTitle>
          <Button variant="outline" size="sm" onClick={fetchAlerts}>
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
            <AlertTriangle className="h-5 w-5 text-primary" />
            Alertas do Sistema
          </CardTitle>
          <div className="flex items-center gap-2 mt-1">
            {criticalAlerts > 0 && (
              <Badge variant="destructive" className="text-xs">
                {criticalAlerts} crítico{criticalAlerts > 1 ? 's' : ''}
              </Badge>
            )}
            {warningAlerts > 0 && (
              <Badge variant="secondary" className="text-xs">
                {warningAlerts} aviso{warningAlerts > 1 ? 's' : ''}
              </Badge>
            )}
            {lastUpdate && (
              <span className="text-xs text-muted-foreground">
                • Atualizado às {formatTimestamp(lastUpdate.toISOString())}
              </span>
            )}
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={fetchAlerts} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>

      <CardContent>
        <ScrollArea className="h-80">
          <div className="space-y-3">
            {alerts.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-muted-foreground">
                <CheckCircle className="h-5 w-5 mr-2" />
                Nenhum alerta ativo
              </div>
            ) : (
              alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  {getSeverityIcon(alert.severity)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {getSeverityBadge(alert.severity)}
                    </div>
                    <p className="text-sm font-medium leading-tight">
                      {alert.message}
                    </p>
                    <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formatTimestamp(alert.timestamp)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
