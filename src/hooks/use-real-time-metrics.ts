"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import type { SystemMetric } from '@/types';
import { getSystemMetrics } from '@/lib/actions';

interface UseRealTimeMetricsOptions {
  refreshInterval?: number; // in milliseconds
  enableOptimisticUpdates?: boolean;
}

interface MetricUpdate {
  id: string;
  previousValue: number;
  currentValue: number;
  trend: 'up' | 'down' | 'stable';
}

export function useRealTimeMetrics(options: UseRealTimeMetricsOptions = {}) {
  const {
    refreshInterval = 5000, // 5 seconds default
    enableOptimisticUpdates = true
  } = options;

  const [metrics, setMetrics] = useState<SystemMetric[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [updates, setUpdates] = useState<MetricUpdate[]>([]);
  
  const previousMetricsRef = useRef<SystemMetric[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchMetrics = useCallback(async () => {
    try {
      setError(null);
      const fetchedMetrics = await getSystemMetrics();
      
      // Calculate updates and trends
      const newUpdates: MetricUpdate[] = [];
      
      if (previousMetricsRef.current.length > 0) {
        fetchedMetrics.forEach(metric => {
          const previous = previousMetricsRef.current.find(p => p.id === metric.id);
          if (previous) {
            const trend = metric.value > previous.value ? 'up' : 
                         metric.value < previous.value ? 'down' : 'stable';
            
            newUpdates.push({
              id: metric.id,
              previousValue: previous.value,
              currentValue: metric.value,
              trend
            });
          }
        });
      }

      // Update state atomically
      setMetrics(prevMetrics => {
        // Only update if values actually changed
        const hasChanges = fetchedMetrics.some(metric => {
          const prev = prevMetrics.find(p => p.id === metric.id);
          return !prev || prev.value !== metric.value;
        });

        if (hasChanges || prevMetrics.length === 0) {
          previousMetricsRef.current = prevMetrics.length > 0 ? prevMetrics : fetchedMetrics;
          setUpdates(newUpdates);
          setLastUpdate(new Date());
          return fetchedMetrics;
        }
        
        return prevMetrics;
      });

      setIsLoading(false);
    } catch (err) {
      console.error("Failed to fetch system metrics:", err);
      setError("Could not load system metrics.");
      setIsLoading(false);
    }
  }, []);

  // Start/stop monitoring
  const startMonitoring = useCallback(() => {
    if (intervalRef.current) return;
    
    fetchMetrics(); // Initial fetch
    intervalRef.current = setInterval(fetchMetrics, refreshInterval);
  }, [fetchMetrics, refreshInterval]);

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

  // Get specific metric by ID
  const getMetric = useCallback((id: string) => {
    return metrics.find(m => m.id === id);
  }, [metrics]);

  // Get update info for specific metric
  const getMetricUpdate = useCallback((id: string) => {
    return updates.find(u => u.id === id);
  }, [updates]);

  // Manual refresh
  const refresh = useCallback(() => {
    return fetchMetrics();
  }, [fetchMetrics]);

  return {
    metrics,
    isLoading,
    error,
    lastUpdate,
    updates,
    getMetric,
    getMetricUpdate,
    refresh,
    startMonitoring,
    stopMonitoring
  };
}
