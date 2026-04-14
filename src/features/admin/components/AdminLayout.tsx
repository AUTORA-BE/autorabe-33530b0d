/**
 * Admin Layout with Sidebar navigation
 * @module features/admin/components
 */

import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { useAdminAuth } from '../hooks/useAdminAuth';
import { AdminSidebar } from './AdminSidebar';

const AdminOverview = lazy(() => import('./pages/AdminOverview'));
const AdminUsersPage = lazy(() => import('./pages/AdminUsersPage'));
const AdminListingsPage = lazy(() => import('./pages/AdminListingsPage'));
const AdminConversationsPage = lazy(() => import('./pages/AdminConversationsPage'));
const AdminReportsPage = lazy(() => import('./pages/AdminReportsPage'));
const AdminLogsPage = lazy(() => import('./pages/AdminLogsPage'));
const AdminExportsPage = lazy(() => import('./pages/AdminExportsPage'));
const AdminStatsPage = lazy(() => import('./pages/AdminStatsPage'));
const AdminFuelPricesPage = lazy(() => import('./pages/AdminFuelPricesPage'));

function PageFallback() {
  return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  );
}

export default function AdminLayout() {
  const { isLoading, isAdmin } = useAdminAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar />
        <main className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 p-3 sm:p-6 max-w-7xl mx-auto w-full">
            <Suspense fallback={<PageFallback />}>
              <Routes>
                <Route index element={<AdminOverview />} />
                <Route path="users" element={<AdminUsersPage />} />
                <Route path="listings" element={<AdminListingsPage />} />
                <Route path="conversations" element={<AdminConversationsPage />} />
                <Route path="reports" element={<AdminReportsPage />} />
                <Route path="logs" element={<AdminLogsPage />} />
                <Route path="exports" element={<AdminExportsPage />} />
                <Route path="stats" element={<AdminStatsPage />} />
                <Route path="fuel-prices" element={<AdminFuelPricesPage />} />
                <Route path="*" element={<Navigate to="/admin" replace />} />
              </Routes>
            </Suspense>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
