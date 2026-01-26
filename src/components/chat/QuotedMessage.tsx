import { Reply } from 'lucide-react';

interface QuotedMessageProps {
  content: string;
  senderName: string;
  isMine: boolean;
}

export function QuotedMessage({ content, senderName, isMine }: QuotedMessageProps) {
  const truncatedContent = content.length > 60 
    ? content.substring(0, 60) + '...' 
    : content;

  return (
    <div 
      className={`flex items-start gap-1.5 mb-2 p-2 rounded-lg border-l-2 ${
        isMine 
          ? 'bg-primary-foreground/10 border-primary-foreground/50' 
          : 'bg-muted/50 border-primary/50'
      }`}
    >
      <Reply className={`h-3 w-3 mt-0.5 shrink-0 ${isMine ? 'text-primary-foreground/70' : 'text-primary/70'}`} />
      <div className="min-w-0">
        <p className={`text-xs font-medium ${isMine ? 'text-primary-foreground/80' : 'text-primary/80'}`}>
          {senderName}
        </p>
        <p className={`text-xs truncate ${isMine ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
          {truncatedContent || '📷 Image'}
        </p>
      </div>
    </div>
  );
}
