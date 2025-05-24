// src/components/dashboard/ServiceStatusWidget.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { ServiceStatus } from '@/types';
import { MOCK_SERVICE_STATUS } from '@/lib/consts';
import { ShieldCheck, ShieldAlert, ShieldX, ServerCog } from 'lucide-react';

const getStatusBadgeVariant = (status: ServiceStatus['status']): "default" | "secondary" | "destructive" | "outline" => {
  switch (status) {
    case 'Running':
      return 'default'; // Default often is primary, good for "Running"
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
  const [services, setServices] = useState<ServiceStatus[]>(MOCK_SERVICE_STATUS);

  // Optional: Add logic to randomly change service status for demo
  useEffect(() => {
    const interval = setInterval(() => {
      setServices(prevServices =>
        prevServices.map(service => {
          if (Math.random() < 0.1) { // 10% chance to change status
            const statuses: ServiceStatus['status'][] = ['Running', 'Stopped', 'Error'];
            return { ...service, status: statuses[Math.floor(Math.random() * statuses.length)] };
          }
          return service;
        })
      );
    }, 5000);
    return () => clearInterval(interval);
  }, []);


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
