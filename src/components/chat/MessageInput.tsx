import { useState, useRef, useEffect } from 'react';
import { Send, Image, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { EmojiPicker } from './EmojiPicker';
import { useLanguage } from '@/contexts/LanguageContext';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { sanitizeMultilineInput } from '@/lib/security';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface MessageInputProps {
  onSend: (message: string, imageUrl?: string) => void;
  onTyping: () => void;
  disabled?: boolean;
  currentUserId: string;
}

export function MessageInput({ onSend, onTyping, disabled = false, currentUserId }: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useLanguage();
  const { impactLight, notificationSuccess, notificationError } = useHapticFeedback();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!message.trim() && !selectedImage) || disabled || isUploading) return;

    impactLight();
    let imageUrl: string | undefined;

    // Upload image if selected
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

    // Sanitize message content
    const sanitizedMessage = sanitizeMultilineInput(message, 2000);
    
    onSend(sanitizedMessage, imageUrl);
    notificationSuccess();
    setMessage('');
    setSelectedImage(null);
    setImagePreview(null);
    
    // Reset textarea height
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
    
    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  };

  const handleEmojiSelect = (emoji: string) => {
    setMessage(prev => prev + emoji);
    textareaRef.current?.focus();
    onTyping();
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez sélectionner une image');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("L'image ne doit pas dépasser 5 Mo");
      return;
    }

    setSelectedImage(file);
    
    // Create preview
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
    <form onSubmit={handleSubmit} className="p-4 border-t border-border bg-card safe-bottom">
      {/* Image preview */}
      <AnimatePresence>
        {imagePreview && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            className="mb-3 relative inline-block"
          >
            <img 
              src={imagePreview} 
              alt="Preview" 
              className="max-h-24 rounded-lg object-cover shadow-md"
            />
            <motion.button
              type="button"
              whileTap={{ scale: 0.85 }}
              className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-lg"
              onClick={removeSelectedImage}
            >
              <X className="h-3 w-3" />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className={`flex items-end gap-2 rounded-2xl p-1 transition-all duration-200 ${
        isFocused ? 'ring-2 ring-primary/20 bg-secondary/30' : ''
      }`}>
        <EmojiPicker onEmojiSelect={handleEmojiSelect} />
        
        {/* Image upload button */}
        <motion.button
          type="button"
          whileTap={{ scale: 0.9 }}
          className="h-11 w-11 shrink-0 flex items-center justify-center rounded-xl hover:bg-secondary transition-colors touch-target"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isUploading}
        >
          <Image className="h-5 w-5 text-muted-foreground" />
        </motion.button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageSelect}
        />
        
        <Textarea
          ref={textareaRef}
          value={message}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={t("messages.typeMessage")}
          className="flex-1 min-h-[44px] max-h-[120px] resize-none py-3 px-4 border-0 bg-transparent focus-visible:ring-0"
          disabled={disabled || isUploading}
          rows={1}
        />
        
        <motion.button
          type="submit"
          whileTap={{ scale: 0.9 }}
          disabled={(!message.trim() && !selectedImage) || disabled || isUploading}
          className={`h-11 w-11 shrink-0 flex items-center justify-center rounded-xl transition-all touch-target ${
            (!message.trim() && !selectedImage) || disabled || isUploading
              ? 'bg-muted text-muted-foreground'
              : 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
          }`}
        >
          {isUploading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </motion.button>
      </div>
    </form>
  );
}
