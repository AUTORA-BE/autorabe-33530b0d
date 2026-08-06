/**
 * Admin page for managing Belgian tax brackets (TMC + annual tax + age reductions).
 * @module features/admin/components/pages
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Save, Calculator, Euro, Percent, Calendar } from 'lucide-react';
import { useTaxBrackets, type Region, type TmcBracket, type AnnualTaxBracket, type AgeReduction } from '../../hooks/useTaxBrackets';

const REGIONS: { value: Region; label: string }[] = [
  { value: 'bruxelles', label: 'Bruxelles' },
  { value: 'wallonie', label: 'Wallonie' },
  { value: 'flandre', label: 'Flandre' },
];

function TmcRow({ row, onSave }: { row: TmcBracket; onSave: (id: string, val: number) => void }) {
  const [value, setValue] = useState(String(row.base_amount));
  const dirty = parseFloat(value) !== Number(row.base_amount);
  return (
    <div className="grid grid-cols-[1fr_auto_auto] gap-2 items-center">
      <Badge variant="secondary" className="text-[11px] justify-self-start">
        {row.cv_min === row.cv_max ? `${row.cv_min} CV` : `${row.cv_min}-${row.cv_max === 999 ? '17+' : row.cv_max} CV`}
      </Badge>
      <Input
        type="number"
        step="0.01"
        min="0"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="h-8 w-28 text-xs font-mono"
      />
      <Button
        size="sm"
        variant={dirty ? 'default' : 'ghost'}
        disabled={!dirty}
        onClick={() => onSave(row.id, parseFloat(value))}
        className="h-8 px-2"
      >
        <Save className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
}

function AnnualRow({
  row,
  onSave,
}: {
  row: AnnualTaxBracket;
  onSave: (id: string, patch: Partial<AnnualTaxBracket>) => void;
}) {
  const [base, setBase] = useState(String(row.base_amount));
  const [diesel, setDiesel] = useState(String(row.diesel_surcharge_pct));
  const [lpg, setLpg] = useState(String(row.lpg_surcharge_per_cv));
  const [electric, setElectric] = useState(String(row.electric_amount));

  const dirty =
    parseFloat(base) !== Number(row.base_amount) ||
    parseFloat(diesel) !== Number(row.diesel_surcharge_pct) ||
    parseFloat(lpg) !== Number(row.lpg_surcharge_per_cv) ||
    parseFloat(electric) !== Number(row.electric_amount);

  return (
    <div className="grid grid-cols-[auto_1fr_1fr_1fr_1fr_auto] gap-2 items-center text-xs">
      <Badge variant="secondary" className="text-[11px]">
        {row.cv_min === row.cv_max ? `${row.cv_min}` : `${row.cv_min}-${row.cv_max === 999 ? '17+' : row.cv_max}`}
      </Badge>
      <Input type="number" step="0.01" value={base} onChange={(e) => setBase(e.target.value)} className="h-8 text-xs font-mono" />
      <Input type="number" step="0.01" value={diesel} onChange={(e) => setDiesel(e.target.value)} className="h-8 text-xs font-mono" />
      <Input type="number" step="0.01" value={lpg} onChange={(e) => setLpg(e.target.value)} className="h-8 text-xs font-mono" />
      <Input type="number" step="0.01" value={electric} onChange={(e) => setElectric(e.target.value)} className="h-8 text-xs font-mono" />
      <Button
        size="sm"
        variant={dirty ? 'default' : 'ghost'}
        disabled={!dirty}
        onClick={() =>
          onSave(row.id, {
            base_amount: parseFloat(base),
            diesel_surcharge_pct: parseFloat(diesel),
            lpg_surcharge_per_cv: parseFloat(lpg),
            electric_amount: parseFloat(electric),
          })
        }
        className="h-8 px-2"
      >
        <Save className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
}

function AgeRow({ row, onSave }: { row: AgeReduction; onSave: (id: string, val: number) => void }) {
  const [value, setValue] = useState(String(row.coefficient));
  const dirty = parseFloat(value) !== Number(row.coefficient);
  const label =
    row.age_max_years === null
      ? `${row.age_min_years}+ ans`
      : `${row.age_min_years}-${row.age_max_years} an${row.age_max_years > 1 ? 's' : ''}`;
  return (
    <div className="grid grid-cols-[1fr_auto_auto] gap-2 items-center">
      <Badge variant="secondary" className="text-[11px] justify-self-start">{label}</Badge>
      <Input
        type="number"
        step="0.01"
        min="0"
        max="1"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="h-8 w-28 text-xs font-mono"
      />
      <Button size="sm" variant={dirty ? 'default' : 'ghost'} disabled={!dirty} onClick={() => onSave(row.id, parseFloat(value))} className="h-8 px-2">
        <Save className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
}

export default function AdminTaxBracketsPage() {
  const { data, isLoading, updateTmc, updateAnnual, updateAgeReduction } = useTaxBrackets();
  const [region, setRegion] = useState<Region>('bruxelles');

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const tmcRows = data.tmc.filter((b) => b.region === region);
  const annualRows = data.annual.filter((b) => b.region === region);
  const ageRows = data.ages.filter((b) => b.region === region);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-lg sm:text-2xl font-bold text-foreground flex items-center gap-2">
          <Calculator className="w-5 h-5 text-primary" />
          Barèmes fiscaux belges
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          TMC, taxe annuelle et coefficients de réduction par âge — modifiables sans redéploiement.
        </p>
      </div>

      <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 space-y-2">
        <p className="flex items-center gap-2 text-sm font-semibold text-destructive">
          <AlertTriangle className="w-4 h-4" />
          Ces barèmes ne sont plus utilisés par le site
        </p>
        <div className="text-xs text-muted-foreground space-y-1.5 leading-relaxed">
          <p>
            Les tables ci-dessous contiennent un barème unique fondé sur les chevaux fiscaux, copié à
            l'identique pour les trois régions et non indexé. Il ne correspond plus au droit en vigueur :
          </p>
          <ul className="list-disc pl-4 space-y-0.5">
            <li>la Wallonie a abandonné le calcul aux CV le 01/07/2025 (formule CO₂ / masse / énergie) ;</li>
            <li>la Flandre applique la formule BIV (CO₂, norme Euro, âge) ;</li>
            <li>Bruxelles retient le plus élevé de deux grilles (kW et CV).</li>
          </ul>
          <p>
            Le calcul affiché aux utilisateurs provient désormais de <code>src/lib/belgianTax.ts</code>
            (barèmes officiels du {new Date(BAREME_VALIDE_DEPUIS).toLocaleDateString('fr-BE')} au{' '}
            {new Date(BAREME_VALIDE_JUSQUAU).toLocaleDateString('fr-BE')}). Ces barèmes sont indexés chaque
            1er juillet et doivent être mis à jour dans le code.
          </p>
          {baremePerime() && (
            <p className="font-semibold text-destructive">
              Le barème du code est périmé depuis le{' '}
              {new Date(BAREME_VALIDE_JUSQUAU).toLocaleDateString('fr-BE')} : mise à jour requise.
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">

        {REGIONS.map((r) => (
          <Button
            key={r.value}
            size="sm"
            variant={region === r.value ? 'default' : 'outline'}
            onClick={() => setRegion(r.value)}
            className="h-8 text-xs"
          >
            {r.label}
          </Button>
        ))}
      </div>

      <Tabs defaultValue="tmc" className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-9">
          <TabsTrigger value="tmc" className="text-xs gap-1.5"><Euro className="w-3.5 h-3.5" />TMC</TabsTrigger>
          <TabsTrigger value="annual" className="text-xs gap-1.5"><Percent className="w-3.5 h-3.5" />Annuelle</TabsTrigger>
          <TabsTrigger value="age" className="text-xs gap-1.5"><Calendar className="w-3.5 h-3.5" />Âge</TabsTrigger>
        </TabsList>

        <TabsContent value="tmc">
          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">TMC — montant de base par tranche CV</CardTitle>
              <CardDescription className="text-xs">
                Taxe de Mise en Circulation (paiement unique). Le coefficient d'âge s'applique automatiquement.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {tmcRows.map((row) => (
                <TmcRow key={row.id} row={row} onSave={(id, base_amount) => updateTmc.mutate({ id, base_amount })} />
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="annual">
          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Taxe de circulation annuelle</CardTitle>
              <CardDescription className="text-xs">
                Base €, surcharge diesel %, surcharge LPG €/CV, montant électrique €.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-[auto_1fr_1fr_1fr_1fr_auto] gap-2 text-[10px] uppercase tracking-wide text-muted-foreground px-1">
                <span>CV</span>
                <span>Base €</span>
                <span>Diesel %</span>
                <span>LPG €/CV</span>
                <span>Électr. €</span>
                <span />
              </div>
              {annualRows.map((row) => (
                <AnnualRow key={row.id} row={row} onSave={(id, patch) => updateAnnual.mutate({ id, ...patch })} />
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="age">
          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Coefficients de réduction par âge</CardTitle>
              <CardDescription className="text-xs">
                Multiplicateur appliqué au montant TMC selon l'âge du véhicule. Flandre utilise une formule linéaire (-5%/an).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {ageRows.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">Aucun coefficient configuré.</p>
              ) : (
                ageRows.map((row) => (
                  <AgeRow key={row.id} row={row} onSave={(id, coefficient) => updateAgeReduction.mutate({ id, coefficient })} />
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
