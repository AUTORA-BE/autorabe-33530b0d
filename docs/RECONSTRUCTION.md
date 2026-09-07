# Reconstruction de l'environnement AutoRA.be

Procédure pour remonter un environnement complet (base + stockage + secrets)
sur un projet Supabase vierge.

---

## Deux limites de plateforme à connaître avant de commencer

**1. Les buckets de stockage ne peuvent pas être créés depuis une migration.**
Toute écriture SQL sur `storage.buckets` (INSERT comme UPDATE) est refusée par
l'outillage. Constaté deux fois : la migration `20260512100001_dealer_kyc`
n'avait appliqué que sa partie table, et le bucket `dealer-kyc` a dû être créé
séparément — pendant ce temps, 100 % des comptes professionnels étaient bloqués
sans qu'aucune erreur ne le signale.
→ D'où l'existence de `scripts/bootstrap-storage.mjs`. Ce n'est **pas** un
doublon des migrations : c'est la seule source de vérité pour les buckets.

**2. La chaîne de migrations n'est pas rejouable telle quelle.**
Certaines migrations historiques supposent un état intermédiaire de la base ou
ont été corrigées après coup côté production uniquement. Un `db push` linéaire
depuis zéro n'est pas garanti. Repartir de la baseline SQL consolidée plutôt que
de rejouer l'historique migration par migration, puis appliquer les migrations
postérieures à la baseline.

---

## Ordre de reconstruction

### 1. Schéma de base

```bash
supabase link --project-ref <NOUVEAU_REF>
psql "$DATABASE_URL" -f supabase/combined_migrations.sql   # baseline consolidée
supabase db push                                            # migrations postérieures
```

Vérifier ensuite que les extensions attendues sont présentes
(`pg_trgm`, `pg_net`, `pg_cron`, `pgmq`, `supabase_vault`).

### 2. Stockage (buckets + policies)

```bash
SUPABASE_URL="https://<ref>.supabase.co" \
SUPABASE_SERVICE_ROLE_KEY="<service_role>" \
node scripts/bootstrap-storage.mjs --dry-run    # inspection

SUPABASE_URL="https://<ref>.supabase.co" \
SUPABASE_SERVICE_ROLE_KEY="<service_role>" \
node scripts/bootstrap-storage.mjs              # application
```

Le script crée les **8 buckets** et génère les **31 policies** de
`storage.objects` dans `/tmp/storage-policies.sql` :

```bash
psql "$DATABASE_URL" -f /tmp/storage-policies.sql
```

Il est idempotent : rejouable sur une cible vierge ou partielle. Il ne modifie
jamais un bucket déjà existant.

| Bucket           | Accès  | Limite   | Types acceptés                    |
|------------------|--------|----------|-----------------------------------|
| `avatars`        | public | 5 MB     | jpeg, png, webp, gif              |
| `brand-logos`    | public | 1 MB     | svg, png, webp                    |
| `car-pass`       | privé  | 10 MB    | pdf, jpeg, png                    |
| `car-photos`     | public | 1 octet  | jpeg — voir anomalies             |
| `chat-images`    | privé  | 5 MB     | jpeg, png, webp, gif              |
| `dealer-kyc`     | privé  | 10 MB    | jpeg, png, webp, pdf              |
| `vehicle-photos` | public | 10 MB    | jpeg, png, webp                   |
| `vitrine-covers` | privé  | 5 MB     | jpeg, png, webp                   |

**Anomalies reproduites volontairement** (à arbitrer séparément, pas au moment
d'une reconstruction) :
- `car-photos` a une limite de **1 octet** : plus rien ne peut y être déposé,
  alors qu'il contient encore 8 fichiers référencés par la purge RGPD de
  l'edge function `delete-account`.
- `chat-images` était public : **corrigé**, le bucket est désormais privé et
  les pièces jointes sont affichées via des URLs signées (1 h).

### 2 bis. Restauration des fichiers de stockage

`bootstrap-storage.mjs` recrée les **contenants vides**. Leur **contenu** doit
être re-téléversé depuis la sauvegarde locale produite par
`scripts/backup-storage.mjs` (voir « Sauvegardes et restauration » plus bas) :

```bash
# structure de la sauvegarde : <BACKUP_DIR>/<bucket>/<chemin d'origine>
for bucket in "$BACKUP_DIR"/*/; do
  name="$(basename "$bucket")"
  supabase storage cp -r "$bucket" "ss:///$name" --experimental
done
```

Vérifier ensuite que le nombre de fichiers par bucket correspond au
`manifest.json` de la sauvegarde.

### 3. Secrets


Secrets des edge functions à renseigner :

```
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
STRIPE_PRICE_*        (un par palier d'abonnement)
STRIPE_PRODUCT_*
RESEND_API_KEY
ALLOWED_ORIGINS
VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY
PAYMENTS_ENABLED      (absent ou "false" = paiements coupés, réponse 403)
```

Variables front (build) :

```
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
VITE_SUPABASE_PROJECT_ID
VITE_PAYMENTS_ENABLED
```

Configurer aussi les fournisseurs OAuth (Google) et les URLs de redirection.

### 4. Edge functions

```bash
for fn in supabase/functions/*/; do
  supabase functions deploy "$(basename "$fn")" --project-ref <REF>
done
```

### 5. Vérifications finales

```sql
-- 8 lignes attendues
select id, public, file_size_limit from storage.buckets order by id;

-- 31 lignes attendues
select count(*) from pg_policies
where schemaname = 'storage' and tablename = 'objects';

-- toutes les tables publiques doivent avoir RLS activée
select relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity;
```

Puis, côté application :
1. créer un compte, vérifier l'e-mail de bienvenue ;
2. publier une annonce avec photos → écrit dans `vehicle-photos` ;
3. téléverser un Car-Pass → écrit dans `car-pass`, lecture par URL signée ;
4. envoyer une image en messagerie → écrit dans `chat-images` ;
5. lancer un parcours KYC professionnel → écrit dans `dealer-kyc` ;
6. vérifier le sitemap et les balises OG sur une fiche véhicule.
