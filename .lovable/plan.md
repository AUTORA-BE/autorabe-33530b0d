

# Notifications en temps réel pour les nouveaux messages

## Analyse de l'existant

Le projet dispose déjà de :
- **`useUnreadMessages`** : compteur de messages non lus avec abonnement realtime sur la table `messages`
- **Push notifications** : service worker (`sw.js`), hook `usePushNotifications`, edge function `send-push-notification`
- **Badge dans le Header** : affiche le compteur non lu sur le lien Messages

Ce qui **manque** : une notification visuelle in-app (toast) quand un nouveau message arrive, et le déclenchement automatique d'une notification push côté serveur à l'envoi d'un message.

## Plan d'implémentation

### 1. Créer un hook `useMessageNotifications`
Nouveau fichier `src/features/messaging/hooks/useMessageNotifications.ts` :
- S'abonne au channel realtime `postgres_changes` sur la table `messages` (event `INSERT`)
- Filtre les messages dont `sender_id !== currentUserId`
- Vérifie que l'utilisateur n'est PAS sur la page `/messages` avec cette conversation ouverte
- Affiche un toast Sonner avec le contenu du message et un bouton pour naviguer vers `/messages`
- Joue le son `notification.mp3` (déjà présent dans `/public/`)

### 2. Intégrer le hook dans le layout global
- Ajouter `useMessageNotifications` dans `App.tsx` ou dans le `Header` (qui est monté sur toutes les pages)
- Le hook ne s'active que si l'utilisateur est authentifié

### 3. Déclencher les push notifications à l'envoi de message
- Modifier `ChatWindow.tsx` : après l'insertion réussie d'un message, appeler l'edge function `send-push-notification` pour notifier le destinataire
- Passer `userId` (le destinataire), `title` (nom de l'expéditeur), `body` (contenu du message)

### 4. Exporter le nouveau hook
- Ajouter l'export dans `src/features/messaging/index.ts`

### Fichiers modifiés/créés
- **Créé** : `src/features/messaging/hooks/useMessageNotifications.ts`
- **Modifié** : `src/features/messaging/index.ts` (export)
- **Modifié** : `src/shared/components/Header.tsx` (intégrer le hook)
- **Modifié** : `src/components/ChatWindow.tsx` (appel push notification à l'envoi)

