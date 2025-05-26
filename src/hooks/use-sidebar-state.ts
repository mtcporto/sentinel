"use client";

import { useState, useEffect, useCallback } from 'react';

interface UseSidebarStateOptions {
  autoCollapseBreakpoint?: number; // px
  persistState?: boolean;
  storageKey?: string;
}

export function useSidebarState(options: UseSidebarStateOptions = {}) {
  const {
    autoCollapseBreakpoint = 768, // md breakpoint
    persistState = true,
    storageKey = 'sentinel-sidebar-state'
  } = options;

  const [isOpen, setIsOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Load saved state from localStorage
  useEffect(() => {
    if (persistState && typeof window !== 'undefined') {
      const saved = localStorage.getItem(storageKey);
      if (saved !== null) {
        const savedState = JSON.parse(saved);
        setIsOpen(savedState.isOpen);
      }
    }
  }, [persistState, storageKey]);

  // Handle window resize for auto-collapse
  useEffect(() => {
    const handleResize = () => {
      const windowWidth = window.innerWidth;
      const newIsMobile = windowWidth < autoCollapseBreakpoint;
      
      setIsMobile(newIsMobile);
      
      // Auto-collapse on mobile, but restore on desktop if previously open
      if (newIsMobile) {
        setIsOpen(false);
      } else if (persistState && typeof window !== 'undefined') {
        // Restore saved state on desktop
        const saved = localStorage.getItem(storageKey);
        if (saved !== null) {
          const savedState = JSON.parse(saved);
          setIsOpen(savedState.isOpen);
        } else {
          setIsOpen(true); // Default to open on desktop
        }
      } else {
        setIsOpen(true);
      }
    };

    // Set initial state
    handleResize();

    // Listen for resize events
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [autoCollapseBreakpoint, persistState, storageKey]);

  // Save state to localStorage when it changes (desktop only)
  useEffect(() => {
    if (persistState && !isMobile && typeof window !== 'undefined') {
      localStorage.setItem(storageKey, JSON.stringify({ isOpen }));
    }
  }, [isOpen, isMobile, persistState, storageKey]);

  const toggle = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  return {
    isOpen,
    isMobile,
    setIsOpen,
    toggle,
    open,
    close
  };
}
