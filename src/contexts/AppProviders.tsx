// src/contexts/AppProviders.tsx
"use client";

import React, { type ReactNode } from 'react';
import { ActionHistoryProvider } from './ActionHistoryContext';

export const AppProviders = ({ children }: { children: ReactNode }) => {
  return (
    <ActionHistoryProvider>
      {children}
    </ActionHistoryProvider>
  );
};
