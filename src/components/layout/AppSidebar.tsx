// src/components/layout/AppSidebar.tsx
"use client"

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';
import { BotIcon } from 'lucide-react';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { NAV_ITEMS } from '@/lib/consts';
import { cn } from '@/lib/utils';

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  disabled?: boolean;
}

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        <Link href="/" className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
          <BotIcon className="h-8 w-8 text-primary transition-all group-hover:scale-110" />
          <span className="text-xl font-semibold group-data-[collapsible=icon]:hidden">Sentinel AI</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {NAV_ITEMS.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={pathname === item.href}
                tooltip={{ children: item.label, className: "group-data-[collapsible=icon]:block hidden" }}
                className={cn(item.disabled && "cursor-not-allowed opacity-50")}
              >
                <Link href={item.disabled ? "#" : item.href}>
                  <item.icon />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-4 group-data-[collapsible=icon]:p-2">
        {/* Placeholder for footer content, e.g. settings or user profile */}
        <div className="text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
          &copy; {new Date().getFullYear()} Sentinel AI
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
