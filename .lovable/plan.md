
# Plan — Audit de migration Lovable Cloud → Supabase externe

## Objectif
Produire **un seul fichier** `MIGRATION_ASSESSMENT.md` à la racine du repo, basé uniquement sur le contenu réel des fichiers (citations chemin:ligne + extraits). Aucune autre modification de code.

## Méthode (lecture seule)

1. **Section 1 — `@lovable.dev/cloud-auth-js`**
   - `rg -n "@lovable.dev/cloud-auth-js" src/`
   - Pour chaque occurrence : ouvrir le fichier, extraire la ligne d'import + chaque méthode appelée (`signInWithOAuth`, `setSession`, etc.).
   - Compter le nombre d'appels distincts à remplacer.

2. **Section 2 — `LOVABLE_API_KEY`**
   - `rg -n "LOVABLE_API_KEY" supabase/functions/ src/`
   - Pour chaque Edge Function : extraire le `Deno.env.get(...)`, l'URL appelée (`ai.gateway.lovable.dev/...`), et le `model` passé.
   - Déterminer s'il s'agit uniquement du chatbot fiscal (`explain-taxes`, `car-chat`) ou aussi d'autres usages (matching, modération, embeddings).

3. **Section 3 — Edge Functions**
   - `ls supabase/functions/` + `wc -l` sur chaque `index.ts`.
   - Pour chaque fonction : `rg "Deno.env.get"` pour secrets, `rg "fetch\("` pour endpoints externes.

4. **Section 4 — Migrations SQL**
   - `ls -la supabase/migrations/`
   - Comptages via `rg -c` :
     - `CREATE TABLE`, `CREATE POLICY`, `CREATE (OR REPLACE )?FUNCTION`, `CREATE TRIGGER`, `CREATE INDEX`, `CREATE EXTENSION`
   - `rg "auth\.users" supabase/migrations/` pour détecter les FK directs.

5. **Section 5 — Dépendances Vercel**
   - `rg -n "@vercel/speed-insights" src/`
   - Vérifier présence de `vercel.json`, `.vercel/`, workflow GH Actions Vercel.
   - Croiser avec `DEPLOYMENT.md` (déjà connu : il mentionne Vercel) pour conclure si c'est actif ou résiduel.

6. **Section 6 — Realtime**
   - Côté client : `rg -n "\.channel\(|\.subscribe\(" src/`
   - Côté DB : `rg -n "ALTER PUBLICATION supabase_realtime" supabase/migrations/`
   - Lister les tables effectivement publiées.

7. **Section 7 — Estimation honnête**
   - Fourchette d'heures par axe (schéma, edge functions, auth, AI Gateway, E2E) + marge de sécurité recommandée, basée sur les volumes mesurés aux sections 1–6.

8. **Section 8 — Verdict**
   - Choisir UNE des trois recommandations (A migrer maintenant / B post-launch / C rester définitivement) avec argumentation appuyée sur les chiffres des sections précédentes.

## Règles d'or
- Aucune invention. Toute affirmation = citation `chemin:ligne` + extrait.
- Si non vérifiable depuis les fichiers → marquer **"À VÉRIFIER"** avec la raison.
- Ton factuel, pas rassurant. Pas de marketing.
- **Aucun autre fichier modifié.** Pas de commit. Pas de changement de code.

## Livrable unique
`MIGRATION_ASSESSMENT.md` à la racine, structuré exactement avec les 8 sections demandées.

Approuve ce plan pour que je passe en mode build et produise le rapport.
