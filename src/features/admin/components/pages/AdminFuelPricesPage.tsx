/**
 * Admin page for managing fuel prices displayed on the homepage
 * @module features/admin/components/pages
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Droplets, Flame, Zap, Save, Loader2, RefreshCw } from 'lucide-react';
import { useFuelPrices } from '../../hooks/useFuelPrices';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface FuelField {
  key: 'diesel' | 'essence95' | 'essence98' | 'electric_home' | 'electric_public';
  label: string;
  unit: string;
  icon: typeof Droplets;
  step: string;
}

const FUEL_FIELDS: FuelField[] = [
  { key: 'diesel', label: 'Diesel B7', unit: '€/L', icon: Droplets, step: '0.001' },
  { key: 'essence95', label: 'Essence E10 (95)', unit: '€/L', icon: Flame, step: '0.001' },
  { key: 'essence98', label: 'Essence E98', unit: '€/L', icon: Flame, step: '0.001' },
  { key: 'electric_home', label: 'Électricité domicile', unit: '€/kWh', icon: Zap, step: '0.001' },
  { key: 'electric_public', label: 'Électricité publique', unit: '€/kWh', icon: Zap, step: '0.001' },
];

export default function AdminFuelPricesPage() {
  const { prices, loading, saving, updatePrices } = useFuelPrices();
  const [form, setForm] = useState<Record<string, string>>({});
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (prices) {
      const initial: Record<string, string> = {};
      FUEL_FIELDS.forEach(f => {
        initial[f.key] = String(prices[f.key]);
      });
      setForm(initial);
      setDirty(false);
    }
  }, [prices]);

  const handleChange = (key: string, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setDirty(true);
  };

  const handleSave = () => {
    const updated: Record<string, number> = {};
    FUEL_FIELDS.forEach(f => {
      const val = parseFloat(form[f.key]);
      if (!isNaN(val) && val > 0) updated[f.key] = val;
    });
    updatePrices(updated);
    setDirty(false);
  };

  const handleReset = () => {
    if (prices) {
      const initial: Record<string, string> = {};
      FUEL_FIELDS.forEach(f => {
        initial[f.key] = String(prices[f.key]);
      });
      setForm(initial);
      setDirty(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-lg sm:text-2xl font-bold text-foreground">Prix carburants</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Modifiez les prix affichés sur la page d'accueil et le calculateur TCO
          </p>
        </div>
        {prices?.updated_at && (
          <Badge variant="outline" className="text-[10px] sm:text-xs">
            Dernière MAJ : {format(new Date(prices.updated_at), "dd MMM yyyy à HH:mm", { locale: fr })}
          </Badge>
        )}
      </div>

      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Flame className="w-4 h-4 text-primary" />
            Prix du marché belge
          </CardTitle>
          <CardDescription className="text-xs">
            Ces prix sont affichés en temps réel sur le site. Mettez-les à jour quotidiennement.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {FUEL_FIELDS.map(field => {
              const Icon = field.icon;
              return (
                <div key={field.key} className="space-y-1.5">
                  <Label className="text-xs flex items-center gap-1.5">
                    <Icon className="w-3.5 h-3.5 text-primary/70" />
                    {field.label}
                    <span className="text-muted-foreground/60 ml-auto">{field.unit}</span>
                  </Label>
                  <Input
                    type="number"
                    step={field.step}
                    min="0"
                    value={form[field.key] || ''}
                    onChange={e => handleChange(field.key, e.target.value)}
                    className="h-9 text-sm font-mono"
                  />
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-border/50">
            <Button
              onClick={handleSave}
              disabled={!dirty || saving}
              size="sm"
              className="gap-1.5"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Enregistrer
            </Button>
            <Button
              onClick={handleReset}
              disabled={!dirty}
              variant="outline"
              size="sm"
              className="gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Annuler
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
