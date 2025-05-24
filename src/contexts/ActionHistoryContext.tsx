// src/contexts/ActionHistoryContext.tsx
"use client";

import type { ActionRecord } from '@/types';
import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { MOCK_ACTION_HISTORY_INITIAL_STATE } from '@/lib/consts';

interface ActionHistoryContextType {
  actionHistory: ActionRecord[];
  addAction: (action: Omit<ActionRecord, 'id' | 'timestamp'>) => void;
  updateActionStatus: (id: string, status: ActionRecord['status'], details?: string) => void;
}

const ActionHistoryContext = createContext<ActionHistoryContextType | undefined>(undefined);

export const ActionHistoryProvider = ({ children }: { children: ReactNode }) => {
  const [actionHistory, setActionHistory] = useState<ActionRecord[]>(MOCK_ACTION_HISTORY_INITIAL_STATE);

  const addAction = useCallback((action: Omit<ActionRecord, 'id' | 'timestamp'>) => {
    setActionHistory(prevHistory => [
      { 
        ...action, 
        id: `action-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, 
        timestamp: new Date().toISOString() 
      },
      ...prevHistory,
    ]);
  }, []);

  const updateActionStatus = useCallback((id: string, status: ActionRecord['status'], details?: string) => {
    setActionHistory(prevHistory => 
      prevHistory.map(action => 
        action.id === id ? { ...action, status, details: details || action.details } : action
      )
    );
  }, []);

  return (
    <ActionHistoryContext.Provider value={{ actionHistory, addAction, updateActionStatus }}>
      {children}
    </ActionHistoryContext.Provider>
  );
};

export const useActionHistory = () => {
  const context = useContext(ActionHistoryContext);
  if (context === undefined) {
    throw new Error('useActionHistory must be used within an ActionHistoryProvider');
  }
  return context;
};
