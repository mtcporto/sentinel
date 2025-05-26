"use client";

import React, { memo } from 'react';
import { Cpu, HardDrive, MemoryStick, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { SystemMetric } from '@/types';

interface MetricUpdate {
  id: string;
  previousValue: number;
  currentValue: number;
  trend: 'up' | 'down' | 'stable';
}

interface MetricItemProps {
  metric: SystemMetric;
  update?: MetricUpdate;
  className?: string;
}

const ICON_MAP: Record<string, React.ElementType> = {
  cpu: Cpu,
  memory: MemoryStick,
  disk: HardDrive,
};

const TREND_ICONS = {
  up: TrendingUp,
  down: TrendingDown,
  stable: Minus,
};

export const MetricItem = memo(function MetricItem({ 
  metric, 
  update, 
  className = "" 
}: MetricItemProps) {
  const IconComponent = ICON_MAP[metric.id.toLowerCase()] || Cpu;
  const percentage = metric.maxValue ? (metric.value / metric.maxValue) * 100 : metric.value;
  
  // Color coding based on usage percentage
  const getColorClass = (pct: number) => {
    if (pct >= 90) return "text-destructive";
    if (pct >= 75) return "text-amber-500";
    if (pct >= 50) return "text-yellow-500";
    return "text-green-500";
  };
  
  const getProgressClass = (pct: number) => {
    if (pct >= 90) return "bg-destructive";
    if (pct >= 75) return "bg-amber-500";
    if (pct >= 50) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up': return 'text-red-500';
      case 'down': return 'text-green-500';
      default: return 'text-gray-500';
    }
  };

  const TrendIcon = update ? TREND_ICONS[update.trend] : null;
  
  return (
    <div className={`space-y-2 transition-all duration-300 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <IconComponent className={`h-6 w-6 ${getColorClass(percentage)} transition-colors duration-300`} />
          <span className="font-medium">{metric.name}</span>
          {update && TrendIcon && (
            <TrendIcon className={`h-4 w-4 ${getTrendColor(update.trend)} transition-colors duration-300`} />
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-sm font-mono font-bold ${getColorClass(percentage)} transition-colors duration-300`}>
            {metric.value.toFixed(1)}{metric.unit} {metric.maxValue && `/ ${metric.maxValue}${metric.unit}`}
          </span>
          {update && update.trend !== 'stable' && (
            <span className={`text-xs ${getTrendColor(update.trend)} transition-colors duration-300`}>
              {update.trend === 'up' ? '+' : ''}{(update.currentValue - update.previousValue).toFixed(1)}{metric.unit}
            </span>
          )}
        </div>
      </div>
      
      <div className="h-4 w-full bg-muted rounded-full overflow-hidden">
        <div 
          className={`h-full ${getProgressClass(percentage)} transition-all duration-500 ease-in-out`}
          style={{ width: `${percentage}%` }}
          aria-label={`${metric.name} at ${percentage.toFixed(0)}%`}
        />
      </div>
      
      {metric.description && (
        <p className="text-xs text-muted-foreground transition-opacity duration-300">
          {metric.description}
        </p>
      )}
    </div>
  );
});

MetricItem.displayName = 'MetricItem';
