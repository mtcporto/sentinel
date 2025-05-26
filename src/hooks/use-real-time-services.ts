// src/hooks/use-real-time-services.ts
"use client";

import { useState, useCallback, useRef, useEffect } from 'react';
import type { ServiceStatus } from '@/types';
import { getServiceStatus } from '@/lib/actions';

export interface ServiceUpdate {
  serviceId: string;
  previousStatus: ServiceStatus['status'];
  newStatus: ServiceStatus['status'];
  timestamp: Date;
}

export interface ServicesState {
  services: ServiceStatus[];
  isLoading: boolean;
  error: string | null;
  lastUpdate: Date | null;
  updates: ServiceUpdate[];
}

export interface UseRealTimeServicesOptions {
  refreshInterval?: number;
  enableAutoRefresh?: boolean;
}

export const useRealTimeServices = (options: UseRealTimeServicesOptions = {}) => {
  const {
    refreshInterval = 10000, // 10 seconds for services
    enableAutoRefresh = true
  } = options;

  const [servicesState, setServicesState] = useState<ServicesState>({
    services: [],
    isLoading: true,
    error: null,
    lastUpdate: null,
    updates: []
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const previousServicesRef = useRef<ServiceStatus[]>([]);
  const isInitialLoadRef = useRef(true);

  const fetchServicesData = useCallback(async () => {
    try {
      const newServices = await getServiceStatus();
      
      setServicesState(prevState => {
        const updates: ServiceUpdate[] = [];
        
        // Only track changes after initial load
        if (!isInitialLoadRef.current && previousServicesRef.current.length > 0) {
          // Compare each service with previous state
          newServices.forEach(newService => {
            const prevService = previousServicesRef.current.find(s => s.id === newService.id);
            if (prevService && prevService.status !== newService.status) {
              updates.push({
                serviceId: newService.id,
                previousStatus: prevService.status,
                newStatus: newService.status,
                timestamp: new Date()
              });
            }
          });
        }

        // Store current state as previous for next comparison
        previousServicesRef.current = prevState.services;
        isInitialLoadRef.current = false;

        return {
          services: newServices,
          isLoading: false,
          error: null,
          lastUpdate: new Date(),
          updates
        };
      });

    } catch (error) {
      console.error('Failed to fetch services data:', error);
      setServicesState(prevState => ({
        ...prevState,
        isLoading: false,
        error: 'Could not load service statuses.'
      }));
    }
  }, []);

  const startMonitoring = useCallback(() => {
    if (intervalRef.current || !enableAutoRefresh) return;
    
    fetchServicesData(); // Initial fetch
    intervalRef.current = setInterval(fetchServicesData, refreshInterval);
  }, [fetchServicesData, refreshInterval, enableAutoRefresh]);

  const stopMonitoring = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const refresh = useCallback(async () => {
    setServicesState(prev => ({ ...prev, isLoading: true, error: null }));
    await fetchServicesData();
  }, [fetchServicesData]);

  const clearUpdates = useCallback(() => {
    setServicesState(prev => ({
      ...prev,
      updates: []
    }));
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

  return {
    ...servicesState,
    refresh,
    startMonitoring,
    stopMonitoring,
    clearUpdates
  };
}
