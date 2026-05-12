# AutoRA.be — Audit Pré-Lancement (Phase 0)

**Date** : 2026-05-11
**Cible lancement** : début juin 2026
**Stack** : React 19 + Vite + TS + Tailwind + shadcn/ui + Supabase (DB/Auth/Edge/Storage) + Stripe + Resend + LLM (actuellement Lovable AI Gateway → Gemini, spec demande Anthropic Claude)
**Méthode** : audit lecture seule, 4 agents parallèles, citations `fichier:ligne` systématiques.

---

## 1. Verdict global

| Domaine | Note | Commentaire |
|---|---|---|
| **Sécurité Supabase (RLS, secrets, auth)** | 🟢 Excellente | 27/27 tables RLS, 0 secret exposé côté client, 12/12 `onAuthStateChange` safe |
| **Sécurité Edge Functions** | 🟠 Modérée | Auth/CORS solides, mais PII logguée + disclaimer fiscal manquant + Bancontact absent |
| **Compliance Car-Pass / DSA / KYC** | 🔴 Bloquante | Car-Pass stubbé, pas de KYC dealer, mentions légales incomplètes, doc DE/EN absentes |
| **SEO / i18n / Performance** | 🟢 Bon | Hreflang OK, sitemaps OK, code splitting solide. Manque hub fiscal 2026 + WebP/AVIF |
| **Accessibilité** | 🟢 Bon | Alt text, labels, focus-visible OK. Trou Auth.tsx (labels manquants) |
| **Paiements Stripe BE** | 🟠 Bloquant pratique | Bancontact non configuré explicitement |

**Pas de blocker côté sécurité technique. Les blockers sont juridiques/conformité.**

---

## 2. Matrice de risques

### 🔴 Critique — Bloquant lancement

