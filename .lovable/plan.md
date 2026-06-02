# Refonte inscription & validation pros

Travail découpé en 5 livrables. Quelques précisions à valider avant de coder.

---

## ⚠️ Points à confirmer

1. **Colonne `user_type` absente.** La table `profiles` contient bien `garage_name`, mais **pas** `user_type` (le projet utilise actuellement `car_listings.seller_type` = `particulier`/`professionnel` au niveau annonce). La migration va donc **ajouter** `profiles.user_type text DEFAULT 'particulier' CHECK (user_type IN ('particulier','professionnel'))` + `profiles.bce_number text`.
2. **Emails transactionnels.** Le projet utilise déjà Resend via la fonction edge `send-email` (mémoire infra email). Je vais réutiliser ce système existant plutôt que de scaffolder l'infra Lovable Emails (qui créerait un doublon). Si tu préfères que je migre tout vers Lovable Emails, dis-le.
3. **Adresse admin** `autoracontact@gmail.com` : confirmée en dur dans le template, OK ?
4. **OAuth Google/Apple** : tu confirmes que je garde les boutons tels quels en haut, sans toucher au flow OAuth ?

---

## 1. Migration SQL (idempotente)

```sql
-- profiles : ajout user_type + bce_number
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS user_type text NOT NULL DEFAULT 'particulier',
  ADD COLUMN IF NOT EXISTS bce_number text;
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_user_type_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_user_type_check
  CHECK (user_type IN ('particulier','professionnel'));

-- Table de file d'attente
CREATE TABLE IF NOT EXISTS public.dealer_verification_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','approved','rejected')),
  submitted_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid,
  admin_notes text,
  garage_name_snapshot text,
  bce_snapshot text
);

GRANT SELECT, INSERT ON public.dealer_verification_queue TO authenticated;
GRANT ALL ON public.dealer_verification_queue TO service_role;

ALTER TABLE public.dealer_verification_queue ENABLE ROW LEVEL SECURITY;

-- RLS
CREATE POLICY "Owner or admin can view"
  ON public.dealer_verification_queue FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));
CREATE POLICY "User can submit own request"
  ON public.dealer_verification_queue FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admin can update"
  ON public.dealer_verification_queue FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_dvq_status_submitted
  ON public.dealer_verification_queue (status, submitted_at DESC);
```

## 2. `src/pages/Auth.tsx` — refonte

Signup mono-flow avec un schéma zod conditionnel :

```text
[OAuth Google] [OAuth Apple]
─── ou ───
Email*
Mot de passe* (jauge de force)
Nom complet*
Téléphone (optionnel)
Code postal (optionnel)
☐ Je suis un professionnel (Garage / Concessionnaire)
  └─ si coché ─┐
     Nom du garage*
     Numéro BCE (optionnel)
[ S'inscrire ]
```

Soumission :
1. `supabase.auth.signUp` (l'email de confirmation reste celui géré par Supabase).
2. Après succès, update `profiles` (`user_type`, `garage_name`, `bce_number`, `phone`, `postal_code`, `display_name`).
3. Si pro → insert `dealer_verification_queue (user_id, status='pending', garage_name_snapshot, bce_snapshot)` + `supabase.functions.invoke('send-email', { template:'new-dealer-signup', to: 'autoracontact@gmail.com', data: {...} })`.
4. Toast : « Bienvenue ! Si vous êtes pro, votre profil sera validé sous 24h. » + redirect `/`.

Le tab "Login" et les boutons OAuth restent inchangés.

## 3. Admin — `/admin/dealers`

Nouveau fichier `AdminDealersQueuePage.tsx` + route ajoutée dans `AdminLayout` + entrée dans `AdminSidebar`.

UI :
- Tabs : Tous / En attente (par défaut) / Validés / Refusés.
- Tableau (responsive cards mobile) : Nom · Email · Garage · BCE · Date · Statut.
- Actions par ligne : `Voir profil` (`/seller/:user_id`), `Valider`, `Refuser` (modal avec champ raison obligatoire), `Contacter` (`mailto:`).
- Valider → RPC `review_dealer_application(user_id, 'approved')` qui met à jour la queue, garde `user_type='professionnel'`, log dans `admin_actions`, déclenche email `dealer-approved`.
- Refuser → idem mais `status='rejected'`, `profiles.user_type='particulier'`, email `dealer-rejected` avec la raison.

Sécurité : `useAdminAuth` guard déjà en place sur AdminLayout.

## 4. Templates email (via `send-email` existant)

Création de 3 nouveaux templates React Email dans le dossier déjà utilisé par le projet :
- `new-dealer-signup` → admin (lien direct `/admin/dealers`).
- `dealer-approved` → user.
- `dealer-rejected` → user avec raison + lien contact.

Style Elite Green (cohérent avec les 6 templates existants).

## 5. Vérifs finales

- Build OK.
- Smoke test : signup pro → profil créé avec `user_type=professionnel`, ligne dans la queue, email admin envoyé.
- Smoke test : admin valide → email user, profil garde le statut pro.

---

**Confirme les 4 points en haut (notamment infra email + ajout colonne `user_type`) et je lance la migration puis le reste dans la foulée.**
