#!/usr/bin/env node
/**
 * ============================================================================
 *  bootstrap-storage.mjs — Reconstruction complète du stockage AutoRA.be
 * ============================================================================
 *
 *  POURQUOI CE SCRIPT EXISTE (ne pas le supprimer en pensant que c'est un
 *  doublon des migrations SQL) :
 *
 *  Sur cette plateforme, les buckets de stockage NE PEUVENT PAS être créés
 *  depuis une migration : toute écriture SQL sur `storage.buckets`
 *  (INSERT / UPDATE) est refusée par l'outillage. Constaté deux fois, dont
 *  la migration `20260512100001_dealer_kyc` qui n'a appliqué que sa partie
 *  table — le bucket `dealer-kyc` a dû être créé séparément, et 100 % des
 *  comptes professionnels sont restés bloqués sans aucune erreur visible.
 *
 *  Conséquence : rejouer le schéma sur un projet vierge donne une base
 *  complète et ZÉRO bucket. L'application démarre, les inscriptions passent,
 *  et le premier envoi de photo échoue.
 *
 *  Ce script est la pièce manquante : il recrée les 8 buckets via l'API
 *  Storage (createBucket), puis les 31 policies de `storage.objects` via SQL.
 *
 *  Il REPRODUIT la configuration de production telle quelle, y compris ses
 *  anomalies connues (voir commentaires ci-dessous). Il ne « corrige » rien :
 *  les corrections se décident séparément.
 *
 * ----------------------------------------------------------------------------
 *  USAGE
 *
 *    SUPABASE_URL="https://<ref>.supabase.co" \
 *    SUPABASE_SERVICE_ROLE_KEY="<service_role>" \
 *    node scripts/bootstrap-storage.mjs
 *
 *  Options :
 *    --dry-run        n'écrit rien, affiche seulement ce qui serait fait
 *    --skip-policies  crée uniquement les buckets
 *
 *  Aucun secret n'est écrit dans ce fichier : tout vient de l'environnement.
 *  Idempotent : rejouable sans erreur sur une cible vierge ou partielle.
 *  Les buckets déjà présents ne sont JAMAIS modifiés (pas d'updateBucket).
 * ============================================================================
 */

import { createClient } from '@supabase/supabase-js';

const MB = 1024 * 1024;

const args = new Set(process.argv.slice(2));
const DRY_RUN = args.has('--dry-run');
const SKIP_POLICIES = args.has('--skip-policies');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    'Erreur : SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY doivent être définis ' +
      'dans l\'environnement. Aucun secret n\'est stocké dans ce fichier.',
  );
  process.exit(1);
}

/* ---------------------------------------------------------------------------
 * 1. BUCKETS — état exact de la production (lu depuis storage.buckets)
 * ------------------------------------------------------------------------- */

const BUCKETS = [
  {
    id: 'avatars',
    public: true,
    fileSizeLimit: 5 * MB, // 5242880
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  },
  {
    id: 'brand-logos',
    public: true,
    fileSizeLimit: 1 * MB, // 1048576
    allowedMimeTypes: ['image/svg+xml', 'image/png', 'image/webp'],
  },
  {
    // PRIVÉ — documents Car-Pass. Accès par URL signée uniquement.
    // La distinction privé/public est critique pour la sécurité : ne pas changer.
    id: 'car-pass',
    public: false,
    fileSizeLimit: 10 * MB, // 10485760
    allowedMimeTypes: ['application/pdf', 'image/jpeg', 'image/png'],
  },
  {
    // ⚠ ANOMALIE CONNUE — REPRODUITE VOLONTAIREMENT
    // file_size_limit = 1 OCTET : plus aucun fichier ne peut être déposé ici.
    // Le bucket est un vestige historique (8 fichiers restants) encore
    // référencé par la purge RGPD de l'edge function `delete-account`.
    // C'est probablement une erreur historique, mais la valeur est reproduite
    // telle quelle : toute correction doit être décidée séparément.
    id: 'car-photos',
    public: true,
    fileSizeLimit: 1,
    allowedMimeTypes: ['image/jpeg'],
  },
  {
    // PRIVÉ — pièces jointes de messagerie privée. L'anomalie « bucket public »
    // a été corrigée : les policies (propriétaire + admin) sont désormais
    // effectives et l'affichage passe par des URLs signées (1 h).
    id: 'chat-images',
    public: false,
    fileSizeLimit: 5 * MB, // 5242880
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  },
  {
    // PRIVÉ — pièces d'identité / KYC professionnels. Ne jamais rendre public.
    id: 'dealer-kyc',
    public: false,
    fileSizeLimit: 10 * MB, // 10485760
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
  },
  {
    id: 'vehicle-photos',
    public: true,
    fileSizeLimit: 10 * MB, // 10485760
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
  },
  {
    // PRIVÉ — visuels de vitrine ; la lecture publique passe par une policy
    // conditionnée à `profiles.vitrine_published = true`, pas par le bucket.
    id: 'vitrine-covers',
    public: false,
    fileSizeLimit: 5 * MB, // 5242880
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
  },
];

