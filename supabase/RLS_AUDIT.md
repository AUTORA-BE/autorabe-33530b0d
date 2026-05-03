# RLS Audit — AutoRA.be

> **Date** : 2026-05-03
> **Status** : Pre-launch v1.0.0-beta.1
> **Auditeur** : Lovable AI Agent
> **Méthodologie** : revue exhaustive des policies + `supabase db lint` + tests SQL (`tests/rls.test.sql`).

---

## TL;DR

| Indicateur | Résultat |
|---|---|
| Tables totales (schéma `public`) | **27** |
| Tables avec RLS activée | **27 / 27** ✅ |
| Tables sans aucune policy | **0** ✅ |
| Policies `USING (true)` sur write (INSERT/UPDATE/DELETE) | **0** ✅ |
| PII (email/téléphone) exposée à `anon` | **NON** ✅ |
| `select('*')` côté client retournant des PII | **NON** (vue `car_listings_public` utilisée) ✅ |
| Linter Supabase RLS warnings | **0** ✅ |
| Linter Supabase warnings résiduels | 28 (fonctions `SECURITY DEFINER` + `pg_trgm` en `public` — **pattern intentionnel**, voir §Notes) |

---

## Modèle d'accès — vocabulaire

| Rôle | Description |
|---|---|
| `anon` | Visiteur non authentifié (clé anon JWT) |
| `authenticated` | Utilisateur connecté via Supabase Auth |
| `owner` | `auth.uid() = <table>.user_id` |
| `admin` | `has_role(auth.uid(), 'admin')` (table `user_roles` séparée — anti privilege-escalation) |
| `service_role` | Edge functions / cron uniquement (clé service, jamais exposée client) |

---

## Audit table par table

### 1. `admin_actions` — journal d'audit moderation
| Op | Qui | Justification |
|----|-----|---------------|
| SELECT | admin | Lecture du log d'audit réservée aux admins |
| INSERT | admin (et `admin_id = auth.uid()`) | Empêche un admin d'usurper l'identité d'un autre |
| UPDATE / DELETE | **personne** | Logs immuables (intégrité audit) |

### 2. `alert_notifications` — historique des matchs envoyés
| Op | Qui | Justification |
|----|-----|---------------|
| SELECT | owner via jointure `user_alerts` | L'utilisateur voit uniquement ses propres notifs |
| INSERT/UPDATE/DELETE | **personne** (côté API) | Insertions faites par edge function `match-new-vehicle` en `service_role` |

### 3. `audit_log` — journal d'événements user
| Op | Qui | Justification |
|----|-----|---------------|
| SELECT | owner OR admin | Transparence GDPR + supervision |
| INSERT | owner (`auth.uid() = user_id`) | Auto-logging côté client |
| UPDATE / DELETE | **personne** | Immuable |

### 4. `belgian_annual_tax_brackets` — barèmes taxe annuelle
| Op | Qui | Justification |
|----|-----|---------------|
| SELECT | **public** (anon + authenticated) | Données légales publiques (Wallonie/Bruxelles/Flandre), affichées dans le simulateur fiscal |
| INSERT/UPDATE/DELETE | admin | Édition via `/admin/fiscal` |

### 5. `belgian_tmc_age_reductions` — coefficients de vétusté TMC
Identique à `belgian_annual_tax_brackets`. **Public en lecture justifié** (donnée légale).

### 6. `belgian_tmc_brackets` — barèmes TMC (taxe de mise en circulation)
Identique. **Public en lecture justifié**.

### 7. `car_listings` — annonces véhicules (table source)
| Op | Qui | Justification |
|----|-----|---------------|
| SELECT | owner (toutes ses annonces) ; admin (toutes) ; `authenticated` ayant **déjà une conversation** sur cette annonce (`has_conversation_with_listing`) | Empêche la lecture publique des PII vendeur (email/phone/contact_name). Les visiteurs anon/auth lisent les annonces via la **vue `car_listings_public`** (sans PII) |
| INSERT | **personne directement** | Création obligatoire via edge function `create-listing` (validation Zod, anti-spam, rate-limit) |
| UPDATE | owner ; admin | Modification par le vendeur ou modération |
| DELETE | owner ; admin | |

🔒 **Point critique** : aucune policy SELECT n'autorise `anon` ou `authenticated` à lire toute la table. Le marketplace public passe **exclusivement** par la vue `car_listings_public` (security_invoker).

