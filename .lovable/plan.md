

## Recommandation finale avant lancement — Audit sécurité + SEO multilingue

Avant d'ouvrir AutoRa au public belge, il y a **deux chantiers critiques** qui auront le plus d'impact. Je recommande de les faire dans cet ordre :

---

### 🔒 Priorité 1 — Audit sécurité complet (~30 min, risque ZÉRO de casser quoi que ce soit)

C'est **non négociable** avant un lancement public. Tu manipules des données personnelles belges (RGPD), des paiements Stripe, et des annonces avec photos. Un trou de sécurité au lancement = perte de confiance immédiate.

**Ce que je vais faire :**
1. **Scan automatique Supabase** (`supabase--linter` + `security--run_security_scan`) pour détecter :
   - Tables sans RLS ou avec policies trop permissives
   - Fonctions sans `search_path` figé (vecteur d'injection)
   - Colonnes sensibles exposées
2. **Revue manuelle** des policies critiques : `car_listings`, `profiles`, `messages`, `favorites`, `user_roles`
3. **Vérification edge functions** : toutes ont bien la validation JWT + CORS + rate-limiting
4. **Check des secrets** : pas de clés hardcodées, `SUPABASE_SERVICE_ROLE_KEY` jamais exposée côté client
5. **Rapport final** avec actions correctives priorisées (si nécessaire)

---

### 🌍 Priorité 2 — SEO multilingue (URLs `/fr/`, `/nl/`, `/de/`) (~1h30)

Ton marché cible est **60% NL / 35% FR / 5% DE**. Aujourd'hui Google.be voit `autora.be/` comme un seul site FR. Sans préfixes de langue, tu perds 65% de ton potentiel d'indexation dès le jour 1.

**Plan déjà détaillé dans `.lovable/plan.md`** — résumé :

| Étape | Impact | Risque |
|-------|--------|--------|
| URLs préfixées `/fr/voiture/...`, `/nl/auto/...`, `/de/auto/...` | 🔥 Énorme SEO | Modéré (touche tout le routing) |
| Hreflang + sitemap multilingue côté edge function | 🔥 Indexation Google | Faible |
| Slugs SEO (`/fr/voiture/bmw-serie-3-bruxelles-uuid`) | ✅ Rankings ciblés | Faible (rétrocompat UUID) |

---

### 🎯 Quick wins complémentaires (optionnels, ~30 min chacun)

- **Test end-to-end manuel** : inscription → publication annonce → message → favoris → paiement boost (en mode test Stripe)
- **Google Search Console** : connecter `autora.be`, soumettre le sitemap, vérifier l'indexation
- **Page `/status`** publique : afficher l'état des services (utile en cas d'incident jour 1)
- **Monitoring erreurs** : vérifier que les edge functions logguent bien dans `audit_logs` ou Supabase logs

---

## Ma recommandation concrète

**Commençons par l'audit sécurité maintenant** (30 min, zéro risque, garantit que tu peux lancer sans honte). Si tout est clean, on enchaîne sur le SEO multilingue dans la foulée.

Si tu veux, je peux aussi te préparer une **checklist de lancement** (test E2E + Search Console + monitoring) pour le jour J.

**Dis-moi : on attaque l'audit sécurité, le SEO multilingue, ou les deux d'affilée ?**

