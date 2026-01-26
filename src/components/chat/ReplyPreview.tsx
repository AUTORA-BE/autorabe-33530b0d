import { X, Reply } from 'lucide-react';
import { motion } from 'framer-motion';

interface ReplyPreviewProps {
  replyToMessage: {
    id: string;
    content: string;
    sender_id: string;
  };
  currentUserId: string;
  onCancel: () => void;
}

export function ReplyPreview({ replyToMessage, currentUserId, onCancel }: ReplyPreviewProps) {
  const isMine = replyToMessage.sender_id === currentUserId;
  const truncatedContent = replyToMessage.content.length > 80 
    ? replyToMessage.content.substring(0, 80) + '...' 
    : replyToMessage.content;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="flex items-center gap-2 px-4 py-2 bg-secondary/50 border-l-4 border-primary rounded-r-lg mx-4 mb-2"
    >
      <Reply className="h-4 w-4 text-primary shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-primary">
          {isMine ? 'Vous' : 'Réponse à'}
        </p>
        <p className="text-sm text-muted-foreground truncate">
          {truncatedContent || '📷 Image'}
        </p>
      </div>
      <motion.button
        type="button"
        whileTap={{ scale: 0.9 }}
        onClick={onCancel}
        className="h-6 w-6 rounded-full bg-muted flex items-center justify-center hover:bg-muted-foreground/20 transition-colors"
      >
        <X className="h-3 w-3" />
      </motion.button>
    </motion.div>
  );
}