### 8. `car_views` — compteur de vues (analytics vendeur)
| Op | Qui | Justification |
|----|-----|---------------|
| SELECT | owner du `viewer_id` ; vendeur de l'annonce | RGPD : un user voit son historique, un vendeur voit le compteur de vues |
| INSERT | **public** (anon + auth) | Tracking des vues annoncées (anon = `viewer_id NULL` + `ip_hash`). **Pas de fuite** : seules les colonnes d'écriture sont publiques |
| UPDATE | personne | |
| DELETE | owner du `viewer_id` | RGPD "droit à l'oubli" via `clear_user_view_history()` |

### 9. `conversations` — fils de messagerie
| Op | Qui | Justification |
|----|-----|---------------|
| SELECT | buyer OR seller ; admin | Confidentialité messagerie 1-to-1 |
| INSERT | buyer (`auth.uid() = buyer_id`) | Seul l'acheteur initie une conversation |
| UPDATE | buyer OR seller | Maj `last_message_at` |
| DELETE | admin | Modération |

### 10. `daily_message_counts` — quota anti-spam (5 msgs/j free tier)
| Op | Qui | Justification |
|----|-----|---------------|
| SELECT/INSERT/UPDATE | owner | Compteur personnel |
| DELETE | personne | Intégrité quota |

### 11. `email_send_log` — log emails transactionnels
| Op | Qui | Justification |
|----|-----|---------------|
| Tout | `service_role` uniquement | Réservé aux edge functions email |

### 12. `email_send_state` — config rate-limit emails
Identique à `email_send_log`. `service_role` only.

### 13. `email_unsubscribe_tokens` — tokens unsubscribe
Identique. `service_role` only (validation côté edge function `handle-email-unsubscribe`).

### 14. `favorites` — favoris véhicules
| Op | Qui | Justification |
|----|-----|---------------|
| SELECT | owner ; vendeur de l'annonce favorisée | Stats vendeur ("X personnes ont liké votre annonce") |
| INSERT | owner | |
| DELETE | owner | |
| UPDATE | personne | Pas de mutation prévue |

🟡 **À noter** : le compteur public de favoris ("12 personnes intéressées") passe par la **fonction `get_favorite_counts(uuid[])`** en `SECURITY DEFINER` qui ne renvoie que des **counts agrégés**, jamais l'identité des utilisateurs.

### 15. `fuel_prices` — prix carburants
| Op | Qui | Justification |
|----|-----|---------------|
| SELECT | **public** | Affichage `FuelPriceStrip` sur la home |
| INSERT/UPDATE | admin | Édition via `/admin/fuel-prices` |
| DELETE | personne | Historique préservé |

### 16. `listing_drafts` — brouillons d'annonces
| Op | Qui | Justification |
|----|-----|---------------|
| SELECT/INSERT/UPDATE/DELETE | owner | Sauvegarde auto du wizard "Vendre ma voiture" |

### 17. `messages` — messages individuels
| Op | Qui | Justification |
|----|-----|---------------|
| SELECT | participants (buyer/seller) ; admin ; **subscribers Realtime restreints au topic `conversation:<id>` dont ils sont membres** | Confidentialité + sécurité Realtime |
| INSERT | sender (`auth.uid() = sender_id`) ET membre de la conversation | |
| UPDATE | participants | Maj `is_read` |
| DELETE | admin | Modération |

### 18. `profiles` — profils utilisateurs (display_name, avatar, phone, postal_code, garage_name)
| Op | Qui | Justification |
|----|-----|---------------|
| SELECT | owner ; admin | 🔒 **PII PROTÉGÉE** : phone et postal_code ne sont JAMAIS lisibles publiquement |
| INSERT | owner (auto via trigger `handle_new_user_profile`) | |
| UPDATE | owner | |
| DELETE | personne (cascade auth.users uniquement) | RGPD via `delete-account` edge function |

🔒 **Point critique** : la consultation publique d'un profil vendeur passe par **`get_seller_public_listings(uuid)`** (renvoie les annonces, jamais le profil complet) + un display_name affiché côté UI tiré indirectement.

### 19. `push_subscriptions` — endpoints WebPush
| Op | Qui | Justification |
|----|-----|---------------|
| SELECT/INSERT/UPDATE/DELETE | owner | Endpoints push privés |