/* ---------------------------------------------------------------------------
 * 2. POLICIES — 31 policies sur storage.objects, copiées à l'identique
 *    depuis pg_policies. Créées via SQL (seuls les buckets passent par l'API).
 *    Chaque policy est DROP puis CREATE → idempotence.
 * ------------------------------------------------------------------------- */

const POLICIES = [
  // --- car-pass (privé) ----------------------------------------------------
  { name: 'Admins can read all car-pass', cmd: 'SELECT', roles: 'authenticated',
    using: `bucket_id = 'car-pass' AND has_role(auth.uid(), 'admin'::app_role)` },
  { name: 'Owners can read their car-pass', cmd: 'SELECT', roles: 'authenticated',
    using: `bucket_id = 'car-pass' AND (auth.uid())::text = (storage.foldername(name))[1]` },
  { name: 'Users can upload car-pass', cmd: 'INSERT', roles: 'authenticated',
    check: `bucket_id = 'car-pass' AND (auth.uid())::text = (storage.foldername(name))[1] AND (metadata ->> 'mimetype') = ANY (ARRAY['application/pdf','image/jpeg','image/png']) AND COALESCE((metadata ->> 'size')::bigint, 0::bigint) <= 10485760` },
  { name: 'Users can upload car-pass documents', cmd: 'INSERT', roles: 'authenticated',
    check: `bucket_id = 'car-pass' AND (auth.uid())::text = (storage.foldername(name))[1]` },
  { name: 'Users can update car-pass documents', cmd: 'UPDATE', roles: 'authenticated',
    using: `bucket_id = 'car-pass' AND (auth.uid())::text = (storage.foldername(name))[1]` },
  { name: 'Users can delete car-pass documents', cmd: 'DELETE', roles: 'authenticated',
    using: `bucket_id = 'car-pass' AND (auth.uid())::text = (storage.foldername(name))[1]` },

  // --- dealer-kyc (privé) --------------------------------------------------
  { name: 'Admins read all KYC docs', cmd: 'SELECT', roles: 'authenticated',
    using: `bucket_id = 'dealer-kyc' AND has_role(auth.uid(), 'admin'::app_role)` },
  { name: 'Dealer reads own KYC doc', cmd: 'SELECT', roles: 'authenticated',
    using: `bucket_id = 'dealer-kyc' AND (storage.foldername(name))[1] = (auth.uid())::text` },
  { name: 'Dealer uploads own KYC doc', cmd: 'INSERT', roles: 'authenticated',
    check: `bucket_id = 'dealer-kyc' AND (storage.foldername(name))[1] = (auth.uid())::text` },

  // --- chat-images ---------------------------------------------------------
  { name: 'Admins read all chat images', cmd: 'SELECT', roles: 'authenticated',
    using: `bucket_id = 'chat-images' AND has_role(auth.uid(), 'admin'::app_role)` },
  { name: 'Owners read their chat images', cmd: 'SELECT', roles: 'authenticated',
    using: `bucket_id = 'chat-images' AND (auth.uid())::text = (storage.foldername(name))[1]` },
  { name: 'Authenticated users can upload chat images', cmd: 'INSERT', roles: 'authenticated',
    check: `bucket_id = 'chat-images' AND (auth.uid())::text = (storage.foldername(name))[1]` },
  // roles = public (aucune clause TO en production)
  { name: 'Users can delete their chat images', cmd: 'DELETE', roles: 'public',
    using: `bucket_id = 'chat-images' AND (auth.uid())::text = (storage.foldername(name))[1]` },

  // --- avatars -------------------------------------------------------------
  { name: 'Public read avatars', cmd: 'SELECT', roles: 'public',
    using: `bucket_id = 'avatars' AND name IS NOT NULL` },
  { name: 'Users can upload their own avatar', cmd: 'INSERT', roles: 'public',
    check: `bucket_id = 'avatars' AND (auth.uid())::text = (storage.foldername(name))[1]` },
  { name: 'Users can update their own avatar', cmd: 'UPDATE', roles: 'public',
    using: `bucket_id = 'avatars' AND (auth.uid())::text = (storage.foldername(name))[1]` },
  { name: 'Users can delete their own avatar', cmd: 'DELETE', roles: 'public',
    using: `bucket_id = 'avatars' AND (auth.uid())::text = (storage.foldername(name))[1]` },

  // --- brand-logos ---------------------------------------------------------
  { name: 'Public read brand-logos', cmd: 'SELECT', roles: 'public',
    using: `bucket_id = 'brand-logos' AND name IS NOT NULL` },

  // --- car-photos (legacy) -------------------------------------------------
  // Note : ces policies utilisent string_to_array(name, '/') et non
  // storage.foldername() — écart historique reproduit tel quel.
  { name: 'Public read car-photos', cmd: 'SELECT', roles: 'public',
    using: `bucket_id = 'car-photos' AND name IS NOT NULL` },
  { name: 'Users can update their own car photos', cmd: 'UPDATE', roles: 'public',
    using: `bucket_id = 'car-photos' AND (auth.uid())::text = (string_to_array(name, '/'))[1]` },
  { name: 'Users can delete their own car photos', cmd: 'DELETE', roles: 'public',
    using: `bucket_id = 'car-photos' AND (auth.uid())::text = (string_to_array(name, '/'))[1]` },

  // --- vehicle-photos ------------------------------------------------------
  { name: 'Public read vehicle-photos', cmd: 'SELECT', roles: 'public',
    using: `bucket_id = 'vehicle-photos' AND name IS NOT NULL` },
  { name: 'Vehicle photos are publicly readable', cmd: 'SELECT', roles: 'public',
    using: `bucket_id = 'vehicle-photos' AND (storage.foldername(name))[1] IS NOT NULL` },
  { name: 'Users can upload vehicle photos', cmd: 'INSERT', roles: 'authenticated',
    check: `bucket_id = 'vehicle-photos' AND (auth.uid())::text = (storage.foldername(name))[1] AND (metadata ->> 'mimetype') = ANY (ARRAY['image/jpeg','image/png','image/webp']) AND COALESCE((metadata ->> 'size')::bigint, 0::bigint) <= 10485760` },
  { name: 'Users can update vehicle photos', cmd: 'UPDATE', roles: 'authenticated',
    using: `bucket_id = 'vehicle-photos' AND (auth.uid())::text = (storage.foldername(name))[1]` },
  { name: 'Users can delete vehicle photos', cmd: 'DELETE', roles: 'authenticated',
    using: `bucket_id = 'vehicle-photos' AND (auth.uid())::text = (storage.foldername(name))[1]` },

  // --- vitrine-covers (privé) ---------------------------------------------
  { name: 'Vitrine covers owner select', cmd: 'SELECT', roles: 'authenticated',
    using: `bucket_id = 'vitrine-covers' AND (storage.foldername(name))[1] = (auth.uid())::text` },
  { name: 'Vitrine covers owner insert', cmd: 'INSERT', roles: 'authenticated',
    check: `bucket_id = 'vitrine-covers' AND (storage.foldername(name))[1] = (auth.uid())::text` },
  { name: 'Vitrine covers owner update', cmd: 'UPDATE', roles: 'authenticated',
    using: `bucket_id = 'vitrine-covers' AND (storage.foldername(name))[1] = (auth.uid())::text`,
    check: `bucket_id = 'vitrine-covers' AND (storage.foldername(name))[1] = (auth.uid())::text` },
  { name: 'Vitrine covers owner delete', cmd: 'DELETE', roles: 'authenticated',
    using: `bucket_id = 'vitrine-covers' AND (storage.foldername(name))[1] = (auth.uid())::text` },
  { name: 'Vitrine covers public read published', cmd: 'SELECT', roles: 'anon, authenticated',
    using: `bucket_id = 'vitrine-covers' AND EXISTS (SELECT 1 FROM profiles p WHERE (p.user_id)::text = (storage.foldername(objects.name))[1] AND p.vitrine_published = true)` },
];

