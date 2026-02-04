import { useState, useRef, useEffect } from "react";
import {
  ArrowLeft,
  Paperclip,
  Send,
  Image as ImageIcon,
  FileText,
  Download,
  User,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useMessages, useConversations, usePresence } from "@/hooks/useChat";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface ChatConversationProps {
  conversationId: string;
  onBack: () => void;
}

export function ChatConversation({ conversationId, onBack }: ChatConversationProps) {
  const { user } = useAuth();
  const { messages, isLoading, sendMessage, markAsRead } = useMessages(conversationId);
  const { conversations } = useConversations();
  const { presenceMap } = usePresence();
  const [newMessage, setNewMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const conversation = conversations.find((c) => c.id === conversationId);

  const getConversationName = () => {
    if (!conversation) return "Chat";
    if (conversation.is_group) return conversation.name || "Grupo";

    const otherParticipant = conversation.participants?.find(
      (p) => p.user_id !== user?.id
    );
    return otherParticipant?.profile?.full_name || "Usuario";
  };

  const getOtherUserId = () => {
    if (!conversation || conversation.is_group) return null;
    const otherParticipant = conversation.participants?.find(
      (p) => p.user_id !== user?.id
    );
    return otherParticipant?.user_id;
  };

  const otherUserId = getOtherUserId();
  const isOnline = otherUserId ? presenceMap[otherUserId]?.is_online : false;

  // Auto scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Mark as read when viewing
  useEffect(() => {
    markAsRead();
  }, [markAsRead]);

  const handleSend = async () => {
    if (!newMessage.trim()) return;

    await sendMessage.mutateAsync({ content: newMessage });
    setNewMessage("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      await sendMessage.mutateAsync({ file });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const formatMessageTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();

    if (isToday) {
      return format(date, "HH:mm", { locale: es });
    }
    return format(date, "d MMM, HH:mm", { locale: es });
  };

  const renderMessage = (message: typeof messages[0]) => {
    const isOwn = message.sender_id === user?.id;

    return (
      <div
        key={message.id}
        className={cn(
          "flex gap-2 mb-3",
          isOwn ? "flex-row-reverse" : "flex-row"
        )}
      >
        {!isOwn && (
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarImage src={message.sender?.avatar_url || undefined} />
            <AvatarFallback>
              <User className="h-3 w-3" />
            </AvatarFallback>
          </Avatar>
        )}

        <div
          className={cn(
            "max-w-[75%] rounded-lg px-3 py-2",
            isOwn
              ? "bg-primary text-primary-foreground"
              : "bg-muted"
          )}
        >
          {!isOwn && conversation?.is_group && (
            <p className="text-xs font-medium mb-1 opacity-70">
              {message.sender?.full_name}
            </p>
          )}

          {message.message_type === "image" && message.file_url && (
            <a
              href={message.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="block mb-1"
            >
              <img
                src={message.file_url}
                alt={message.file_name || "Imagen"}
                className="max-w-full rounded max-h-48 object-cover"
              />
            </a>
          )}

          {message.message_type === "file" && message.file_url && (
            <a
              href={message.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "flex items-center gap-2 p-2 rounded mb-1",
                isOwn ? "bg-primary-foreground/10" : "bg-background"
              )}
            >
              <FileText className="h-5 w-5 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium truncate">
                  {message.file_name}
                </p>
                <p className="text-xs opacity-70">
                  {message.file_size
                    ? `${(message.file_size / 1024).toFixed(1)} KB`
                    : ""}
                </p>
              </div>
              <Download className="h-4 w-4 shrink-0" />
            </a>
          )}

          {message.content && (
            <p className="text-sm break-words">{message.content}</p>
          )}

          <p
            className={cn(
              "text-[10px] mt-1",
              isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
            )}
          >
            {formatMessageTime(message.created_at)}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Conversation Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <div className="relative">
          <Avatar className="h-8 w-8">
            <AvatarFallback>
              {conversation?.is_group ? (
                <Users className="h-3 w-3" />
              ) : (
                <User className="h-3 w-3" />
              )}
            </AvatarFallback>
          </Avatar>
          {!conversation?.is_group && isOnline && (
            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-background" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{getConversationName()}</p>
          {!conversation?.is_group && (
            <p className="text-xs text-muted-foreground">
              {isOnline ? "En línea" : "Desconectado"}
            </p>
          )}
          {conversation?.is_group && (
            <p className="text-xs text-muted-foreground">
              {conversation.participants?.length || 0} miembros
            </p>
          )}
        </div>
      </div>

      {/* Messages */}
      <ScrollArea ref={scrollRef} className="flex-1 p-3">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            No hay mensajes aún
          </div>
        ) : (
          messages.map(renderMessage)
        )}
      </ScrollArea>

      {/* Input */}
      <div className="p-3 border-t flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileSelect}
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
        />

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0"
              disabled={isUploading}
            >
              <Paperclip className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent side="top" align="start" className="w-36 p-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2"
              onClick={() => {
                if (fileInputRef.current) {
                  fileInputRef.current.accept = "image/*";
                  fileInputRef.current.click();
                }
              }}
            >
              <ImageIcon className="h-4 w-4" />
              Imagen
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2"
              onClick={() => {
                if (fileInputRef.current) {
                  fileInputRef.current.accept = ".pdf,.doc,.docx,.xls,.xlsx";
                  fileInputRef.current.click();
                }
              }}
            >
              <FileText className="h-4 w-4" />
              Documento
            </Button>
          </PopoverContent>
        </Popover>

        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Escribe un mensaje..."
          className="flex-1"
          disabled={sendMessage.isPending || isUploading}
        />

        <Button
          size="icon"
          className="h-9 w-9 shrink-0"
          onClick={handleSend}
          disabled={
            !newMessage.trim() || sendMessage.isPending || isUploading
          }
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
