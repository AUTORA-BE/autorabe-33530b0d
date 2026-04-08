/**
 * Admin Conversations management page
 * @module features/admin/components/pages
 */

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { SidebarTrigger } from '@/components/ui/sidebar';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquare, Search, Trash2, Eye, Loader2, Download } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAdminConversations, type AdminMessage } from '../../hooks/useAdminConversations';
import { exportData } from '../../utils/exportData';
import type { ExportFormat } from '../../types/admin.types';

export default function AdminConversationsPage() {
  const {
    conversations, isLoading, deleteConversation, deleteMessage, isActing, fetchMessages,
  } = useAdminConversations();

  const [search, setSearch] = useState('');
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return conversations;
    const q = search.toLowerCase();
    return conversations.filter(c =>
      (c.buyer_name?.toLowerCase().includes(q)) ||
      (c.seller_name?.toLowerCase().includes(q)) ||
      (c.car_brand?.toLowerCase().includes(q)) ||
      (c.car_model?.toLowerCase().includes(q)) ||
      (c.last_message?.toLowerCase().includes(q))
    );
  }, [conversations, search]);

  const handleExport = (fmt: ExportFormat) => {
    exportData(filtered.map(c => ({
      id: c.id,
      acheteur: c.buyer_name,
      vendeur: c.seller_name,
      vehicule: `${c.car_brand || ''} ${c.car_model || ''}`.trim(),
      messages: c.message_count,
      dernier_message: c.last_message_at,
      cree_le: c.created_at,
    })), 'conversations', fmt);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 flex-wrap">
        <SidebarTrigger />
        <MessageSquare className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-bold text-foreground">Conversations</h1>
        <Badge variant="secondary">{conversations.length}</Badge>
        <div className="ml-auto flex gap-1">
          <Button size="sm" variant="outline" onClick={() => handleExport('csv')}>
            <Download className="h-3 w-3 mr-1" />CSV
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher par nom, véhicule ou message..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9 h-9"
        />
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(conv => (
            <Card key={conv.id} className="border-border hover:border-primary/30 transition-colors">
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  {/* Car image */}
                  {conv.car_image ? (
                    <img
                      src={conv.car_image}
                      alt=""
                      className="h-10 w-10 rounded-md object-cover flex-shrink-0"
                      loading="lazy"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-xs font-semibold truncate">
                        {conv.buyer_name} ↔ {conv.seller_name}
                      </span>
                      {conv.car_brand && (
                        <Badge variant="outline" className="text-[9px] px-1">
                          {conv.car_brand} {conv.car_model}
                        </Badge>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {conv.last_message || 'Aucun message'}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-muted-foreground">
                        {conv.message_count} msg
                      </span>
                      {conv.last_message_at && (
                        <span className="text-[10px] text-muted-foreground">
                          · {format(new Date(conv.last_message_at), 'dd MMM HH:mm', { locale: fr })}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1 flex-shrink-0">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() => setSelectedConvId(conv.id)}
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-destructive"
                      disabled={isActing}
                      onClick={() => {
                        if (window.confirm(`Supprimer cette conversation (${conv.message_count} messages) ?`)) {
                          deleteConversation(conv.id);
                        }
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {filtered.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-8">
              Aucune conversation trouvée
            </p>
          )}
        </div>
      )}

      {/* Message detail dialog */}
      {selectedConvId && (
        <ConversationDetailDialog
          conversationId={selectedConvId}
          onClose={() => setSelectedConvId(null)}
          fetchMessages={fetchMessages}
          onDeleteMessage={deleteMessage}
          isActing={isActing}
        />
      )}
    </div>
  );
}

function ConversationDetailDialog({
  conversationId,
  onClose,
  fetchMessages,
  onDeleteMessage,
  isActing,
}: {
  conversationId: string;
  onClose: () => void;
  fetchMessages: (id: string) => Promise<AdminMessage[]>;
  onDeleteMessage: (id: string) => void;
  isActing: boolean;
}) {
  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['admin', 'conversation-messages', conversationId],
    queryFn: () => fetchMessages(conversationId),
  });

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Messages ({messages.length})
          </DialogTitle>
          <DialogDescription>
            Modération des messages de cette conversation
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : (
          <ScrollArea className="flex-1 max-h-[50vh] pr-2">
            <div className="space-y-2">
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className="rounded-lg border border-border p-2.5 text-sm group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-foreground">
                      {msg.sender_name}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-muted-foreground">
                        {format(new Date(msg.created_at), 'dd/MM HH:mm', { locale: fr })}
                      </span>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-5 w-5 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                        disabled={isActing}
                        onClick={() => {
                          if (window.confirm('Supprimer ce message ?')) {
                            onDeleteMessage(msg.id);
                          }
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-foreground/80">{msg.content}</p>
                  {msg.image_url && (
                    <img
                      src={msg.image_url}
                      alt="Pièce jointe"
                      className="mt-1.5 rounded max-h-32 object-cover"
                      loading="lazy"
                    />
                  )}
                </div>
              ))}
              {messages.length === 0 && (
                <p className="text-center text-xs text-muted-foreground py-4">
                  Aucun message
                </p>
              )}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