| # | Risque | Fichier(s):ligne | Impact | Correctif | Effort |
|---|---|---|---|---|---|
| C1 | **Car-Pass : vérification simulée** | `supabase/functions/verify-car-pass/index.ts:22-28` | Marketplace prétend vérifier Car-Pass mais retourne `{ok:true}` hardcodé après 2s. Risque légal majeur (loi belge sur la fraude au compteur). | Soit intégrer l'API officielle Car-Pass (CBV/ASEBA), soit retirer la mention "vérifié" et exiger un upload PDF + vérification manuelle dealer. | 1-2 j (intégration) ou 0.5 j (retrait) |
| C2 | **Car-Pass non obligatoire pour les pros** | `src/components/SellCarForm.tsx:65, 213, 584` | Schéma Zod accepte `car_pass_verified: false` même pour `seller_type === 'professionnel'`. Loi belge l'exige pour la vente d'occasion par un pro. | Rendre Car-Pass obligatoire (Zod + trigger SQL + RLS) si `seller_type === 'professionnel'`. | 0.5 j |
| C3 | **KYC dealers absent (DSA art. 30)** | `src/features/admin/components/pages/AdminUsersPage.tsx`, `src/pages/Auth.tsx`, table `profiles` | Pas de BCE, pas d'IBAN, pas d'upload pièce ID, pas de colonne `dealer_verified`, pas de workflow admin de validation. Le DSA art. 30 (entré en application 17/02/2024) **impose** la traçabilité des traders. | Nouvelle table `dealer_kyc` (BCE, TVA, IBAN, doc_id_url, status) + RLS owner+admin + page admin de validation + gating publication. | 2-3 j |
| C4 | **TVA optionnelle pour les pros** | `src/components/SellCarForm.tsx:69` | Champ TVA marqué `.optional()` côté pro. TVA obligatoire en BE pour assujettis. | Zod : `.required()` si `seller_type === 'professionnel'`, validation regex `^BE0\d{9}$`. | 0.5 h |
| C5 | **Mentions légales : placeholders non remplis** | `src/pages/MentionsLegales.tsx:13-18, 67` | Forme juridique, adresse, BCE, TVA, directeur de publication, arrondissement judiciaire : tous en `[à compléter]`. Hors la loi (art. 1.III.7 CDE belge). | À remplir par l'utilisateur dès qu'il a le statut (SRL/personne physique) immatriculé. | utilisateur — 1 j (BCE) |
| C6 | **CGU/CGV NL réduits drastiquement** | `src/pages/CGU.tsx:158-186`, `src/pages/CGV.tsx:131-156` | FR : 12 sections CGU / 9 sections CGV. NL : 5 sections chacun. Pas de parité légale. | Traduction complète FR→NL par un juriste belge (les 2 langues sont officielles en BE). | 2-3 j juriste (post-launch acceptable si on annonce explicitement "version définitive en cours de validation") |
| C7 | **Doc légales DE/EN inexistantes** | `src/pages/CGU.tsx`, `CGV.tsx`, `Confidentialite.tsx` | Le routing supporte `/de/*` et `/en/*` mais les pages légales n'ont AUCUNE traduction DE/EN. Si on indexe `/de/cgu`, on sert du FR sur une URL DE. | Soit traduire (post-launch), soit retirer les routes `/de/*` `/en/*` des pages légales au lancement. | 2 j traduction OU 0.5 h désactivation routes |
| C8 | **AI fiscal : pas de disclaimer pro** | `supabase/functions/explain-taxes/index.ts:8-82` | System prompt génère du conseil fiscal sans disclaimer "ce n'est pas un conseil professionnel". Responsabilité civile possible. | Disclaimer permanent UI (front) + dans system prompt + redirection vers fiscaliste partenaire. | 0.5 j |
| C9 | **AI fiscal : pas de citation de sources** | `supabase/functions/explain-taxes/index.ts` | Aucune mention SPF Finances, VLABEL, SPW, Bruxelles Fiscalité. Réponses non-vérifiables. | Ajouter dans system prompt l'obligation de citer 1 source officielle par réponse. | 0.5 j |
| C10 | **AI fiscal : utilise Gemini, pas Claude** | `supabase/functions/car-chat/index.ts`, `explain-taxes/index.ts` | Spec produit demande Anthropic Claude. Actuellement passe par Lovable AI Gateway → `google/gemini-*`. Pas un blocker technique mais écart spec. | Soit migrer vers Anthropic direct (clé `ANTHROPIC_API_KEY` en secret Supabase), soit acter Gemini dans la spec. | 0.5-1 j |
| C11 | **Stripe : Bancontact/SEPA non configuré** | `supabase/functions/create-checkout/index.ts`, `create-boost-checkout/index.ts` | `payment_method_types` absent du session.create. Bancontact = 78 % du e-com belge. Si pas activé côté dashboard Stripe ET pas listé côté code, défaut = carte uniquement. | Ajouter `payment_method_types: ["card","bancontact","sepa_debit"]` dans les deux fonctions. | 0.5 h |
| C12 | **`export-user-data` fuite PII brute** | `supabase/functions/export-user-data/index.ts:37-74` | Renvoie email, IPs, audit_log complet, conversations brutes des contreparties. GDPR art. 20 demande SES données, pas celles des autres. | Filtrer : redact audit_log non-sécurité, anonymiser noms des contreparties dans conversations, retirer IPs. | 1 j |

### 🟠 Haut — Bloquant qualité / sérieux

