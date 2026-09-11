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
  useMessageNotifications,
} from './hooks';
export {
  useMessageLimit,
  isDailyLimitError,
  MESSAGE_QUOTA_KEY,
  DAILY_MESSAGE_LIMIT_ERROR,
  DAILY_MESSAGE_LIMIT_CODE,
} from './hooks/useMessageLimit';
export type { MessageQuota } from './hooks/useMessageLimit';

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