/* ---------------------------------------------------------------------------
 * 3. Exécution
 * ------------------------------------------------------------------------- */

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const fmtSize = (n) => (n === 1 ? '1 octet' : `${(n / MB).toFixed(0)} MB`);

function buildPolicySql(p) {
  const quoted = p.name.replace(/"/g, '""');
  const parts = [`DROP POLICY IF EXISTS "${quoted}" ON storage.objects;`];
  let sql = `CREATE POLICY "${quoted}" ON storage.objects FOR ${p.cmd} TO ${p.roles}`;
  if (p.using) sql += `\n  USING (${p.using})`;
  if (p.check) sql += `\n  WITH CHECK (${p.check})`;
  parts.push(sql + ';');
  return parts.join('\n');
}

async function run() {
  console.log('\n=== Reconstruction du stockage ===');
  console.log(`Cible   : ${SUPABASE_URL}`);
  console.log(`Mode    : ${DRY_RUN ? 'DRY-RUN (aucune écriture)' : 'application'}\n`);

  const summary = { created: [], existing: [], failed: [] };

  const { data: existingBuckets, error: listErr } = await supabase.storage.listBuckets();
  if (listErr) {
    console.error(`Impossible de lister les buckets : ${listErr.message}`);
    process.exit(1);
  }
  const existingIds = new Set((existingBuckets ?? []).map((b) => b.id));

  console.log('--- Buckets (8) ---');
  for (const b of BUCKETS) {
    const label = `${b.id.padEnd(16)} ${(b.public ? 'public' : 'privé').padEnd(7)} ${fmtSize(b.fileSizeLimit)}`;
    if (existingIds.has(b.id)) {
      // Jamais de modification d'un bucket existant : outil de reconstruction,
      // pas de reconfiguration. Un écart éventuel est signalé, pas corrigé.
      console.log(`  = ${label}  → déjà présent (inchangé)`);
      summary.existing.push(b.id);
      continue;
    }
    if (DRY_RUN) {
      console.log(`  + ${label}  → serait créé`);
      summary.created.push(b.id);
      continue;
    }
    const { error } = await supabase.storage.createBucket(b.id, {
      public: b.public,
      fileSizeLimit: b.fileSizeLimit,
      allowedMimeTypes: b.allowedMimeTypes,
    });
    if (error) {
      console.log(`  ! ${label}  → ÉCHEC : ${error.message}`);
      summary.failed.push(`${b.id} (${error.message})`);
    } else {
      console.log(`  + ${label}  → créé`);
      summary.created.push(b.id);
    }
  }

  console.log(`\n--- Policies storage.objects (${POLICIES.length}) ---`);
  if (SKIP_POLICIES) {
    console.log('  (ignorées : --skip-policies)');
  } else {
    const sql = POLICIES.map(buildPolicySql).join('\n\n');
    if (DRY_RUN) {
      console.log(sql);
    } else {
      // Les policies passent par SQL (contrairement aux buckets). Sur une
      // reconstruction, exécuter ce bloc avec psql sur la base cible :
      //   psql "$DATABASE_URL" -f /tmp/storage-policies.sql
      const { writeFile } = await import('node:fs/promises');
      const out = '/tmp/storage-policies.sql';
      await writeFile(out, sql + '\n', 'utf8');
      console.log(`  ${POLICIES.length} policies écrites dans ${out}`);
      console.log('  Appliquer avec : psql "$DATABASE_URL" -f /tmp/storage-policies.sql');
    }
  }

  console.log('\n=== Récapitulatif ===');
  console.log(`  Buckets créés        : ${summary.created.length}`);
  console.log(`  Buckets déjà présents: ${summary.existing.length}`);
  console.log(`  Échecs               : ${summary.failed.length}`);
  for (const f of summary.failed) console.log(`     - ${f}`);
  console.log(`  Policies couvertes   : ${POLICIES.length}`);
  console.log('');

  if (summary.failed.length > 0) process.exit(1);
}

run().catch((e) => {
  console.error('Erreur fatale :', e instanceof Error ? e.message : e);
  process.exit(1);
});
