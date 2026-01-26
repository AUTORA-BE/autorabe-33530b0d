import { useState } from 'react';
import { Check, CheckCheck, Reply } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { QuotedMessage } from './QuotedMessage';

interface ReplyToMessage {
  id: string;
  content: string;
  sender_id: string;
}

interface MessageBubbleProps {
  content: string;
  timestamp: string;
  isMine: boolean;
  isRead: boolean;
  showReadStatus?: boolean;
  imageUrl?: string;
  replyTo?: ReplyToMessage | null;
  replyToSenderName?: string;
  onReply?: () => void;
}

export function MessageBubble({ 
  content, 
  timestamp, 
  isMine, 
  isRead,
  showReadStatus = true,
  imageUrl,
  replyTo,
  replyToSenderName,
  onReply
}: MessageBubbleProps) {
  const { language } = useLanguage();
  const [isImageOpen, setIsImageOpen] = useState(false);

  const getLocale = () => {
    switch (language) {
      case 'nl': return 'nl-BE';
      case 'de': return 'de-DE';
      case 'en': return 'en-GB';
      default: return 'fr-BE';
    }
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) {
      return language === 'fr' ? "à l'instant" : 
             language === 'nl' ? 'zojuist' : 
             language === 'de' ? 'gerade eben' : 'just now';
    }
    
    if (diffMins < 60) {
      if (language === 'fr') return `il y a ${diffMins} min`;
      if (language === 'nl') return `${diffMins} min geleden`;
      if (language === 'de') return `vor ${diffMins} Min.`;
      return `${diffMins} min ago`;
    }
    
    if (diffHours < 24) {
      if (language === 'fr') return `il y a ${diffHours}h`;
      if (language === 'nl') return `${diffHours}u geleden`;
      if (language === 'de') return `vor ${diffHours} Std.`;
      return `${diffHours}h ago`;
    }
    
    if (diffDays === 1) {
      const time = date.toLocaleTimeString(getLocale(), { hour: '2-digit', minute: '2-digit' });
      if (language === 'fr') return `hier à ${time}`;
      if (language === 'nl') return `gisteren om ${time}`;
      if (language === 'de') return `gestern um ${time}`;
      return `yesterday at ${time}`;
    }
    
    if (diffDays < 7) {
      const day = date.toLocaleDateString(getLocale(), { weekday: 'short' });
      const time = date.toLocaleTimeString(getLocale(), { hour: '2-digit', minute: '2-digit' });
      return `${day} ${time}`;
    }
    
    return date.toLocaleDateString(getLocale(), { 
      day: 'numeric', 
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
      <div className={`group flex ${isMine ? 'justify-end' : 'justify-start'}`}>
        {/* Reply button for received messages */}
        {!isMine && onReply && (
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onReply}
            className="self-center mr-1 opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 rounded-full flex items-center justify-center hover:bg-secondary"
          >
            <Reply className="h-4 w-4 text-muted-foreground" />
          </motion.button>
        )}
        
        <div
          className={`max-w-[80%] sm:max-w-[70%] rounded-2xl px-4 py-2.5 ${
            isMine
              ? 'bg-primary text-primary-foreground rounded-br-md'
              : 'bg-secondary text-foreground rounded-bl-md'
          }`}
        >
          {/* Quoted message */}
          {replyTo && (
            <QuotedMessage 
              content={replyTo.content}
              senderName={replyToSenderName || (replyTo.sender_id === (isMine ? '' : replyTo.sender_id) ? 'Vous' : 'Message')}
              isMine={isMine}
            />
          )}
          
          {/* Image */}
          {imageUrl && (
            <div className="mb-2">
              <img 
                src={imageUrl} 
                alt="Image partagée" 
                className="rounded-lg max-w-full cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => setIsImageOpen(true)}
              />
            </div>
          )}
          
          {/* Text content */}
          {content && (
            <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
              {content}
            </p>
          )}
          
          <div className={`flex items-center justify-end gap-1.5 mt-1 ${
            isMine ? 'text-primary-foreground/70' : 'text-muted-foreground'
          }`}>
            <span className="text-xs">
              {formatRelativeTime(timestamp)}
            </span>
            {isMine && showReadStatus && (
              <span className="transition-all duration-300">
                {isRead ? (
                  <CheckCheck className="h-4 w-4 text-sky-400" />
                ) : (
                  <Check className="h-4 w-4 opacity-70" />
                )}
              </span>
            )}
          </div>
        </div>
        {/* Reply button for sent messages */}
        {isMine && onReply && (
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onReply}
            className="self-center ml-1 opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 rounded-full flex items-center justify-center hover:bg-secondary"
          >
            <Reply className="h-4 w-4 text-muted-foreground" />
          </motion.button>
        )}
      </div>

      {/* Fullscreen image dialog */}
      <Dialog open={isImageOpen} onOpenChange={setIsImageOpen}>
        <DialogContent className="max-w-4xl p-0 bg-transparent border-none">
          <img 
            src={imageUrl} 
            alt="Image partagée" 
            className="w-full h-auto rounded-lg"
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
