/**
 * Admin Sidebar Navigation
 * @module features/admin/components
 */

import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Car, AlertTriangle, ScrollText, Download, LogOut, MessageSquare,
} from 'lucide-react';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupLabel, SidebarGroupContent,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter,
  SidebarTrigger, useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';

const NAV_ITEMS = [
  { title: 'Vue d\'ensemble', path: '/admin', icon: LayoutDashboard },
  { title: 'Utilisateurs', path: '/admin/users', icon: Users },
  { title: 'Annonces', path: '/admin/listings', icon: Car },
  { title: 'Conversations', path: '/admin/conversations', icon: MessageSquare },
  { title: 'Signalements', path: '/admin/reports', icon: AlertTriangle },
  { title: 'Logs d\'activité', path: '/admin/logs', icon: ScrollText },
  { title: 'Exports', path: '/admin/exports', icon: Download },
];

export function AdminSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';

  const isActive = (path: string) =>
    path === '/admin' ? location.pathname === '/admin' : location.pathname.startsWith(path);

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarHeader className="p-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <LayoutDashboard className="h-4 w-4 text-primary" />
          </div>
          {!collapsed && <span className="font-bold text-sm text-foreground">Admin AutoRa</span>}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton
                    onClick={() => navigate(item.path)}
                    isActive={isActive(item.path)}
                    tooltip={item.title}
                  >
                    <item.icon className="h-4 w-4" />
                    {!collapsed && <span>{item.title}</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-muted-foreground"
          onClick={() => navigate('/')}
        >
          <LogOut className="h-4 w-4 mr-2" />
          {!collapsed && 'Retour au site'}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
