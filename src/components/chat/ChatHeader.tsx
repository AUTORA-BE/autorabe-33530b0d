import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Store } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

interface ChatHeaderProps {
  otherUserName: string;
  otherUserAvatar?: string;
  otherUserId?: string;
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
  otherUserId,
  isOnline,
  isTyping,
  carBrand,
  carModel,
  onBack,
  showBackButton = false
}: ChatHeaderProps) {
  const { t, language } = useLanguage();

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="px-3 py-2.5 border-b border-border bg-card flex items-center gap-2.5 safe-top">
      {showBackButton && onBack && (
        <button
          onClick={onBack}
          className="shrink-0 h-9 w-9 flex items-center justify-center rounded-full hover:bg-secondary transition-colors active:scale-95"
        >
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
      )}

      <div className="relative">
        <Avatar className="h-9 w-9">
          <AvatarImage src={otherUserAvatar} alt={otherUserName} />
          <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
            {getInitials(otherUserName || 'U')}
          </AvatarFallback>
        </Avatar>
        <span
          className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-card ${
            isOnline ? 'bg-primary' : 'bg-muted'
          }`}
        />
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-semibold text-foreground truncate leading-tight">
          {otherUserName || 'Utilisateur'}
        </h3>
        <p className="text-xs text-muted-foreground truncate leading-tight">
          {isTyping ? (
            <span className="text-primary">
              {t("messages.typing")}
              <span className="inline-flex gap-px ml-0.5">
                <span className="animate-bounce inline-block" style={{ animationDelay: '0ms' }}>.</span>
                <span className="animate-bounce inline-block" style={{ animationDelay: '150ms' }}>.</span>
                <span className="animate-bounce inline-block" style={{ animationDelay: '300ms' }}>.</span>
              </span>
            </span>
          ) : isOnline ? (
            t("messages.online")
          ) : (
            carBrand && carModel ? `${carBrand} ${carModel}` : t("messages.offline")
          )}
        </p>
      </div>

      {otherUserId && (
        <Link
          to={`/seller/${otherUserId}`}
          aria-label={language === 'nl' ? 'Bekijk vitrine van verkoper' : 'Voir la vitrine du vendeur'}
          className="shrink-0 inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-secondary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <Store className="h-3.5 w-3.5" strokeWidth={1.8} aria-hidden="true" />
          <span className="hidden sm:inline">
            {language === 'nl' ? 'Bekijk vitrine' : 'Voir la vitrine'}
          </span>
        </Link>
      )}
    </div>
  );
}
