/**
 * Messaging feature barrel export
 * Re-exports all public APIs from the messaging feature
 * @module features/messaging
 */

// Hooks
export { 
  useTypingIndicator, 
  useOnlineStatus, 
  useUnreadMessages,
  useConversations,
} from './hooks';

// Types
export type {
  Message,
  MessageRow,
  Conversation,
  ConversationRow,
  ConversationDetails,
  TypingState,
  ReplyToMessage,
} from './types/messaging.types';

export { mapMessageRow, mapConversationRow } from './types/messaging.types';
