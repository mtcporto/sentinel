"use client";

import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppHeader } from './AppHeader';
import { AppSidebar } from './AppSidebar';
import { useSidebarState } from '@/hooks/use-sidebar-state';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { isOpen, setIsOpen } = useSidebarState({
    autoCollapseBreakpoint: 768, // md breakpoint
    persistState: true,
    storageKey: 'sentinel-sidebar-state'
  });

  return (
    <SidebarProvider defaultOpen={isOpen} open={isOpen} onOpenChange={setIsOpen}>
      <AppSidebar />
      <SidebarInset className="flex flex-col">
        <AppHeader />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
