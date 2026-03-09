/**
 * TanStack Query key factory pour la messagerie
 * Centralise les clés de cache des conversations et messages.
 *
 * @module features/messaging/api/messageKeys
 */

export const messageKeys = {
  /** Racine — invalide TOUT le cache messagerie */
  all: ['messaging'] as const,

  /** Toutes les conversations */
  conversations: () => [...messageKeys.all, 'conversations'] as const,

  /** Conversations d'un utilisateur */
  userConversations: (userId: string) => [...messageKeys.conversations(), userId] as const,

  /** Messages d'une conversation */
  messages: (conversationId: string) => [...messageKeys.all, 'messages', conversationId] as const,

  /** Compteur de messages non lus */
  unreadCount: (userId: string) => [...messageKeys.all, 'unread', userId] as const,

  /** Alertes utilisateur */
  alerts: () => ['user-alerts'] as const,

  /** Compteur d'alertes actives */
  alertsCount: () => ['user-alerts-count'] as const,
} as const;
