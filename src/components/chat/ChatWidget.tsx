import { useState, useEffect } from "react";
import { MessageCircle, X, Minimize2, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useConversations } from "@/hooks/useChat";
import { ChatConversationList } from "./ChatConversationList";
import { ChatConversation } from "./ChatConversation";
import { NewConversationDialog } from "./NewConversationDialog";
import { useAuth } from "@/contexts/AuthContext";

export function ChatWidget() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const { conversations } = useConversations();

  const totalUnread = conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0);

  // Don't render if not authenticated
  if (!user) return null;

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        size="icon"
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg"
      >
        <MessageCircle className="h-6 w-6" />
        {totalUnread > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-xs text-destructive-foreground flex items-center justify-center">
            {totalUnread > 9 ? "9+" : totalUnread}
          </span>
        )}
      </Button>
    );
  }

  return (
    <>
      <div
        className={cn(
          "fixed bottom-6 right-6 z-50 bg-background border rounded-lg shadow-xl transition-all duration-200",
          isMinimized ? "w-72 h-12" : "w-96 h-[500px]"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/50 rounded-t-lg">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            <span className="font-semibold text-sm">Chat Interno</span>
            {totalUnread > 0 && (
              <span className="h-5 px-1.5 rounded-full bg-destructive text-xs text-destructive-foreground flex items-center justify-center">
                {totalUnread}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setIsMinimized(!isMinimized)}
            >
              {isMinimized ? (
                <Maximize2 className="h-4 w-4" />
              ) : (
                <Minimize2 className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        {!isMinimized && (
          <div className="h-[calc(100%-48px)] flex flex-col">
            {selectedConversationId ? (
              <ChatConversation
                conversationId={selectedConversationId}
                onBack={() => setSelectedConversationId(null)}
              />
            ) : (
              <ChatConversationList
                onSelectConversation={setSelectedConversationId}
                onNewConversation={() => setShowNewDialog(true)}
              />
            )}
          </div>
        )}
      </div>

      <NewConversationDialog
        open={showNewDialog}
        onOpenChange={setShowNewDialog}
        onConversationCreated={(id) => {
          setSelectedConversationId(id);
          setShowNewDialog(false);
        }}
      />
    </>
  );
}
