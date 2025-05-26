// src/components/dashboard/ServiceItem.tsx
"use client";

import React, { memo } from 'react';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, ShieldAlert, ShieldX, ServerCog, Activity, ArrowUp, ArrowDown } from 'lucide-react';
import type { ServiceStatus } from '@/types';
import type { ServiceUpdate } from '@/hooks/use-real-time-services';

interface ServiceItemProps {
  service: ServiceStatus;
  updates?: ServiceUpdate[];
  className?: string;
}

const getStatusBadgeVariant = (status: ServiceStatus['status']): "default" | "secondary" | "destructive" | "outline" => {
  switch (status) {
    case 'Running':
      return 'default';
    case 'Stopped':
      return 'secondary';
    case 'Error':
      return 'destructive';
    case 'Pending':
      return 'outline';
    default:
      return 'outline';
  }
};

const getStatusIcon = (status: ServiceStatus['status']): React.ReactNode => {
  switch (status) {
    case 'Running':
      return <ShieldCheck className="h-4 w-4 text-green-500" />;
    case 'Stopped':
      return <ShieldX className="h-4 w-4 text-yellow-500" />;
    case 'Error':
      return <ShieldAlert className="h-4 w-4 text-red-500" />;
    case 'Pending':
      return <ServerCog className="h-4 w-4 text-blue-500 animate-spin" />;
    default:
      return <ServerCog className="h-4 w-4" />;
  }
};

const getStatusChangeIcon = (update: ServiceUpdate): React.ReactNode => {
  const isImprovement = 
    (update.previousStatus === 'Stopped' && update.newStatus === 'Running') ||
    (update.previousStatus === 'Error' && update.newStatus === 'Running') ||
    (update.previousStatus === 'Error' && update.newStatus === 'Stopped');

  return isImprovement ? 
    <ArrowUp className="h-3 w-3 text-green-500" /> : 
    <ArrowDown className="h-3 w-3 text-red-500" />;
};

export const ServiceItem = memo<ServiceItemProps>(({ 
  service, 
  updates = [],
  className = "" 
}) => {
  // Find the most recent update for this service
  const recentUpdate = updates
    .filter(update => update.serviceId === service.id)
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];

  const hasRecentChange = recentUpdate && 
    Date.now() - recentUpdate.timestamp.getTime() < 30000; // 30 seconds

  return (
    <li 
      className={`
        flex items-center justify-between p-3 rounded-md transition-all duration-300
        ${hasRecentChange ? 'bg-primary/10 ring-2 ring-primary/20' : 'bg-card-foreground/5'}
        ${className}
      `}
    >
      <div className="flex-1">
        <div className="flex items-center gap-2">
          {getStatusIcon(service.status)}
          <span className="font-medium">{service.name}</span>
          
          {/* Status change indicator */}
          {hasRecentChange && (
            <div className="flex items-center gap-1 ml-2">
              <Activity className="h-3 w-3 text-primary animate-pulse" />
              {getStatusChangeIcon(recentUpdate)}
              <span className="text-xs text-muted-foreground">
                Changed {Math.round((Date.now() - recentUpdate.timestamp.getTime()) / 1000)}s ago
              </span>
            </div>
          )}
        </div>
        
        {service.details && (
          <p className="text-xs text-muted-foreground mt-1">{service.details}</p>
        )}
        
        {/* Show status change details */}
        {hasRecentChange && (
          <p className="text-xs text-primary mt-1">
            Status changed from {recentUpdate.previousStatus} to {recentUpdate.newStatus}
          </p>
        )}
      </div>
      
      <div className="flex items-center gap-2">
        <Badge 
          variant={getStatusBadgeVariant(service.status)} 
          className={`
            capitalize text-xs transition-all duration-300
            ${hasRecentChange ? 'ring-2 ring-offset-1 ring-primary/30' : ''}
          `}
        >
          {service.status}
        </Badge>
      </div>
    </li>
  );
});

ServiceItem.displayName = 'ServiceItem';
