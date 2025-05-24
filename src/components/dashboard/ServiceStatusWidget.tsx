// src/components/dashboard/ServiceStatusWidget.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { ServiceStatus } from '@/types';
import { getServiceStatus } from '@/lib/actions';
import { ShieldCheck, ShieldAlert, ShieldX, ServerCog, Loader2 } from 'lucide-react';

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
}

export function ServiceStatusWidget() {
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchServices() {
      try {
        setIsLoading(true);
        setError(null);
        const fetchedServices = await getServiceStatus();
        setServices(fetchedServices);
      } catch (err) {
        console.error("Failed to fetch service status:", err);
        setError("Could not load service statuses.");
      } finally {
        setIsLoading(false);
      }
    }
    fetchServices();
    // TODO: Consider adding a refresh interval if real-time updates are desired
    // const interval = setInterval(fetchServices, 10000); // e.g., every 10 seconds
    // return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl">Service Status</CardTitle>
          <CardDescription>Current status of critical system services.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-40">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-2">Loading service statuses...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl">Service Status</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }
  
  if (services.length === 0) {
     return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl">Service Status</CardTitle>
          <CardDescription>Current status of critical system services. (No data available - implement server action)</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No service status data available. Please implement the `getServiceStatus` server action.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl">Service Status</CardTitle>
        <CardDescription>Current status of critical system services.</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {services.map((service) => (
            <li key={service.id} className="flex items-center justify-between p-3 bg-card-foreground/5 rounded-md">
              <div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(service.status)}
                  <span className="font-medium">{service.name}</span>
                </div>
                {service.details && <p className="text-xs text-muted-foreground mt-1">{service.details}</p>}
              </div>
              <Badge variant={getStatusBadgeVariant(service.status)} className="capitalize text-xs">
                {service.status}
              </Badge>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
