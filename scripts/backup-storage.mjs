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
 *  À NE PAS CONFONDRE avec `scripts/bootstrap-storage.mjs`, qui recrée les
 *  CONTENANTS vides (buckets + policies). Celui-ci sauvegarde leur CONTENU.
 *
 * ----------------------------------------------------------------------------
 *  DEUX MODES D'AUTHENTIFICATION
 *
 *  Mode A — clé `service_role` (SUPABASE_SERVICE_ROLE_KEY présent).
 *    Accès total, contourne la RLS. C'est le mode idéal… mais sur Lovable
 *    Cloud cette clé n'est PAS accessible au propriétaire du projet. En
 *    pratique, ce mode n'est utilisable que sur un projet Supabase autogéré.
 *
 *  Mode B — compte administrateur (mode normal pour ce projet).
 *    Utilise la clé publique du frontend + une session administrateur réelle.
 *    Les policies RLS de `storage.objects` accordent déjà aux admins la
 *    lecture des buckets privés (`Admins can read all car-pass`,
 *    `Admins read all KYC docs`, `Admins read all chat images`), et les
 *    buckets publics sont lisibles par le rôle `public`. Une session admin
 *    ordinaire suffit donc.
 *
 *  LIMITE CONNUE — `vitrine-covers` n'a AUCUNE policy « admin ». En mode B, un
 *  administrateur n'y voit que ses propres fichiers et ceux des vitrines
 *  publiées. Le bucket est vide aujourd'hui, donc sans conséquence. Si un jour
 *  il se remplit : soit ajouter une policy admin en lecture, soit repasser en
 *  mode A. Décision volontairement NON prise ici.
 *
 *  POURQUOI PAS `listBuckets()` — `storage.buckets` n'a aucune policy RLS :
 *  une clé non-service reçoit une liste VIDE et le script croirait le stockage
 *  vide, sans la moindre erreur. La liste des 8 buckets est donc explicite
 *  ci-dessous, alignée sur `scripts/bootstrap-storage.mjs`.
 *
 * ----------------------------------------------------------------------------
 *  USAGE
 *
 *  Mode A (service_role) :
 *    SUPABASE_URL="https://<ref>.supabase.co" \
 *    SUPABASE_SERVICE_ROLE_KEY="<service_role>" \
 *    node scripts/backup-storage.mjs
 *
 *  Mode B (compte administrateur — mode normal ici) :
 *    SUPABASE_URL="https://<ref>.supabase.co" \
 *    SUPABASE_PUBLISHABLE_KEY="<clé publique>" \
 *    AUTORA_EMAIL="admin@exemple.be" \
 *    node scripts/backup-storage.mjs
 *    → le mot de passe est demandé à l'écran en saisie masquée.
 *      (ou via AUTORA_PASSWORD, déconseillé : il resterait dans l'historique)
 *
 *  - `BACKUP_DIR` est optionnel (défaut : ./storage-backup).
 *  - Aucun secret n'est écrit dans ce fichier ni sur disque : tout vient de
 *    l'environnement ou d'une saisie interactive non affichée.
 *  - Reprise : un fichier déjà présent en local avec exactement la même taille
 *    est ignoré. Relancer le script ne retélécharge pas tout.
 *  - Code de sortie non nul si au moins un fichier a échoué, pour qu'une
 *    exécution automatisée (cron, CI) puisse le détecter.
 *
 *  ATTENTION : le dossier de sauvegarde contient des données personnelles
 *  (documents d'identité KYC, Car-Pass). Le stocker chiffré, ne jamais le
 *  committer. `storage-backup/` est déjà dans .gitignore.
 * ============================================================================
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs/promises';
import path from 'node:path';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PUBLISHABLE_KEY =
  process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY;
const ADMIN_EMAIL = process.env.AUTORA_EMAIL;
const BACKUP_DIR = process.env.BACKUP_DIR || './storage-backup';

/**
 * Liste explicite des buckets — voir l'en-tête : `listBuckets()` renverrait
 * une liste vide en mode B. Doit rester alignée sur bootstrap-storage.mjs.
 */
const BUCKETS = [
  'avatars',
  'brand-logos',
  'car-pass',
  'car-photos',
  'chat-images',
  'dealer-kyc',
  'vehicle-photos',
  'vitrine-covers',
];

const USAGE = `Erreur : configuration d'authentification manquante.

Ce script accepte deux modes.

  Mode A — clé service_role (projet Supabase autogéré) :
    SUPABASE_URL="https://<ref>.supabase.co" \\
    SUPABASE_SERVICE_ROLE_KEY="<service_role>" \\
    node scripts/backup-storage.mjs

  Mode B — compte administrateur (mode normal pour AutoRA, la clé
  service_role n'étant pas accessible sur Lovable Cloud) :
    SUPABASE_URL="https://<ref>.supabase.co" \\
    SUPABASE_PUBLISHABLE_KEY="<clé publique du frontend>" \\
    AUTORA_EMAIL="<compte administrateur>" \\
    node scripts/backup-storage.mjs
    Le mot de passe est demandé à l'écran, en saisie masquée.

BACKUP_DIR est optionnel (défaut : ./storage-backup).`;

const PAGE_SIZE = 100;

const fmt = (bytes) => {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} ko`;
  return `${(bytes / 1024 / 1024).toFixed(1)} Mo`;
};

/**
 * Saisie masquée sur stdin : mode raw, aucun écho, rien dans l'historique du
 * shell. La valeur n'est jamais affichée ni écrite sur disque.
 */
function promptPassword(question) {
  return new Promise((resolve, reject) => {
    const { stdin, stdout } = process;
    if (!stdin.isTTY) {
      reject(
        new Error(
          "Aucun terminal interactif : renseignez AUTORA_PASSWORD ou lancez le script depuis un terminal."
        )
      );
      return;
    }

    stdout.write(question);
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');

    let value = '';
    const onData = (chunk) => {
      for (const ch of chunk) {
        if (ch === '\n' || ch === '\r' || ch === '\u0004') {
          stdin.setRawMode(false);
          stdin.pause();
          stdin.removeListener('data', onData);
          stdout.write('\n');
          resolve(value);
          return;
        }
        if (ch === '\u0003') {
          stdin.setRawMode(false);
          stdin.pause();
          stdin.removeListener('data', onData);
          stdout.write('\n');
          reject(new Error('Interrompu.'));
          return;
        }
        if (ch === '\u007f' || ch === '\b') {
          value = value.slice(0, -1);
        } else {
          value += ch;
        }
      }
    };

    stdin.on('data', onData);
  });
}

/**
 * Construit le client selon le mode disponible. Retourne { supabase, mode }.
 */
async function buildClient() {
  if (!SUPABASE_URL) {
    console.error(USAGE);
    process.exit(2);
  }

  // --- Mode A : service_role, comportement historique inchangé.
  if (SERVICE_ROLE_KEY) {
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    return { supabase, mode: 'service_role' };
  }

  // --- Mode B : session administrateur.
  if (!PUBLISHABLE_KEY || !ADMIN_EMAIL) {
    console.error(USAGE);
    process.exit(2);
  }

  let password = process.env.AUTORA_PASSWORD;
  if (!password) {
    try {
      password = await promptPassword(`Mot de passe pour ${ADMIN_EMAIL} : `);
    } catch (e) {
      console.error(`Erreur : ${e.message}`);
      process.exit(2);
    }
  }
  if (!password) {
    console.error('Erreur : mot de passe vide.');
    process.exit(2);
  }

  const supabase = createClient(SUPABASE_URL, PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { error } = await supabase.auth.signInWithPassword({
    email: ADMIN_EMAIL,
    password,
  });
  password = null;

  if (error) {
    console.error(
      `Connexion refusée pour ${ADMIN_EMAIL} : ${error.message}\n` +
        "Vérifiez l'adresse, le mot de passe, et que le compte est bien administrateur."
    );
    process.exit(1);
  }

  return { supabase, mode: 'admin_account' };
}

/**
 * Liste récursivement un bucket. Les fichiers sont rangés dans des
 * sous-dossiers par identifiant utilisateur : lister la racine ne suffit pas,
 * il faut descendre dans toute l'arborescence.
 * Un « dossier » se reconnaît à l'absence de metadata (id === null).
 */
async function listRecursive(supabase, bucket, prefix = '') {
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
        files.push(...(await listRecursive(supabase, bucket, full)));
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

async function downloadFile(supabase, bucket, objectPath, destPath) {
  const { data, error } = await supabase.storage.from(bucket).download(objectPath);
  if (error) throw new Error(error.message);
  await fs.mkdir(path.dirname(destPath), { recursive: true });
  const buffer = Buffer.from(await data.arrayBuffer());
  await fs.writeFile(destPath, buffer);
  return buffer.length;
}

async function main() {
  console.log('=== Sauvegarde du stockage AutoRA.be ===');

  const { supabase, mode } = await buildClient();

  console.log(
    mode === 'service_role'
      ? 'Mode : service_role (accès total, RLS contournée)'
      : `Mode : compte administrateur (${ADMIN_EMAIL}) — lecture via les policies RLS`
  );
  if (mode === 'admin_account') {
    console.log(
      'Note : `vitrine-covers` n\'a pas de policy admin — seuls vos propres\n' +
        '       fichiers et les vitrines publiées y seront visibles.'
    );
  }
  console.log(`Destination : ${path.resolve(BACKUP_DIR)}`);

  await fs.mkdir(BACKUP_DIR, { recursive: true });

  const manifest = {
    generated_at: new Date().toISOString(),
    supabase_url: SUPABASE_URL,
    mode,
    buckets: {},
    files: [],
  };

  let downloaded = 0;
  let skipped = 0;
  const failures = [];
  let totalBytes = 0;

  // Liste explicite : `listBuckets()` renverrait une liste vide en mode B.
  for (const bucket of BUCKETS) {
    process.stdout.write(`\n[${bucket}] listing… `);

    let files;
    try {
      files = await listRecursive(supabase, bucket);
    } catch (e) {
      console.log('ÉCHEC');
      console.error(`  ! ${e.message}`);
      failures.push({ bucket, path: '(listing)', error: e.message });
      manifest.buckets[bucket] = { file_count: 0, listing_failed: true };
      continue;
    }

    console.log(`${files.length} fichier(s)`);
    manifest.buckets[bucket] = { file_count: files.length };

    for (const f of files) {
      const dest = path.join(BACKUP_DIR, bucket, f.path);
      totalBytes += f.size;
      manifest.files.push({
        bucket,
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
        const written = await downloadFile(supabase, bucket, f.path, dest);
        downloaded++;
        console.log(`  ✓ ${f.path} (${fmt(written)})`);
      } catch (e) {
        failures.push({ bucket, path: f.path, error: e.message });
        console.log(`  ✗ ${f.path} — ${e.message}`);
      }
    }
  }

  const manifestPath = path.join(BACKUP_DIR, 'manifest.json');
  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));

  console.log('\n=== Récapitulatif ===');
  console.log(`Mode               : ${mode}`);
  console.log('Détail par bucket  :');
  for (const bucket of BUCKETS) {
    const info = manifest.buckets[bucket];
    const suffix = info?.listing_failed ? ' (listing en échec)' : '';
    console.log(
      `  - ${bucket.padEnd(16)} ${String(info?.file_count ?? 0).padStart(4)} fichier(s)${suffix}`
    );
  }
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
