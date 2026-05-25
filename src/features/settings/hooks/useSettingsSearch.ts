/**
 * Registry of searchable settings entries + filter hook.
 * @module features/settings/hooks
 */

import { useMemo } from "react";

export interface SettingsEntry {
  id: string;
  section: string;
  label: string;
  description?: string;
  keywords?: string[];
  action: () => void;
}

function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function useSettingsSearch(entries: SettingsEntry[], query: string) {
  return useMemo(() => {
    const q = normalize(query.trim());
    if (!q) return [] as SettingsEntry[];
    return entries.filter((e) => {
      const hay = normalize(
        [e.label, e.description ?? "", e.section, (e.keywords ?? []).join(" ")].join(" "),
      );
      return hay.includes(q);
    });
  }, [entries, query]);
}
