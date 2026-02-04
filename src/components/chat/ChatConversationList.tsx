import { Plus, Users, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useConversations, usePresence } from "@/hooks/useChat";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface ChatConversationListProps {
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
}

export function ChatConversationList({
  onSelectConversation,
  onNewConversation,
}: ChatConversationListProps) {
  const { user } = useAuth();
  const { conversations, isLoading } = useConversations();
  const { presenceMap } = usePresence();

  const getConversationName = (conv: typeof conversations[0]) => {
    if (conv.is_group) return conv.name || "Grupo sin nombre";

    const otherParticipant = conv.participants?.find(
      (p) => p.user_id !== user?.id
    );
    return otherParticipant?.profile?.full_name || "Usuario";
  };

  const getConversationAvatar = (conv: typeof conversations[0]) => {
    if (conv.is_group) return null;

    const otherParticipant = conv.participants?.find(
      (p) => p.user_id !== user?.id
    );
    return otherParticipant?.profile?.avatar_url;
  };

  const getOtherUserId = (conv: typeof conversations[0]) => {
    if (conv.is_group) return null;
    const otherParticipant = conv.participants?.find(
      (p) => p.user_id !== user?.id
    );
    return otherParticipant?.user_id;
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b">
        <Button
          onClick={onNewConversation}
          variant="outline"
          className="w-full justify-start gap-2"
        >
          <Plus className="h-4 w-4" />
          Nueva conversación
        </Button>
      </div>

      <ScrollArea className="flex-1">
        {conversations.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground text-sm">
            No tienes conversaciones aún
          </div>
        ) : (
          <div className="divide-y">
            {conversations.map((conv) => {
              const otherUserId = getOtherUserId(conv);
              const isOnline = otherUserId
                ? presenceMap[otherUserId]?.is_online
                : false;

              return (
                <button
                  key={conv.id}
                  onClick={() => onSelectConversation(conv.id)}
                  className={cn(
                    "w-full p-3 flex items-start gap-3 hover:bg-muted/50 transition-colors text-left",
                    conv.unread_count && conv.unread_count > 0 && "bg-muted/30"
                  )}
                >
                  <div className="relative">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={getConversationAvatar(conv) || undefined} />
                      <AvatarFallback>
                        {conv.is_group ? (
                          <Users className="h-4 w-4" />
                        ) : (
                          <User className="h-4 w-4" />
                        )}
                      </AvatarFallback>
                    </Avatar>
                    {!conv.is_group && isOnline && (
                      <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 border-2 border-background" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span
                        className={cn(
                          "font-medium text-sm truncate",
                          conv.unread_count && conv.unread_count > 0 && "font-bold"
                        )}
                      >
                        {getConversationName(conv)}
                      </span>
                      {conv.last_message && (
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(conv.last_message.created_at), {
                            addSuffix: false,
                            locale: es,
                          })}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground truncate max-w-[180px]">
                        {conv.last_message?.message_type === "image"
                          ? "📷 Imagen"
                          : conv.last_message?.message_type === "file"
                          ? "📎 Archivo"
                          : conv.last_message?.content || "Sin mensajes"}
                      </p>
                      {conv.unread_count && conv.unread_count > 0 && (
                        <span className="h-5 min-w-5 px-1 rounded-full bg-primary text-xs text-primary-foreground flex items-center justify-center">
                          {conv.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
