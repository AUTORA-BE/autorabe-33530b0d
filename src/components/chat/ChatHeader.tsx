import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

interface ChatHeaderProps {
  otherUserName: string;
  otherUserAvatar?: string;
  isOnline: boolean;
  isTyping: boolean;
  carBrand?: string;
  carModel?: string;
  onBack?: () => void;
  showBackButton?: boolean;
}

export function ChatHeader({
  otherUserName,
  otherUserAvatar,
  isOnline,
  isTyping,
  carBrand,
  carModel,
  onBack,
  showBackButton = false
}: ChatHeaderProps) {
  const { t } = useLanguage();
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="p-4 border-b border-border bg-card flex items-center gap-3">
      {showBackButton && onBack && (
        <Button 
          variant="ghost" 
          size="icon"
          onClick={onBack}
          className="shrink-0"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
      )}
      
      <div className="relative">
        <Avatar className="h-10 w-10">
          <AvatarImage src={otherUserAvatar} alt={otherUserName} />
          <AvatarFallback className="bg-primary/10 text-primary font-medium">
            {getInitials(otherUserName || 'U')}
          </AvatarFallback>
        </Avatar>
        {/* Online status indicator */}
        <span 
          className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-card ${
            isOnline ? 'bg-green-500' : 'bg-muted'
          }`}
        />
      </div>
      
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-foreground truncate">
          {otherUserName || 'Utilisateur'}
        </h3>
        <p className="text-sm text-muted-foreground truncate">
          {isTyping ? (
            <span className="text-primary flex items-center gap-1">
              {t("messages.typing")}
              <span className="flex gap-0.5">
                <span className="animate-bounce" style={{ animationDelay: '0ms' }}>.</span>
                <span className="animate-bounce" style={{ animationDelay: '150ms' }}>.</span>
                <span className="animate-bounce" style={{ animationDelay: '300ms' }}>.</span>
              </span>
            </span>
          ) : isOnline ? (
            t("messages.online")
          ) : (
            carBrand && carModel ? `${carBrand} ${carModel}` : t("messages.offline")
          )}
        </p>
      </div>
    </div>
  );
}