| # | Risque | Fichier(s):ligne | Impact | Correctif | Effort |
|---|---|---|---|---|---|
| H1 | **Lovable absent de la liste sous-traitants RGPD** | `src/pages/Confidentialite.tsx` | Sous-traitants listés : Supabase, Vercel, Stripe, Resend. Manque : Lovable (hébergeur réel), Anthropic/Google AI (Gemini), Plausible. Violation art. 13 GDPR. | Ajouter section sous-traitants à jour. | 0.5 h |
| H2 | **`Vercel` mentionné dans privacy alors qu'on est sur Lovable Cloud** | `src/pages/Confidentialite.tsx`, `src/pages/MentionsLegales.tsx` | Hébergement annoncé sur Vercel, mais déploiement réel via Lovable Cloud (avec Cloudflare CDN). Information trompeuse. | Remplacer toutes occurrences "Vercel" par "Lovable Cloud (hébergé via Cloudflare)". | 0.5 h |
| H3 | **`localBusinessSchema` jamais injecté** | `src/lib/seoSchemas.ts` (défini), `src/pages/SellerProfile.tsx` (non utilisé) | Schéma `AutoDealer` (LocalBusiness) défini mais aucune page ne l'injecte. SEO local foutu. | Injecter sur `SellerProfile.tsx` (par dealer) et sur `About.tsx` (AutoRA org). | 1 h |
| H4 | **9 pages sans `SEOHead`** | `src/pages/Auth.tsx`, `Cookies.tsx`, `Messages.tsx`, `ResetPassword.tsx`, `SellerDashboard.tsx`, `SellerStats.tsx`, `Settings.tsx`, `Unsubscribe.tsx`, `Maintenance.tsx` | Pages authentifiées indexables par Google sans canonical/noindex. | Ajouter `<SEOHead noIndex />` partout. | 1 h |
| H5 | **`handle-email-unsubscribe` logge le token en clair** | `supabase/functions/handle-email-unsubscribe/index.ts:103` | `console.error(..., { token })` — si l'update échoue, le token apparaît dans les logs CloudWatch/Supabase. Token = capacité d'unsubscribe arbitraire. | Redact à 8 premiers caractères. | 5 min |
| H6 | **`delete-account` met l'email en clair dans `audit_log`** | `supabase/functions/delete-account/index.ts:60` | Email de l'utilisateur supprimé reste lisible en clair dans `audit_log` après suppression. Contradiction avec GDPR art. 17. | Hasher l'email (SHA-256 + sel) ou stocker uniquement l'ID. | 1 h |
| H7 | **`send-contact-email` persiste l'IP brute** | `supabase/functions/send-contact-email/index.ts:225` | IP stockée dans `contact_messages` (lisible par admin). Pas nécessaire au métier — déjà utilisée pour rate-limit en mémoire. | Retirer la colonne `ip_address` ou la hasher. | 1 h |
| H8 | **`check-subscription` logge l'email** | `supabase/functions/check-subscription/index.ts:38` | `console.log({ email: user.email })` exposé dans les logs. | Redact à `***@domaine.tld`. | 5 min |
| H9 | **`car-chat` logge la réponse d'erreur AI complète** | `supabase/functions/car-chat/index.ts:80` | Si la gateway AI renvoie une erreur contenant l'input user, c'est loggué. | Sanitiser : ne logger que `status + generic message`. | 15 min |
| H10 | **`Auth.tsx` sans `<label htmlFor>` explicites** | `src/pages/Auth.tsx` | Le formulaire d'inscription utilise placeholders à la place de labels. Échec WCAG 2.1 AA + lecteurs d'écran. | Ajouter `<FormLabel>` à chaque input (pattern déjà utilisé dans `SellCarForm`). | 1 h |
| H11 | **Pas de mécanisme de notification au signaleur** | `src/components/ReportAdModal.tsx`, table `reports` | DSA art. 16 §5 : le signaleur doit recevoir une confirmation et une décision motivée. Aucun mail envoyé actuellement. | Ajouter une edge function qui envoie un mail Resend après statut `reports.status = 'reviewed'`. | 0.5 j |
| H12 | **Pas de hub fiscalité 2026** | aucune route `/fiscalite-auto-2026` | Différenciation SEO forte annoncée dans la spec. 0 page pilier dédiée. | Créer `/fr/fiscalite-auto-2026` + `/nl/autofiscaliteit-2026` (1 page pilier, 8-10 enfants placeholder). | 1 j (squelettes + intra-linking) |

### 🟡 Moyen — À traiter post-launch (V1.1)

