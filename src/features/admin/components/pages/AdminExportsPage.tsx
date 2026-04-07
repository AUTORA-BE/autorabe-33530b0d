/**
 * Admin Exports page — one-click data exports
 * @module features/admin/components/pages
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Download, Users, Car, AlertTriangle, ScrollText, MessageSquare, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { exportData } from '../../utils/exportData';
import type { ExportFormat } from '../../types/admin.types';
import { toast } from 'sonner';

interface ExportItem {
  label: string;
  icon: typeof Users;
  description: string;
  fetch: () => Promise<Record<string, unknown>[]>;
  filename: string;
}

export default function AdminExportsPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const items: ExportItem[] = [
    {
      label: 'Utilisateurs',
      icon: Users,
      description: 'Tous les profils utilisateurs',
      filename: 'utilisateurs',
      fetch: async () => {
        const { data } = await supabase.from('profiles').select('user_id, display_name, phone, garage_name, postal_code, suspended_at, created_at');
        return (data || []) as Record<string, unknown>[];
      },
    },
    {
      label: 'Annonces',
      icon: Car,
      description: 'Toutes les annonces véhicules',
      filename: 'annonces',
      fetch: async () => {
        const { data } = await supabase.from('car_listings').select('id, brand, model, year, price, mileage, fuel_type, status, location, contact_name, contact_email, created_at');
        return (data || []) as Record<string, unknown>[];
      },
    },
    {
      label: 'Signalements',
      icon: AlertTriangle,
      description: 'Tous les signalements',
      filename: 'signalements',
      fetch: async () => {
        const { data } = await supabase.from('reports').select('*');
        return (data || []) as Record<string, unknown>[];
      },
    },
    {
      label: 'Messages',
      icon: MessageSquare,
      description: 'Conversations et messages',
      filename: 'conversations',
      fetch: async () => {
        const { data } = await supabase.from('conversations').select('id, buyer_id, seller_id, car_brand, car_model, created_at, last_message_at');
        return (data || []) as Record<string, unknown>[];
      },
    },
    {
      label: 'Logs d\'activité',
      icon: ScrollText,
      description: 'Journal d\'audit complet',
      filename: 'audit_logs',
      fetch: async () => {
        let query = supabase.from('audit_log').select('*').order('created_at', { ascending: false }).limit(1000);
        if (dateFrom) query = query.gte('created_at', dateFrom);
        if (dateTo) query = query.lte('created_at', `${dateTo}T23:59:59`);
        const { data } = await query;
        return (data || []) as Record<string, unknown>[];
      },
    },
  ];

  const handleExport = async (item: ExportItem, format: ExportFormat) => {
    setLoading(item.filename);
    try {
      const data = await item.fetch();
      if (data.length === 0) {
        toast.info('Aucune donnée à exporter');
        return;
      }
      await exportData(data, item.filename, format);
      toast.success(`${item.label} exporté (${data.length} lignes)`);
    } catch (err) {
      console.error('Export error:', err);
      toast.error('Erreur lors de l\'export');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <SidebarTrigger />
        <h1 className="text-xl font-bold text-foreground">Exports</h1>
      </div>

      <div className="flex gap-2">
        <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-40" placeholder="Du" />
        <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-40" placeholder="Au" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {items.map(item => (
          <Card key={item.filename} className="border-border">
            <CardHeader className="p-4 pb-2">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <item.icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-sm">{item.label}</CardTitle>
                  <CardDescription className="text-[10px]">{item.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0 flex gap-1.5">
              {(['csv', 'json', 'xlsx'] as ExportFormat[]).map(fmt => (
                <Button
                  key={fmt}
                  size="sm"
                  variant="outline"
                  className="text-xs"
                  disabled={loading === item.filename}
                  onClick={() => handleExport(item, fmt)}
                >
                  {loading === item.filename ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Download className="h-3 w-3 mr-1" />}
                  {fmt.toUpperCase()}
                </Button>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
