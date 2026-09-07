#!/usr/bin/env node
/**
 * ============================================================================
 *  backup-storage.mjs — Sauvegarde locale des fichiers de stockage AutoRA.be
 * ============================================================================
 *
 *  POURQUOI CE SCRIPT EXISTE (ne pas le supprimer en pensant qu'il fait double
 *  emploi avec les sauvegardes automatiques Supabase) :
 *
 *  Les sauvegardes quotidiennes de Supabase couvrent UNIQUEMENT la base de
 *  données. Documentation officielle, textuellement :
 *
 *    « Database backups do not include objects you store via the Storage API,
 *      as the database only includes metadata about these objects. »
 *
 *  Autrement dit : une restauration rend les tables, les annonces, les comptes
 *  et la DÉFINITION des buckets — mais pas les FICHIERS. Les objets de storage
 *  (photos de véhicules, Car-Pass, documents KYC, pièces jointes de messagerie)
 *  n'existent qu'à un seul endroit, sans aucune copie. C'est le seul élément du
 *  projet sans retour arrière possible.
 *
 *  Le risque principal n'est pas la panne de stockage — très improbable — mais
 *  la suppression accidentelle : un bug, une mauvaise manipulation admin.
 *  L'edge function `delete-account` supprime justement des objets de storage.
 *
 *  Volume à copier : ~43 Mo pour ~144 fichiers. C'est trivial. Il manquait
 *  seulement l'outil : le voici.
 *
 *  À NE PAS CONFONDRE avec `scripts/bootstrap-storage.mjs`, qui recrée les
 *  CONTENANTS vides (buckets + policies). Celui-ci sauvegarde leur CONTENU.
 *
 * ----------------------------------------------------------------------------
 *  USAGE
 *
 *    SUPABASE_URL="https://<ref>.supabase.co" \
 *    SUPABASE_SERVICE_ROLE_KEY="<service_role>" \
 *    BACKUP_DIR="./storage-backup" \
 *    node scripts/backup-storage.mjs
 *
 *  - La clé `service_role` est NÉCESSAIRE : les buckets privés (`car-pass`,
 *    `dealer-kyc`, `vitrine-covers`) contiennent les documents les plus
 *    sensibles et ne sont pas lisibles autrement.
 *  - `BACKUP_DIR` est optionnel (défaut : ./storage-backup).
 *  - Aucun secret n'est écrit dans ce fichier : tout vient de l'environnement.
 *  - Reprise : un fichier déjà présent en local avec exactement la même taille
 *    est ignoré. Relancer le script ne retélécharge pas les 43 Mo.
 *  - Code de sortie non nul si au moins un fichier a échoué, pour qu'une
 *    exécution automatisée (cron, CI) puisse le détecter.
 *
 *  ATTENTION : le dossier de sauvegarde contient des données personnelles
 *  (documents d'identité KYC, Car-Pass). Le stocker chiffré, ne jamais le
 *  committer. Ajouter `storage-backup/` à .gitignore si besoin.
 * ============================================================================
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import path from 'node:path';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BACKUP_DIR = process.env.BACKUP_DIR || './storage-backup';

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    'Erreur : SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont requis.\n' +
      '  SUPABASE_URL="https://<ref>.supabase.co" \\\n' +
      '  SUPABASE_SERVICE_ROLE_KEY="<service_role>" \\\n' +
      '  node scripts/backup-storage.mjs'
  );
  process.exit(2);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const PAGE_SIZE = 100;

const fmt = (bytes) => {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} ko`;
  return `${(bytes / 1024 / 1024).toFixed(1)} Mo`;
};

/**
 * Liste récursivement un bucket. Les fichiers sont rangés dans des
 * sous-dossiers par identifiant utilisateur : lister la racine ne suffit pas,
 * il faut descendre dans toute l'arborescence.
 * Un « dossier » se reconnaît à l'absence de metadata (id === null).
 */