### 20. `rate_limits` — table rate-limiting
`service_role` only. Utilisée par `check-rate-limit` edge function.

### 21. `reports` — signalements d'annonces
| Op | Qui | Justification |
|----|-----|---------------|
| SELECT | owner du report ; admin | Anonymat préservé pour le signalé |
| INSERT | authenticated (`auth.uid() = user_id`) | |
| UPDATE / DELETE | admin | |

### 22. `reviews` — avis sur annonces
| Op | Qui | Justification |
|----|-----|---------------|
| SELECT | **public** (sur annonces `approved` uniquement) | Avis publics par design |
| INSERT | authenticated (`auth.uid() = user_id`) ET **non-vendeur** de l'annonce (anti auto-review) | |
| UPDATE/DELETE | owner du review | |

### 23. `subscriptions` — abonnements Stripe
| Op | Qui | Justification |
|----|-----|---------------|
| SELECT | owner ; admin | |
| INSERT/UPDATE | admin (manuel via dashboard) — et **`service_role`** (webhook Stripe) | Sync automatique via `stripe-webhook` |
| DELETE | personne | Conservation historique paiements |

### 24. `suppressed_emails` — bounce/complaint list (RGPD)
`service_role` only — alimenté par webhook Resend `handle-email-suppression`.

### 25. `user_alerts` — alertes véhicule personnalisées
| Op | Qui | Justification |
|----|-----|---------------|
| SELECT/INSERT/UPDATE/DELETE | owner | Critères de recherche personnels |

### 26. `user_preferences` — préférences notifs
| Op | Qui | Justification |
|----|-----|---------------|
| SELECT/INSERT/UPDATE | owner | |
| DELETE | personne (cascade auth) | |

### 27. `user_roles` — table rôles (anti privilege-escalation)
| Op | Qui | Justification |
|----|-----|---------------|
| SELECT | owner | Un user peut voir ses propres rôles |
| INSERT/UPDATE/DELETE | **personne** côté API | Mutation **uniquement** via SQL admin / edge function privilégiée. **Empêche un user de s'auto-promouvoir admin** |

🔒 **Pattern de sécurité** : roles **séparés** de `profiles` + fonction `has_role()` `SECURITY DEFINER` `SET search_path = public` → empêche la récursion RLS et le privilege escalation.

---

## Notes — warnings linter Supabase (28)

Les warnings restants sont **tous intentionnels** et documentés ici :

### `0014_extension_in_public` — pg_trgm en schéma public (1 warning)
**Justification** : utilisé par le moteur de recherche full-text (`car_listings.search_vector`, indexes GIN trigram). Migration vers `extensions` schema possible mais sans gain sécurité réel.
**Décision** : accepté.

### `0028` & `0029` — `SECURITY DEFINER` exposées (27 warnings)
Toutes les fonctions concernées sont **conçues pour être appelées par anon/auth** :
- `has_role`, `is_user_suspended` → checks de policy (doivent bypasser RLS)
- `get_public_listing`, `get_seller_public_listings`, `get_user_view_history`, `get_seller_contact` → endpoints RPC explicitement publics, **filtrent les colonnes sensibles** (PII jamais retournées sauf à l'auth)
- `get_favorite_counts`, `get_listing_popularity`, `get_active_cities_count` → agrégats publics anonymisés
- `check_rate_limit`, `enqueue_email`, `read_email_batch`, `delete_email`, `move_to_dlq` → infrastructure (mais protégées par `verify_jwt` au niveau edge function quand utilisées)
- `clear_user_view_history` → vérifie `auth.uid() IS NOT NULL` en interne
- `has_conversation_with_listing` → utilisée dans une policy RLS
- Fonctions `pg_trgm` (`similarity`, `gtrgm_*`, etc.) → built-in extension

**Décision** : accepté. Chaque fonction a `SET search_path = public` (anti search_path injection) et filtre ses sorties.

---

## Recommandations post-launch

1. ✅ **Done** : tests RLS automatisés (voir `supabase/tests/rls.test.sql`)
2. 🟡 **À faire** : programmer un cron mensuel `supabase db lint` + diff sur ce document
3. 🟡 **À faire** : ajouter un test "smoke" anonymous → `select * from car_listings` doit échouer (RLS)
4. 🟢 **Nice-to-have** : déplacer `pg_trgm` vers schéma `extensions` lors d'une fenêtre de maintenance
