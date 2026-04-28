## Objectif
Corriger les 3 blockers de sécurité restants pour rendre AutoRA réellement publishable, puis valider les checks finaux.

## Phase 1 — Sécurité bloquante (obligatoire avant launch)

### 1.1 Realtime `car_listings` — fuite contacts vendeurs
- Retirer `car_listings` de la publication `supabase_realtime` (recommandé), OU
- Créer une policy SELECT publique restreinte à `status = 'approved'` et créer une **vue publique** sans `contact_phone`/`contact_email` à utiliser pour Realtime.
- Migration SQL : `ALTER PUBLICATION supabase_realtime DROP TABLE public.car_listings;`
- Auditer le frontend : remplacer toute subscription Realtime sur `car_listings` par du polling React Query (déjà en place dans `vehicleQueries.ts`).

### 1.2 Realtime `messages` — fuite conversations privées
- Activer RLS sur `realtime.messages` avec policy scopée par `auth.uid()` et participation à la conversation.
- Migration : policy qui vérifie via `conversations` table que l'user est participant du topic souscrit.

### 1.3 Linter Supabase — 37 issues
- Corriger la **Security Definer View** (ERROR) → passer en `security_invoker = true`.
- Revoke `EXECUTE` sur les functions `SECURITY DEFINER` non destinées au public (~10 warns) ou les passer en `SECURITY INVOKER`.
- Restreindre les policies SELECT des 5 storage buckets publics : remplacer `USING (true)` par un filtrage explicite (ex: dossier scopé par `auth.uid()` pour `chat-images`).
- Corriger les policies RLS `USING (true)` sur INSERT/UPDATE/DELETE.

## Phase 2 — Hygiène repo

### 2.1 `.gitignore`
- Ajouter `.env` (et `.env.local`, `.env.*.local`) à `.gitignore`.
- Note : les clés actuelles sont des `VITE_*` (publiques par design), donc pas besoin de les rotater — juste arrêter de les tracker.

## Phase 3 — Vérifications finales (post-déploiement)

- Tester `https://autora.be/sitemap.xml` → HTTP 200
- Tester `https://www.autora.be` → redirige vers apex
- Cookie banner GDPR : tester FR/NL/DE/EN
- Lighthouse mobile : viser ≥90 (mesurer après publish)
- Confirmer `IS_BETA_MODE = true` est bien voulu pour le launch (= Pro features gratuites pour tous)

## Détails techniques

**Migration Realtime car_listings :**
```sql
ALTER PUBLICATION supabase_realtime DROP TABLE public.car_listings;
```

**Policy realtime.messages (exemple) :**
```sql
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users subscribe to own conversations only"
ON realtime.messages FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id::text = (regexp_match(realtime.messages.topic, 'conversation:(.+)'))[1]
      AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())
  )
);
```

**Storage buckets** : auditer `vehicle-photos`, `car-pass`, `chat-images`, `avatars` — restreindre SELECT au propriétaire ou via un path scopé `{user_id}/...`.

## Hors scope
- Rotation des clés Supabase (inutile, ce sont des clés publiques anon)
- Refonte UI/UX
- Nouvelles features
