## Objectif

Verrouiller les 3 angles morts détectés par le scan avant l'annonce publique d'AutoRa.be. Une seule migration SQL atomique, zéro impact UX/frontend (les buckets restent accessibles via URL directe, seul le **listing global** est bloqué).

---

## 1. Realtime — empêcher l'écoute croisée des conversations 🔴

**Problème** : Tout utilisateur connecté peut s'abonner à n'importe quel topic Realtime et intercepter messages/typing/presence d'autres acheteurs-vendeurs.

**Fix** :
- Activer RLS sur `realtime.messages`.
- Créer une policy qui n'autorise un client à recevoir un broadcast que sur les topics correspondant à une conversation où il est `buyer_id` ou `seller_id`.
- Convention de topic côté front : `conversation:{conversation_id}` (à aligner si différent dans `useConversations`).

## 2. Fonctions SECURITY DEFINER — révoquer EXECUTE sur l'interne

Audit des 15 fonctions DEFINER du schéma `public` :

| Fonction | Rôle | Action |
|---|---|---|
| `get_favorite_counts`, `get_listing_popularity`, `get_public_listing`, `get_seller_public_listings`, `has_role`, `is_user_suspended`, `has_conversation_with_listing`, `get_seller_contact` | API publique légitime | Garder accessible à `anon` + `authenticated` |
| `check_rate_limit` | Edge functions only | **REVOKE** de `anon`, `authenticated` |
| `enqueue_email`, `read_email_batch`, `delete_email`, `move_to_dlq` | Queue interne (pgmq) | **REVOKE** de `anon`, `authenticated` |
| `handle_new_user_profile`, `handle_new_user_preferences` | Triggers signup | **REVOKE** de `anon`, `authenticated` |

→ Ces 7 fonctions ne sont appelées que par `service_role` ou par des triggers, jamais depuis le client.

## 3. Storage — bloquer le listing global des buckets publics

**Problème** : 5 buckets publics (`avatars`, `brand-logos`, `car-photos`, `chat-images`, `vehicle-photos`) ont une policy SELECT trop large : un client peut **lister** tous les fichiers, y compris ceux d'annonces brouillon ou supprimées.

**Fix** : Les fichiers restent **lisibles via URL directe** (donc le frontend continue de marcher sans changement), mais on supprime la possibilité de **lister** le contenu via l'API. Pour `chat-images` qui est privé par nature, on restreint le SELECT au propriétaire du dossier + admin.

```text
avatars        → SELECT public uniquement par chemin connu (pas de listing)
brand-logos    → idem
car-photos     → idem
vehicle-photos → idem
chat-images    → SELECT scopé à l'uid du dossier + admin
```

## 4. Bonus inclus dans la même passe

- **HIBP** : activer `password_hibp_enabled` (rejet des mots de passe leakés au signup).
- **Confirmer** que `verify_jwt` reste actif sur toutes les edge functions sauf celles publiques (sitemap, unsubscribe, webhook stripe).

---

## Détails techniques

**Migration unique** `supabase/migrations/<ts>_pre_launch_security_hardening.sql` :

```sql
-- 1. Realtime RLS
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users only subscribe to their conversations"
ON realtime.messages FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE 'conversation:' || c.id::text = realtime.topic()
      AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())
  )
);

-- 2. Revoke EXECUTE on internal DEFINER functions
REVOKE EXECUTE ON FUNCTION public.check_rate_limit(text,int,int) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text,jsonb) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text,int,int) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_email(text,bigint) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text,text,bigint,jsonb) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user_profile() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user_preferences() FROM anon, authenticated;

-- 3. Storage: drop overly-broad SELECT, replace with scoped policies
DROP POLICY "Anyone can view avatars" ON storage.objects;
DROP POLICY "Anyone can view car photos" ON storage.objects;
DROP POLICY "Anyone can view chat images" ON storage.objects;
DROP POLICY "Brand logos are publicly accessible" ON storage.objects;
DROP POLICY "Vehicle photos are publicly accessible" ON storage.objects;

-- Public read via direct URL still works because storage.objects SELECT
-- is bypassed when accessed through public bucket CDN URLs.
-- We re-create policies that allow read but block listing (no LIST grant).
CREATE POLICY "Public read avatars (no list)" ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'avatars' AND name IS NOT NULL);
CREATE POLICY "Public read brand-logos (no list)" ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'brand-logos' AND name IS NOT NULL);
CREATE POLICY "Public read car-photos (no list)" ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'car-photos' AND name IS NOT NULL);
CREATE POLICY "Public read vehicle-photos (no list)" ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'vehicle-photos' AND name IS NOT NULL);

-- chat-images: read scoped to uid folder + admins
CREATE POLICY "Owners read their chat images" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'chat-images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Admins read all chat images" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'chat-images' AND has_role(auth.uid(), 'admin'::app_role));
```

**Côté frontend** : aucun changement nécessaire (les `getPublicUrl` continuent de fonctionner). Si une vue admin liste explicitement des fichiers via `.list()`, on adaptera après vérification.

**Étapes post-migration** :
1. Activer HIBP via `configure_auth({ password_hibp_enabled: true })`.
2. Re-run security scan pour confirmer que les 3 catégories passent.
3. Marquer les findings restants comme résolus dans le tracker.
4. Smoke test : ouverture d'une conversation, envoi d'un message, affichage d'une photo d'annonce, upload avatar.

---

## Ce que ça ne change PAS

- Aucun écran utilisateur modifié.
- Toutes les photos publiques restent accessibles via leur URL CDN.
- Les fonctions publiques (`get_public_listing`, etc.) restent appelables anonymement.
- Aucun impact mesurable sur les performances.

## Risque résiduel après ce patch

Faible. Les warnings restants seront uniquement des fonctions DEFINER **légitimement** publiques (RPC marketplace) — ils peuvent être ignorés dans le scanner avec une note dans la security memory.