| # | Risque | Fichier(s):ligne | Impact | Correctif | Effort |
|---|---|---|---|---|---|
| M1 | **CGU §4.2 : Car-Pass formulé en mou** | `src/pages/CGU.tsx:~120` | "Le Car-Pass peut être rendu obligatoire pour certaines catégories" — formulation vague. | Reformuler : "obligatoire pour les vendeurs professionnels au sens de l'art. VI.2 CDE". | 15 min |
| M2 | **Sitemap statique sans variantes localisées** | `public/sitemap-pages.xml` | Le sitemap statique ne liste que les URLs FR (`/sell`, `/pricing`...). Les variantes `/nl/verkopen`, `/de/verkaufen` ne sont pas listées (uniquement via hreflang sur l'homepage). | Régénérer `sitemap-pages.xml` avec une entrée par couple (page × langue). | 0.5 j |
| M3 | **Pas de WebP/AVIF côté Edge** | `src/components/cars/CarImage.tsx`, `vite.config.ts` | Images servies en JPEG/PNG. -30 % de poids possible avec WebP. | Soit Supabase Image Transformations (déjà disponible), soit pipeline Vite (`vite-plugin-imagemin`). | 0.5 j |
| M4 | **`car_views` accepte INSERT anonyme** | `supabase/migrations/...215125809...:178` | `WITH CHECK (true)` — n'importe qui peut spammer des vues. Déjà mitigé par le fait que c'est uniquement métrique. | Ajouter une contrainte de rate-limit (1 view / IP / listing / heure via trigger). | 0.5 j |
| M5 | **Privacy.tsx + Confidentialite.tsx en doublon** | `src/pages/Privacy.tsx`, `src/pages/Confidentialite.tsx` | Deux pages avec contenu proche, divergence garantie à terme. | Garder uniquement `Confidentialite.tsx` (canonique FR) + traductions, supprimer `Privacy.tsx`. | 1 h |
| M6 | **Pas de SLA explicite sur le traitement des `reports`** | table `reports`, AdminReportsPage | DSA art. 16 §6 demande un délai raisonnable. | Documenter SLA 48h ouvrées dans `/mentions-legales`. | 30 min |
| M7 | **IP rate-limit basé sur `x-forwarded-for` non validé** | `car-chat`, `explain-taxes`, `send-contact-email` | Si la fonction est appelée hors du proxy Supabase, l'IP est spoofable. | Soit valider que la requête vient bien d'origines whitelistées (déjà en CORS), soit doc le modèle de menace. | 1 h doc |
| M8 | **`vendor-icons` chunk 734 KB** | `dist/assets/vendor-icons-*.js` | `lucide-react` non tree-shaké correctement. | Switch vers imports `from "lucide-react/icons/X"` ou icon subsetting (`vite-plugin-icons`). | 0.5 j |
| M9 | **Cookies analytics OFF par défaut mais pas de "deny all" explicite** | `src/components/CookieBanner.tsx`, `src/lib/consent.ts` | Bouton "Tout refuser" présent mais pas mis en avant comme égal au "Tout accepter". CNIL/APD demandent égalité visuelle. | Refaire le design : 2 boutons primaires côte à côte ("Accepter" / "Refuser"). | 1 h |

### 🟢 Faible — Veille post-launch

| # | Risque | Fichier(s):ligne | Impact | Action |
|---|---|---|---|---|
| L1 | `profiles_public` view en `security_invoker = false` | `supabase/migrations/...310235212...:21` | Intentionnel (filtrage colonnes), pas un risque réel. | Ajouter commentaire SQL expliquant le pattern. |
| L2 | Fire-and-forget async dans 2 `onAuthStateChange` | `useAnalytics.ts:49`, `useSubscription.ts:60` | Intentionnel, non-bloquant. | Ajouter commentaire JSDoc. |
| L3 | Stripe webhook avec CORS `*` | `supabase/functions/stripe-webhook/index.ts:6` | POST-only + signature HMAC = OK en pratique. | RAS. |
| L4 | `vehicle-photos` bucket public (read) | `supabase/migrations/...storage_hardening.sql` | Intentionnel pour SEO / OG / partage. Upload protégé par RLS. | RAS. |
| L5 | Pas de Sentry / pas d'APM | — | Volontaire selon spec. | Surveiller logs Supabase + Plausible. |

---

## 3. Forces (à préserver)

- **RLS 27/27** tables, 0 policy permissive en écriture, defense-in-depth via `REVOKE` colonnes PII.
- **CORS whitelist** strict via `_shared/cors.ts` (auto échoue l'origine si hors allowlist).
- **Idempotence Stripe webhook** via `stripe_processed_events` + contrainte UNIQUE.
- **Storage hardening** : MIME type + taille + ownership folder, sur `vehicle-photos` ET `car-pass`.
- **12/12 `onAuthStateChange`** sans deadlock async (pattern correct partout).
- **Hreflang + canonical** émis correctement par `SEOHead.tsx` sur 30/39 pages.
- **Sitemap dynamique** paginé via edge function avec hreflang par véhicule.
- **Image LCP** : blur-up placeholder, `fetchpriority="high"`, dimensions explicites.
- **Code splitting** : 37 pages lazy, manual chunks vendor (react/query/motion/icons/supabase).
- **PWA service worker** avec stratégies de cache différenciées (NetworkFirst API, CacheFirst images).
- **Cookie consent** granulaire avec analytics OFF par défaut.
- **Export/Delete account** endpoints GDPR fonctionnels (à durcir sur PII contreparties).
- **`react-day-picker v9 + React 19`** déjà migrés (la base technique est à jour).

---

## 4. Plan d'exécution proposé

### Phase 1 — Sécurité (3-5 jours)

**Bloquant : 0** (la base est déjà saine, du polissage)

| Tâche | Effort | Priorité |
|---|---|---|
| H5 — Redact token logs unsubscribe | 5 min | P0 |
| H6 — Hasher email dans `audit_log` delete-account | 1 h | P0 |
| H8/H9 — Redact email/error dans logs | 30 min | P0 |
| H7 — Retirer IP de `contact_messages` | 1 h | P0 |
| C12 — Filtrer `export-user-data` PII contreparties | 1 j | P0 |
| Rate-limit sur `export-user-data` (1/24h/user) | 2 h | P1 |
| Migration `enable_rls_all_tables` (déjà fait, donc no-op + doc) | 30 min | P1 |
| Vérifier HIBP password check activé côté Supabase Auth dashboard | manuel | P1 |
| Doc PENTEST_SCOPE.md (pour pentest tiers post-Phase 1) | 0.5 j | P2 |

**Livrable** : 1 migration SQL idempotente (réénable RLS partout par sécurité), 5 edge functions modifiées, `SECURITY_FIXES.md`.

### Phase 2 — Car-Pass + DSA + RGPD (5-8 jours, **BLOQUANT LANCEMENT**)

| Tâche | Effort | Priorité |
|---|---|---|
| C1 — Décider Car-Pass : intégration API CBV/ASEBA OU retrait du label "vérifié" | 1-2 j (décision produit + impl) | P0 |
| C2 — Car-Pass obligatoire pour pros (Zod + trigger SQL) | 0.5 j | P0 |
| C3 — Table `dealer_kyc` + upload Storage + page admin | 2-3 j | P0 |
| C4 — TVA obligatoire pro (Zod) | 0.5 h | P0 |
| C5 — Mentions légales : remplir BCE/TVA/adresse (côté utilisateur dès statut acquis) | utilisateur | P0 |
| C6 — Parité CGU/CGV NL (juriste belge) | 2-3 j (peut être V1.1 avec warning) | P0/P1 |
| C7 — Doc légales DE/EN : retirer routes au lancement OU traduire | 0.5 h ou 2 j | P0 |
| H1/H2 — Sous-traitants RGPD (Lovable, Anthropic/Google, Plausible) | 1 h | P0 |
| H11 — Notification email au signaleur après traitement report | 0.5 j | P1 |
| M5 — Fusionner Privacy.tsx ↔ Confidentialite.tsx | 1 h | P1 |
| M9 — Refaire UI cookie banner ("Refuser" = "Accepter" visuellement) | 1 h | P1 |
| Single point of contact DSA art. 11 (section dédiée mentions légales) | 30 min | P1 |

**Livrable** : 3-4 migrations SQL, table `dealer_kyc`, page admin KYC, traductions, `COMPLIANCE.md`.

### Phase 3 — AI Fiscal Advisor (2-3 jours)

| Tâche | Effort | Priorité |
|---|---|---|
| C8 — Disclaimer permanent (UI + system prompt) | 0.5 j | P0 |
| C9 — Citations sources obligatoires (SPF, VLABEL, SPW, BXL Fiscalité) | 0.5 j | P0 |
| C10 — Décision modèle : Anthropic (claude-sonnet-4-6 / claude-opus-4-7) ou Gemini | décision | P1 |
| Table `fiscal_chats` + persistance + RLS owner-only | 0.5 j | P1 |
| Bouton "Parler à un humain" → form lead-gen fiscaliste partenaire | 0.5 j | P1 |
| Tool use optionnel `recommend_specialist` (Acerta/Securex) | 0.5 j | P2 |
| Tests non-régression system prompt (Vitest snapshot) | 0.5 j | P2 |

**Livrable** : `supabase/functions/fiscal-chat/index.ts` (rename/refactor), system prompt versionné dans repo, composant `FiscalChat` durci.

### Phase 4 — SEO / Bilinguisme / Performance (3-5 jours)

| Tâche | Effort | Priorité |
|---|---|---|
| H3 — `localBusinessSchema` injecté sur `SellerProfile` + `About` | 1 h | P0 |
| H4 — `SEOHead noIndex` sur 9 pages auth/transactionnelles | 1 h | P0 |
| H12 — Hub fiscalité 2026 (1 pilier + 8-10 enfants placeholders) | 1 j | P1 |
| M2 — Sitemap statique avec variantes localisées | 0.5 j | P1 |
| M3 — WebP/AVIF via Supabase Image Transformations | 0.5 j | P1 |
| M8 — Tree-shaking lucide-react | 0.5 j | P2 |
| Audit Lighthouse post-fix (cible Perf>85 / A11y>95 / SEO 100) | 0.5 j | P1 |
| Stripe BE Bancontact/SEPA (C11, déjà couvert ici aussi) | 0.5 h | P0 |

**Livrable** : `SEO.md`, hub fiscalité, sitemap localisé, audit Lighthouse.

### Phase 5 — Pricing dealers + UX (3-4 jours)

| Tâche | Effort | Priorité |
|---|---|---|
| Page `/pricing` 3 paliers (déjà existante, vérifier copy) | 0.5 j | P1 |
| C11 — Stripe checkout : `payment_method_types: ["card","bancontact","sepa_debit"]` | 0.5 h | **P0** |
| Webhook Stripe → activer/désactiver dealer selon `subscription.status` (déjà partiel) | 0.5 j | P1 |
| Badges trust : KYC vérifié, Car-Pass systématique, Réponse <24h | 0.5 j | P1 |
| Filtres "Déductibilité société 2026" + "Régime fiscal" | 1 j | P2 |
| Badge motorisation + fiscalité sur listing card | 0.5 j | P2 |

**Livrable** : `LAUNCH_READY.md` + checklist go/no-go.

---

## 5. Estimation globale

| Phase | Effort | Bloquant lancement ? |
|---|---|---|
| Phase 1 (sécu) | 3-5 j | Non (mais P0 sur les fuites PII) |
| Phase 2 (Car-Pass + DSA) | 5-8 j | **OUI** |
| Phase 3 (AI fiscal) | 2-3 j | OUI sur disclaimer + sources, le reste peut être V1.1 |
| Phase 4 (SEO + Stripe BE) | 3-5 j | OUI sur Bancontact + localBusinessSchema |
| Phase 5 (pricing dealers) | 3-4 j | Non (V1 peut sortir sans pricing dealers public) |

**Total minimum bloquant lancement** : ~10-14 jours développeur si la décision Car-Pass est "intégration API". ~6-9 jours si la décision est "retrait du label vérifié + Car-Pass upload manuel".

**Fenêtre 11 mai → 1er juin** = 21 jours. Faisable, **à condition de prioriser strict** :
1. Décider Car-Pass (intégration vs retrait label) — décision produit cette semaine.
2. KYC dealers (C3) — démarrer immédiatement, c'est le plus long.
3. Tout le reste P0 peut tenir en 1 semaine de travail concentré.

---

## 6. Go / No-Go préliminaire

| Critère | Statut au 2026-05-11 |
|---|---|
| Sécurité technique (RLS, secrets, auth) | ✅ Vert |
| Compliance Car-Pass | 🔴 Rouge (stub) |
| Compliance DSA art. 30 (KYC dealers) | 🔴 Rouge (absent) |
| Compliance DSA art. 16 (notice-and-action) | 🟡 Orange (présent mais pas de notification au signaleur) |
| Compliance RGPD | 🟠 Orange (sous-traitants incomplets, PII dans exports) |
| Mentions légales / CGU / CGV / Confidentialité | 🟠 Orange (placeholders + parité NL) |
| Bilinguisme FR/NL | 🟠 Orange (UI OK, doc légales pas à parité) |
| SEO technique | 🟢 Vert (hreflang, sitemap, schemas définis) |
| Paiements Bancontact | 🟠 Orange (non explicite côté code) |
| AI fiscal compliance | 🟠 Orange (pas de disclaimer ni source) |

**Verdict** : **Pas de go au 2026-05-11**. Les 12 risques 🔴 doivent tomber à 🟢 ou 🟡 documenté avant le 1er juin. Aucun blocker côté infra/sécurité technique.

---

## 7. Décisions à prendre par l'utilisateur avant Phase 1

1. **Car-Pass** : intégration API officielle (1-2 j) OU retrait du label "vérifié" + upload PDF + vérif manuelle (0.5 j) ?
2. **Modèle AI fiscal** : on garde Gemini (économique, déjà en place) ou on migre vers Anthropic Claude (cohérence spec, qualité) ?
3. **Doc légales DE/EN au lancement** : on retire les routes `/de/cgu` et `/en/cgu` (rapide), ou on traduit avant le 1er juin (juriste — coût) ?
4. **CGU/CGV NL** : on lance avec la version réduite + warning "version finale en revue juridique" (pragmatique mais risqué), ou on attend la revue juridique complète (sécurisé mais retarde) ?
5. **Pricing dealers public** : on lance avec page `/pricing` publique (Phase 5) ou on attend post-launch ?
6. **Forme juridique AutoRA** : SRL constituée ? BCE/TVA disponibles ? Adresse siège ?

---

## 8. Risques résiduels acceptables

- Pas de Sentry → on accepte la surveillance via logs Supabase + Plausible (spec).
- `car_views.INSERT` ouvert → analytics non-PII, risque marginal.
- Webhook Stripe CORS `*` → POST + signature HMAC → OK en pratique.
- `vendor-icons` 734 KB → impact perf modéré, optimisable post-launch.

---

**STOP — Audit Phase 0 terminé. En attente de validation utilisateur pour démarrer Phase 1.**

**Si tu valides, je propose de démarrer dans cet ordre :**
1. Tu réponds aux 6 décisions de la section 7.
2. Je lance Phase 1 (sécu — quick wins PII) puis Phase 2 (Car-Pass + DSA) en parallèle.
3. Phases 3-4-5 en mode P0 only avant le 1er juin, P1/P2 en V1.1.
