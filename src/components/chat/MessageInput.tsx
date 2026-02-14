import { useState, useRef } from 'react';
import { Send, Image, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { EmojiPicker } from './EmojiPicker';
import { ReplyPreview } from './ReplyPreview';
import { useLanguage } from '@/contexts/LanguageContext';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { sanitizeMultilineInput } from '@/lib/security';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ReplyToMessage {
  id: string;
  content: string;
  sender_id: string;
}

interface MessageInputProps {
  onSend: (message: string, imageUrl?: string, replyToId?: string) => void;
  onTyping: () => void;
  disabled?: boolean;
  currentUserId: string;
  replyTo?: ReplyToMessage | null;
  onCancelReply?: () => void;
}

export function MessageInput({ onSend, onTyping, disabled = false, currentUserId, replyTo, onCancelReply }: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useLanguage();
  const { impactLight, notificationSuccess, notificationError } = useHapticFeedback();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!message.trim() && !selectedImage) || disabled || isUploading) return;

    impactLight();
    let imageUrl: string | undefined;

    if (selectedImage) {
      setIsUploading(true);
      try {
        const fileExt = selectedImage.name.split('.').pop();
        const fileName = `${currentUserId}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('chat-images')
          .upload(fileName, selectedImage);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('chat-images')
          .getPublicUrl(fileName);

        imageUrl = publicUrl;
      } catch (error) {
        console.error('Error uploading image:', error);
        notificationError();
        toast.error("Erreur lors de l'envoi de l'image");
        setIsUploading(false);
        return;
      }
      setIsUploading(false);
    }

    const sanitizedMessage = sanitizeMultilineInput(message, 2000);
    
    onSend(sanitizedMessage, imageUrl, replyTo?.id);
    notificationSuccess();
    setMessage('');
    setSelectedImage(null);
    setImagePreview(null);
    onCancelReply?.();
    
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    onTyping();
    
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 100) + 'px';
  };

  const handleEmojiSelect = (emoji: string) => {
    setMessage(prev => prev + emoji);
    textareaRef.current?.focus();
    onTyping();
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez sélectionner une image');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("L'image ne doit pas dépasser 5 Mo");
      return;
    }

    setSelectedImage(file);
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeSelectedImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border-t border-border bg-card safe-bottom">
      <AnimatePresence>
        {replyTo && (
          <ReplyPreview
            replyToMessage={replyTo}
            currentUserId={currentUserId}
            onCancel={() => onCancelReply?.()}
          />
        )}
      </AnimatePresence>
      
      <div className="px-3 py-2">
        <AnimatePresence>
          {imagePreview && (
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.9 }}
              className="mb-2 relative inline-block"
            >
              <img 
                src={imagePreview} 
                alt="Preview" 
                className="max-h-20 rounded-lg object-cover shadow-md"
              />
              <motion.button
                type="button"
                whileTap={{ scale: 0.85 }}
                className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-lg"
                onClick={removeSelectedImage}
              >
                <X className="h-3 w-3" />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      
        <div className="flex items-end gap-1.5 bg-secondary/40 rounded-2xl px-1.5 py-1">
          <EmojiPicker onEmojiSelect={handleEmojiSelect} />
          
          <motion.button
            type="button"
            whileTap={{ scale: 0.9 }}
            className="h-9 w-9 shrink-0 flex items-center justify-center rounded-xl hover:bg-secondary transition-colors"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || isUploading}
          >
            <Image className="h-[18px] w-[18px] text-muted-foreground" />
          </motion.button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageSelect}
          />
          
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={t("messages.typeMessage")}
            className="flex-1 min-h-[36px] max-h-[100px] resize-none py-2 px-2 border-0 bg-transparent text-sm focus:outline-none placeholder:text-muted-foreground"
            disabled={disabled || isUploading}
            rows={1}
          />
          
          <motion.button
            type="submit"
            whileTap={{ scale: 0.9 }}
            disabled={(!message.trim() && !selectedImage) || disabled || isUploading}
            className={`h-9 w-9 shrink-0 flex items-center justify-center rounded-xl transition-all ${
              (!message.trim() && !selectedImage) || disabled || isUploading
                ? 'text-muted-foreground'
                : 'bg-primary text-primary-foreground shadow-sm'
            }`}
          >
            {isUploading ? (
              <Loader2 className="h-[18px] w-[18px] animate-spin" />
            ) : (
              <Send className="h-[18px] w-[18px]" />
            )}
          </motion.button>
        </div>
      </div>
    </form>
  );
}
