/**
 * Admin Duplicates — détecte annonces similaires (marque/modèle/année + km ±500)
 * @module features/admin/components/pages
 */

import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Copy, Trash2, ExternalLink, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

const KM_TOLERANCE = 500;

interface Listing {
  id: string;
  user_id: string;
  brand: string;
  model: string;
  year: number;
  mileage: number;
  price: number;
  status: string;
  created_at: string;
  contact_email: string | null;
  contact_name: string | null;
  photos: string[] | null;
}

interface DuplicateGroup {
  key: string;
  brand: string;
  model: string;
  year: number;
  mileageBucket: number;
  listings: Listing[];
}

async function fetchAllListings(): Promise<Listing[]> {
  const { data, error } = await supabase
    .from('car_listings')
    .select('id, user_id, brand, model, year, mileage, price, status, created_at, contact_email, contact_name, photos')
    .in('status', ['pending', 'approved'])
    .order('created_at', { ascending: false })
    .limit(2000);
  if (error) throw error;
  return (data ?? []) as Listing[];
}

/** Group listings by brand+model+year, then cluster by km within ±KM_TOLERANCE */
function buildDuplicateGroups(listings: Listing[]): DuplicateGroup[] {
  const byBmy = new Map<string, Listing[]>();
  for (const l of listings) {
    const k = `${l.brand.trim().toLowerCase()}|${l.model.trim().toLowerCase()}|${l.year}`;
    const arr = byBmy.get(k) ?? [];
    arr.push(l);
    byBmy.set(k, arr);
  }

  const groups: DuplicateGroup[] = [];
  for (const [, items] of byBmy) {
    if (items.length < 2) continue;
    // Sort by mileage to cluster sequentially
    const sorted = [...items].sort((a, b) => a.mileage - b.mileage);
    let cluster: Listing[] = [sorted[0]];
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i].mileage - cluster[cluster.length - 1].mileage <= KM_TOLERANCE) {
        cluster.push(sorted[i]);
      } else {
        if (cluster.length >= 2) groups.push(makeGroup(cluster));
        cluster = [sorted[i]];
      }
    }
    if (cluster.length >= 2) groups.push(makeGroup(cluster));
  }
  // Most recent first
  return groups.sort(
    (a, b) => new Date(b.listings[0].created_at).getTime() - new Date(a.listings[0].created_at).getTime(),
  );
}

function makeGroup(cluster: Listing[]): DuplicateGroup {
  const first = cluster[0];
  const avgKm = Math.round(cluster.reduce((s, l) => s + l.mileage, 0) / cluster.length);
  return {
    key: `${first.brand}-${first.model}-${first.year}-${avgKm}`,
    brand: first.brand,
    model: first.model,
    year: first.year,
    mileageBucket: avgKm,
    listings: cluster,
  };
}

export default function AdminDuplicatesPage() {
  const qc = useQueryClient();
  const [acting, setActing] = useState<string | null>(null);

  const { data: listings, isLoading, error } = useQuery({
    queryKey: ['admin', 'duplicates', 'listings'],
    queryFn: fetchAllListings,
  });

  const groups = useMemo(() => (listings ? buildDuplicateGroups(listings) : []), [listings]);

  async function logAction(actionType: string, targetId: string, metadata?: Record<string, unknown>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('admin_actions').insert([{
      admin_id: user.id,
      action_type: actionType,
      target_type: 'car_listing',
      target_id: targetId,
      metadata: (metadata ?? {}) as never,
    }]);
  }

  async function closeListing(id: string) {
    setActing(id);
    try {
      const { error } = await supabase
        .from('car_listings')
        .update({ status: 'rejected' })
        .eq('id', id);
      if (error) throw error;
      await logAction('close_duplicate', id);
      toast.success('Annonce clôturée');
      qc.invalidateQueries({ queryKey: ['admin'] });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setActing(null);
    }
  }

  async function deleteListing(id: string) {
    setActing(id);
    try {
      const { error } = await supabase.from('car_listings').delete().eq('id', id);
      if (error) throw error;
      await logAction('delete_duplicate', id);
      toast.success('Annonce supprimée');
      qc.invalidateQueries({ queryKey: ['admin'] });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setActing(null);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-destructive">Erreur : {(error as Error).message}</CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Copy className="h-6 w-6 text-primary" />
            Doublons d'annonces
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Annonces similaires (même marque, modèle, année, km ±{KM_TOLERANCE}) — pending ou approved.
          </p>
        </div>
        <Badge variant="secondary" className="text-sm">
          {groups.length} groupe{groups.length > 1 ? 's' : ''} détecté{groups.length > 1 ? 's' : ''}
        </Badge>
      </div>

      {groups.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            <Copy className="h-12 w-12 mx-auto mb-3 opacity-30" />
            Aucun doublon détecté. Belle base de données ✨
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {groups.map((group) => (
            <Card key={group.key}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 flex-wrap">
                  <AlertTriangle className="h-4 w-4 text-warning" />
                  {group.brand} {group.model} ({group.year})
                  <Badge variant="outline" className="font-normal">
                    ~{group.mileageBucket.toLocaleString('fr-BE')} km
                  </Badge>
                  <Badge variant="secondary">{group.listings.length} annonces</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {group.listings.map((l) => {
                  const cover = l.photos?.[0];
                  return (
                    <div
                      key={l.id}
                      className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-accent/30 transition-colors"
                    >
                      {cover ? (
                        <img
                          src={cover}
                          alt=""
                          className="h-14 w-14 rounded-md object-cover flex-shrink-0"
                          loading="lazy"
                        />
                      ) : (
                        <div className="h-14 w-14 rounded-md bg-muted flex items-center justify-center text-xs text-muted-foreground flex-shrink-0">
                          —
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm text-foreground truncate">
                            {l.contact_name || 'Vendeur'}
                          </span>
                          <Badge variant={l.status === 'approved' ? 'default' : 'secondary'} className="text-[10px]">
                            {l.status}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {l.mileage.toLocaleString('fr-BE')} km · {l.price.toLocaleString('fr-BE')} € ·{' '}
                          {new Date(l.created_at).toLocaleDateString('fr-BE')}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Button
                          asChild
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title="Voir l'annonce"
                        >
                          <a href={`/cars/${l.id}`} target="_blank" rel="noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={acting === l.id || l.status === 'rejected'}
                          onClick={() => closeListing(l.id)}
                        >
                          Clôturer
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              disabled={acting === l.id}
                              title="Supprimer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Supprimer cette annonce ?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Action irréversible. L'annonce sera définitivement supprimée de la base.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annuler</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteListing(l.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Supprimer
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