async function listRecursive(bucket, prefix = '') {
  const files = [];
  let offset = 0;

  for (;;) {
    const { data, error } = await supabase.storage.from(bucket).list(prefix, {
      limit: PAGE_SIZE,
      offset,
      sortBy: { column: 'name', order: 'asc' },
    });
    if (error) throw new Error(`list ${bucket}/${prefix} : ${error.message}`);
    if (!data || data.length === 0) break;

    for (const entry of data) {
      const full = prefix ? `${prefix}/${entry.name}` : entry.name;
      const isFolder = entry.id === null || entry.metadata == null;
      if (isFolder) {
        files.push(...(await listRecursive(bucket, full)));
      } else {
        files.push({
          path: full,
          size: entry.metadata?.size ?? 0,
          mimetype: entry.metadata?.mimetype ?? null,
          updated_at: entry.updated_at ?? null,
        });
      }
    }

    if (data.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  return files;
}

async function alreadyBackedUp(destPath, size) {
  try {
    const st = await fs.stat(destPath);
    return st.isFile() && st.size === size;
  } catch {
    return false;
  }
}

async function downloadFile(bucket, objectPath, destPath) {
  const { data, error } = await supabase.storage.from(bucket).download(objectPath);
  if (error) throw new Error(error.message);
  await fs.mkdir(path.dirname(destPath), { recursive: true });
  const buffer = Buffer.from(await data.arrayBuffer());
  await fs.writeFile(destPath, buffer);
  return buffer.length;
}

async function main() {
  console.log('=== Sauvegarde du stockage AutoRA.be ===');
  console.log(`Destination : ${path.resolve(BACKUP_DIR)}\n`);

  const { data: buckets, error: bucketErr } = await supabase.storage.listBuckets();
  if (bucketErr) {
    console.error(`Impossible de lister les buckets : ${bucketErr.message}`);
    process.exit(1);
  }
  if (!buckets || buckets.length === 0) {
    console.error('Aucun bucket trouvé — vérifiez la clé service_role.');
    process.exit(1);
  }

  await fs.mkdir(BACKUP_DIR, { recursive: true });

  const manifest = {
    generated_at: new Date().toISOString(),
    supabase_url: SUPABASE_URL,
    buckets: {},
    files: [],
  };

  let downloaded = 0;
  let skipped = 0;
  const failures = [];
  let totalBytes = 0;

  // Tous les buckets sont parcourus, publics ET privés : les privés
  // (car-pass, dealer-kyc, vitrine-covers) sont justement les plus sensibles.
  for (const bucket of buckets.sort((a, b) => a.name.localeCompare(b.name))) {
    const visibility = bucket.public ? 'public' : 'privé';
    process.stdout.write(`\n[${bucket.name}] (${visibility}) listing… `);

    let files;
    try {
      files = await listRecursive(bucket.name);
    } catch (e) {
      console.log('ÉCHEC');
      console.error(`  ! ${e.message}`);
      failures.push({ bucket: bucket.name, path: '(listing)', error: e.message });
      continue;
    }

    console.log(`${files.length} fichier(s)`);
    manifest.buckets[bucket.name] = { public: bucket.public, file_count: files.length };

    for (const f of files) {
      const dest = path.join(BACKUP_DIR, bucket.name, f.path);
      totalBytes += f.size;
      manifest.files.push({
        bucket: bucket.name,
        path: f.path,
        size: f.size,
        mimetype: f.mimetype,
        updated_at: f.updated_at,
      });

      if (await alreadyBackedUp(dest, f.size)) {
        skipped++;
        console.log(`  = ${f.path} (déjà sauvegardé, ${fmt(f.size)})`);
        continue;
      }

      try {
        const written = await downloadFile(bucket.name, f.path, dest);
        downloaded++;
        console.log(`  ✓ ${f.path} (${fmt(written)})`);
      } catch (e) {
        failures.push({ bucket: bucket.name, path: f.path, error: e.message });
        console.log(`  ✗ ${f.path} — ${e.message}`);
      }
    }
  }

  const manifestPath = path.join(BACKUP_DIR, 'manifest.json');
  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));

  console.log('\n=== Récapitulatif ===');
  console.log(`Buckets parcourus  : ${Object.keys(manifest.buckets).length}`);
  console.log(`Fichiers référencés: ${manifest.files.length} (${fmt(totalBytes)})`);
  console.log(`Téléchargés        : ${downloaded}`);
  console.log(`Ignorés (à jour)   : ${skipped}`);
  console.log(`En échec           : ${failures.length}`);
  console.log(`Manifeste          : ${manifestPath}`);

  if (failures.length > 0) {
    console.error('\nFichiers en échec :');
    for (const f of failures) console.error(`  - ${f.bucket}/${f.path} : ${f.error}`);
    process.exit(1);
  }

  console.log('\nSauvegarde complète.');
}

main().catch((e) => {
  console.error(`\nErreur fatale : ${e.message}`);
  process.exit(1);
});
