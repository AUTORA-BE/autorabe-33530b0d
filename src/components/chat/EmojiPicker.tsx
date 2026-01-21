import { useState } from 'react';
import { Smile } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
}

const EMOJI_CATEGORIES = {
  smileys: ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '😉', '😌', '😍', '🥰', '😘', '😋', '😎', '🤔', '🤗', '🤩'],
  gestures: ['👍', '👎', '👌', '✌️', '🤞', '👏', '🙌', '🤝', '💪', '🙏'],
  hearts: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '💔', '💕', '💖'],
  objects: ['🚗', '🚙', '🚕', '🏎️', '🚓', '🚘', '✨', '💰', '📍', '📞']
};

export function EmojiPicker({ onEmojiSelect }: EmojiPickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleEmojiClick = (emoji: string) => {
    onEmojiSelect(emoji);
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          type="button" 
          variant="ghost" 
          size="icon"
          className="h-10 w-10 shrink-0 text-muted-foreground hover:text-foreground"
        >
          <Smile className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-72 p-3" 
        align="end"
        side="top"
      >
        <div className="space-y-3">
          {Object.entries(EMOJI_CATEGORIES).map(([category, emojis]) => (
            <div key={category}>
              <div className="grid grid-cols-10 gap-1">
                {emojis.map((emoji, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleEmojiClick(emoji)}
                    className="h-8 w-8 flex items-center justify-center text-lg hover:bg-secondary rounded transition-colors"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
