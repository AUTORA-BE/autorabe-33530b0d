/**
 * Hook d'auto-sauvegarde des brouillons d'annonces
 * Sauvegarde automatique avec debounce 2s + flush à l'unmount
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

/** Persist draft to Supabase (standalone, no React state) */
async function persistDraft(draft: DraftData): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const formDataJson = JSON.parse(JSON.stringify(draft.formData));

  const { data: existing } = await supabase
    .from('listing_drafts')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  let error;
  if (existing) {
    ({ error } = await supabase
      .from('listing_drafts')
      .update({ form_data: formDataJson, photo_urls: draft.photoUrls })
      .eq('user_id', user.id));
  } else {
    ({ error } = await supabase
      .from('listing_drafts')
      .insert([{ user_id: user.id, form_data: formDataJson, photo_urls: draft.photoUrls }]));
  }

  return !error;
}

/**
 * Auto-sauvegarde le brouillon de l'annonce toutes les 2s
 * + flush immédiat quand le composant est démonté (navigation)
 * @param isEditMode - Ne pas sauvegarder en mode édition
 */
export function useAutoSaveDraft(isEditMode: boolean) {
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const draftRef = useRef<DraftData | null>(null);
  const savedRef = useRef(false);
  const draftLoadedRef = useRef(false); // prevents auto-save from overwriting before draft is loaded
  const [debouncedDraft, setDebouncedDraft] = useState<DraftData | null>(null);
  const debouncedValue = useDebounce(debouncedDraft, 2000);

  /** Met à jour les données du brouillon (appelé à chaque changement) */
  const updateDraft = useCallback((formData: SellCarFormWatchData, photoUrls: string[]) => {
    if (isEditMode) return;
    // Don't save until the draft has been loaded (prevents overwriting with defaults)
    if (!draftLoadedRef.current) return;

    // Only save if there's meaningful data
    const hasMeaningfulData = formData.brand || formData.model || (formData.price && formData.price > 0);
    if (!hasMeaningfulData) return;

    const draft = { formData, photoUrls };
    draftRef.current = draft;
    savedRef.current = false;
    setDebouncedDraft(draft);
  }, [isEditMode]);

  /** Sauvegarde effective dans Supabase (debounced) */
  useEffect(() => {
    if (!debouncedValue || isEditMode) return;

    const save = async () => {
      setIsSaving(true);
      try {
        const ok = await persistDraft(debouncedValue);
        if (ok) {
          savedRef.current = true;
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

  /** Flush on unmount — sauvegarde immédiate si des changements non persistés */
  useEffect(() => {
    return () => {
      if (!isEditMode && draftRef.current && !savedRef.current) {
        persistDraft(draftRef.current).catch((e) =>
          console.error('[AutoSave] Flush erreur:', e)
        );
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditMode]);

  /** Charge le brouillon existant */
  const loadDraft = useCallback(async (): Promise<DraftData | null> => {
    if (isEditMode) {
      draftLoadedRef.current = true;
      return null;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      draftLoadedRef.current = true;
      return null;
    }

    const { data, error } = await supabase
      .from('listing_drafts')
      .select('form_data, photo_urls')
      .eq('user_id', user.id)
      .maybeSingle();

    // Mark as loaded so updateDraft can start saving
    draftLoadedRef.current = true;

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

    draftRef.current = null;
    savedRef.current = true;
    setLastSaved(null);
  }, []);

  return { updateDraft, loadDraft, clearDraft, lastSaved, isSaving };
}
