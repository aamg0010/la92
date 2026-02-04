import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface Conversation {
  id: string;
  name: string | null;
  is_group: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  participants?: ConversationParticipant[];
  last_message?: Message;
  unread_count?: number;
}

export interface ConversationParticipant {
  id: string;
  conversation_id: string;
  user_id: string;
  joined_at: string;
  last_read_at: string | null;
  is_admin: boolean;
  profile?: {
    full_name: string;
    avatar_url: string | null;
  };
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string | null;
  message_type: string;
  file_url: string | null;
  file_name: string | null;
  file_size: number | null;
  is_edited: boolean;
  created_at: string;
  updated_at: string;
  sender?: {
    full_name: string;
    avatar_url: string | null;
  };
}

export interface UserPresence {
  user_id: string;
  is_online: boolean;
  last_seen: string;
}

export function useConversations() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: conversations = [], isLoading, refetch } = useQuery({
    queryKey: ["conversations", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      // Get conversations with participants
      const { data: convs, error } = await supabase
        .from("conversations")
        .select(`
          *,
          conversation_participants (*)
        `)
        .order("updated_at", { ascending: false });

      if (error) throw error;

      // Fetch profiles for all participants
      const allUserIds = new Set<string>();
      (convs || []).forEach((conv) => {
        conv.conversation_participants?.forEach((p: { user_id: string }) => {
          allUserIds.add(p.user_id);
        });
      });

      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", Array.from(allUserIds));

      const profileMap = new Map<string, { full_name: string; avatar_url: string | null }>();
      profiles?.forEach((p) => {
        profileMap.set(p.user_id, { full_name: p.full_name, avatar_url: p.avatar_url });
      });

      // Get last message and unread count for each conversation
      const conversationsWithMeta = await Promise.all(
        (convs || []).map(async (conv) => {
          // Map participants with profiles
          const participantsWithProfiles = conv.conversation_participants?.map(
            (p: { user_id: string; id: string; conversation_id: string; joined_at: string; last_read_at: string | null; is_admin: boolean }) => ({
              ...p,
              profile: profileMap.get(p.user_id) || { full_name: "Usuario", avatar_url: null },
            })
          ) || [];

          const { data: lastMsg } = await supabase
            .from("messages")
            .select("*")
            .eq("conversation_id", conv.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          const participant = participantsWithProfiles.find(
            (p: ConversationParticipant) => p.user_id === user.id
          );

          let unreadCount = 0;
          if (participant?.last_read_at) {
            const { count } = await supabase
              .from("messages")
              .select("*", { count: "exact", head: true })
              .eq("conversation_id", conv.id)
              .gt("created_at", participant.last_read_at)
              .neq("sender_id", user.id);
            unreadCount = count || 0;
          } else {
            const { count } = await supabase
              .from("messages")
              .select("*", { count: "exact", head: true })
              .eq("conversation_id", conv.id)
              .neq("sender_id", user.id);
            unreadCount = count || 0;
          }

          return {
            ...conv,
            participants: participantsWithProfiles,
            last_message: lastMsg || undefined,
            unread_count: unreadCount,
          };
        })
      );

      return conversationsWithMeta as Conversation[];
    },
    enabled: !!user,
  });

  const createDirectConversation = useMutation({
    mutationFn: async (targetUserId: string) => {
      if (!user) throw new Error("No autenticado");

      // Check if conversation already exists
      const { data: existing } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", user.id);

      if (existing) {
        for (const p of existing) {
          const { data: conv } = await supabase
            .from("conversations")
            .select("*, conversation_participants(*)")
            .eq("id", p.conversation_id)
            .eq("is_group", false)
            .single();

          if (conv?.conversation_participants?.length === 2) {
            const hasTarget = conv.conversation_participants.some(
              (cp: { user_id: string }) => cp.user_id === targetUserId
            );
            if (hasTarget) return conv;
          }
        }
      }

      // Create new conversation
      const { data: newConv, error: convError } = await supabase
        .from("conversations")
        .insert({ created_by: user.id, is_group: false })
        .select()
        .single();

      if (convError) throw convError;

      // Add both participants
      const { error: partError } = await supabase
        .from("conversation_participants")
        .insert([
          { conversation_id: newConv.id, user_id: user.id, is_admin: true },
          { conversation_id: newConv.id, user_id: targetUserId },
        ]);

      if (partError) throw partError;

      return newConv;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createGroupConversation = useMutation({
    mutationFn: async ({ name, userIds }: { name: string; userIds: string[] }) => {
      if (!user) throw new Error("No autenticado");

      const { data: newConv, error: convError } = await supabase
        .from("conversations")
        .insert({ name, created_by: user.id, is_group: true })
        .select()
        .single();

      if (convError) throw convError;

      const participants = [
        { conversation_id: newConv.id, user_id: user.id, is_admin: true },
        ...userIds.map((uid) => ({
          conversation_id: newConv.id,
          user_id: uid,
        })),
      ];

      const { error: partError } = await supabase
        .from("conversation_participants")
        .insert(participants);

      if (partError) throw partError;

      return newConv;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      toast({ title: "Grupo creado" });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    conversations,
    isLoading,
    refetch,
    createDirectConversation,
    createGroupConversation,
  };
}

export function useMessages(conversationId: string | null) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["messages", conversationId],
    queryFn: async () => {
      if (!conversationId) return [];

      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Get sender profiles
      const senderIds = new Set<string>();
      data?.forEach((m) => senderIds.add(m.sender_id));

      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", Array.from(senderIds));

      const profileMap = new Map<string, { full_name: string; avatar_url: string | null }>();
      profiles?.forEach((p) => {
        profileMap.set(p.user_id, { full_name: p.full_name, avatar_url: p.avatar_url });
      });

      return (data || []).map((m) => ({
        ...m,
        sender: profileMap.get(m.sender_id) || { full_name: "Usuario", avatar_url: null },
      })) as Message[];
    },
    enabled: !!conversationId,
  });

  // Subscribe to new messages
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
          queryClient.invalidateQueries({ queryKey: ["conversations"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, queryClient]);

  const sendMessage = useMutation({
    mutationFn: async ({
      content,
      file,
    }: {
      content?: string;
      file?: File;
    }) => {
      if (!user || !conversationId) throw new Error("No autenticado");

      let fileUrl = null;
      let fileName = null;
      let fileSize = null;
      let messageType = "text";

      if (file) {
        const filePath = `${user.id}/${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from("chat-files")
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("chat-files")
          .getPublicUrl(filePath);

        fileUrl = urlData.publicUrl;
        fileName = file.name;
        fileSize = file.size;
        messageType = file.type.startsWith("image/") ? "image" : "file";
      }

      const { data, error } = await supabase
        .from("messages")
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content: content || null,
          message_type: messageType,
          file_url: fileUrl,
          file_name: fileName,
          file_size: fileSize,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
    onError: (error) => {
      toast({
        title: "Error al enviar mensaje",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const markAsRead = useCallback(async () => {
    if (!user || !conversationId) return;

    await supabase
      .from("conversation_participants")
      .update({ last_read_at: new Date().toISOString() })
      .eq("conversation_id", conversationId)
      .eq("user_id", user.id);

    queryClient.invalidateQueries({ queryKey: ["conversations"] });
  }, [user, conversationId, queryClient]);

  return {
    messages,
    isLoading,
    sendMessage,
    markAsRead,
  };
}

export function usePresence() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: presenceMap = {} } = useQuery({
    queryKey: ["presence"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_presence")
        .select("*");

      if (error) throw error;

      const map: Record<string, UserPresence> = {};
      data?.forEach((p) => {
        map[p.user_id] = p;
      });
      return map;
    },
    refetchInterval: 30000,
  });

  // Update own presence
  useEffect(() => {
    if (!user) return;

    const updatePresence = async (isOnline: boolean) => {
      await supabase.from("user_presence").upsert({
        user_id: user.id,
        is_online: isOnline,
        last_seen: new Date().toISOString(),
      });
    };

    updatePresence(true);

    const interval = setInterval(() => updatePresence(true), 30000);

    const handleBeforeUnload = () => updatePresence(false);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      clearInterval(interval);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      updatePresence(false);
    };
  }, [user]);

  // Subscribe to presence changes
  useEffect(() => {
    const channel = supabase
      .channel("presence-updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_presence",
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["presence"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return { presenceMap };
}

export function useStaffUsers() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["staff-users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select(`
          *,
          user_roles!inner (role)
        `)
        .neq("user_id", user?.id || "");

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}
