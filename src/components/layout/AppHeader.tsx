import { SidebarTrigger } from '@/components/ui/sidebar';
import { BotIcon } from 'lucide-react';

export function AppHeader() {
  return (
    <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:h-16 sm:px-6">
      <SidebarTrigger className="md:hidden" />
      <div className="flex items-center gap-2">
        <BotIcon className="h-7 w-7 text-primary" />
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          Sentinel AI
        </h1>
      </div>
      {/* Future elements like user menu or theme toggle can go here */}
    </header>
  );
}
