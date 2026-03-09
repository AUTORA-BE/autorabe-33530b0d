/**
 * Hook d'auto-sauvegarde des brouillons d'annonces
 * Sauvegarde automatique avec debounce 2s dans la table listing_drafts
 *
 * @module features/listings/hooks/useAutoSaveDraft
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useDebounce } from '@/shared/hooks';
import type { SellCarFormWatchData } from '@/components/SellCarForm';

interface DraftData {
  formData: SellCarFormWatchData;
  photoUrls: string[];
}

/**
 * Auto-sauvegarde le brouillon de l'annonce toutes les 2s
 * @param isEditMode - Ne pas sauvegarder en mode édition
 */
export function useAutoSaveDraft(isEditMode: boolean) {
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const draftRef = useRef<DraftData | null>(null);
  const [debouncedDraft, setDebouncedDraft] = useState<DraftData | null>(null);
  const debouncedValue = useDebounce(debouncedDraft, 2000);

  /** Met à jour les données du brouillon (appelé à chaque changement) */
  const updateDraft = useCallback((formData: SellCarFormWatchData, photoUrls: string[]) => {
    if (isEditMode) return;
    const draft = { formData, photoUrls };
    draftRef.current = draft;
    setDebouncedDraft(draft);
  }, [isEditMode]);

  /** Sauvegarde effective dans Supabase */
  useEffect(() => {
    if (!debouncedValue || isEditMode) return;

    const save = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setIsSaving(true);
      try {
        // Vérifier si un brouillon existe déjà
        const { data: existing } = await supabase
          .from('listing_drafts')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        const formDataJson = JSON.parse(JSON.stringify(debouncedValue.formData));

        let error;
        if (existing) {
          ({ error } = await supabase
            .from('listing_drafts')
            .update({
              form_data: formDataJson,
              photo_urls: debouncedValue.photoUrls,
            })
            .eq('user_id', user.id));
        } else {
          ({ error } = await supabase
            .from('listing_drafts')
            .insert([{
              user_id: user.id,
              form_data: formDataJson,
              photo_urls: debouncedValue.photoUrls,
            }]));
        }

        if (!error) {
          setLastSaved(new Date());
        }
      } catch (e) {
        console.error('[AutoSave] Erreur:', e);
      } finally {
        setIsSaving(false);
      }
    };

    save();
  }, [debouncedValue, isEditMode]);

  /** Charge le brouillon existant */
  const loadDraft = useCallback(async (): Promise<DraftData | null> => {
    if (isEditMode) return null;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('listing_drafts')
      .select('form_data, photo_urls')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error || !data) return null;

    return {
      formData: data.form_data as unknown as SellCarFormWatchData,
      photoUrls: data.photo_urls ?? [],
    };
  }, [isEditMode]);

  /** Supprime le brouillon (après publication) */
  const clearDraft = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('listing_drafts')
      .delete()
      .eq('user_id', user.id);

    setLastSaved(null);
  }, []);

  return { updateDraft, loadDraft, clearDraft, lastSaved, isSaving };
}
