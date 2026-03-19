/**
 * Messaging feature type definitions
 * @module features/messaging/types
 */

/**
 * Chat message
 */
export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  imageUrl?: string | null;
  replyToId?: string | null;
  isRead: boolean;
  createdAt: string;
}

/**
 * Raw message from database
 */
export interface MessageRow {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  image_url?: string | null;
  reply_to_id?: string | null;
  is_read: boolean | null;
  created_at: string;
}

/**
 * Conversation
 */
export interface Conversation {
  id: string;
  carListingId: string | null;
  buyerId: string;
  sellerId: string;
  carBrand: string | null;
  carModel: string | null;
  carImage: string | null;
  lastMessageAt: string | null;
  createdAt: string;
  unreadCount?: number;
  lastMessage?: string;
  otherUserId?: string;
}

/**
 * Raw conversation from database
 */
export interface ConversationRow {
  id: string;
  car_listing_id: string | null;
  buyer_id: string;
  seller_id: string;
  car_brand: string | null;
  car_model: string | null;
  car_image: string | null;
  last_message_at: string | null;
  created_at: string;
}

/**
 * Conversation details for chat window
 */
export interface ConversationDetails {
  otherUserId: string;
  otherUserName: string;
  otherUserAvatar?: string;
  carBrand?: string;
  carModel?: string;
}

/**
 * Typing state for realtime
 */
export interface TypingState {
  userId: string;
  isTyping: boolean;
}

/**
 * Reply to message reference
 */
export interface ReplyToMessage {
  id: string;
  content: string;
  senderId: string;
}

/**
 * Map database row to Message
 */
export function mapMessageRow(row: MessageRow): Message {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    content: row.content,
    imageUrl: row.image_url,
    replyToId: row.reply_to_id,
    isRead: row.is_read,
    createdAt: row.created_at,
  };
}

/**
 * Map database row to Conversation
 */
export function mapConversationRow(row: ConversationRow, currentUserId: string): Conversation {
  return {
    id: row.id,
    carListingId: row.car_listing_id,
    buyerId: row.buyer_id,
    sellerId: row.seller_id,
    carBrand: row.car_brand,
    carModel: row.car_model,
    carImage: row.car_image,
    lastMessageAt: row.last_message_at,
    createdAt: row.created_at,
    otherUserId: row.buyer_id === currentUserId ? row.seller_id : row.buyer_id,
  };
}
