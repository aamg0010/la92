import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Users, Loader2 } from "lucide-react";
import { useConversations, useStaffUsers, usePresence } from "@/hooks/useChat";
import { ROLE_LABELS, type AppRole } from "@/hooks/useUserRole";
import { cn } from "@/lib/utils";

interface NewConversationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConversationCreated: (id: string) => void;
}

export function NewConversationDialog({
  open,
  onOpenChange,
  onConversationCreated,
}: NewConversationDialogProps) {
  const { data: staffUsers = [], isLoading } = useStaffUsers();
  const { createDirectConversation, createGroupConversation } = useConversations();
  const { presenceMap } = usePresence();

  const [selectedTab, setSelectedTab] = useState("direct");
  const [groupName, setGroupName] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  const handleCreateDirect = async (userId: string) => {
    const conv = await createDirectConversation.mutateAsync(userId);
    onConversationCreated(conv.id);
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedUsers.length === 0) return;

    const conv = await createGroupConversation.mutateAsync({
      name: groupName,
      userIds: selectedUsers,
    });
    onConversationCreated(conv.id);
    setGroupName("");
    setSelectedUsers([]);
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const resetState = () => {
    setSelectedTab("direct");
    setGroupName("");
    setSelectedUsers([]);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        onOpenChange(value);
        if (!value) resetState();
      }}
    >
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Nueva conversación</DialogTitle>
        </DialogHeader>

        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="direct" className="gap-2">
              <User className="h-4 w-4" />
              Directo
            </TabsTrigger>
            <TabsTrigger value="group" className="gap-2">
              <Users className="h-4 w-4" />
              Grupo
            </TabsTrigger>
          </TabsList>

          <TabsContent value="direct" className="mt-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : staffUsers.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm py-8">
                No hay otros usuarios disponibles
              </p>
            ) : (
              <ScrollArea className="h-64">
                <div className="space-y-1">
                      {staffUsers.map((staffUser) => {
                        const isOnline = presenceMap[staffUser.user_id]?.is_online;
                        // user_roles comes as array of {role: string} from the join
                        const roleObj = staffUser.user_roles?.[0] as unknown as { role: string } | undefined;
                        const role = roleObj?.role as AppRole | undefined;

                        return (
                          <button
                            key={staffUser.user_id}
                            onClick={() => handleCreateDirect(staffUser.user_id)}
                            disabled={createDirectConversation.isPending}
                            className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors text-left"
                          >
                            <div className="relative">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={staffUser.avatar_url || undefined} />
                                <AvatarFallback>
                                  <User className="h-4 w-4" />
                                </AvatarFallback>
                              </Avatar>
                              {isOnline && (
                                <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 border-2 border-background" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">
                                {staffUser.full_name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                            {role ? ROLE_LABELS[role] : "Usuario"}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </TabsContent>

          <TabsContent value="group" className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="groupName">Nombre del grupo</Label>
              <Input
                id="groupName"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Ej: Doctores, Equipo Mañana..."
              />
            </div>

            <div className="space-y-2">
              <Label>Seleccionar miembros</Label>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <ScrollArea className="h-48 border rounded-md">
                  <div className="p-2 space-y-1">
                    {staffUsers.map((staffUser) => {
                      const isSelected = selectedUsers.includes(staffUser.user_id);
                      // user_roles comes as array of {role: string} from the join
                      const roleObj = staffUser.user_roles?.[0] as unknown as { role: string } | undefined;
                      const role = roleObj?.role as AppRole | undefined;

                      return (
                        <button
                          key={staffUser.user_id}
                          onClick={() => toggleUserSelection(staffUser.user_id)}
                          className={cn(
                            "w-full flex items-center gap-3 p-2 rounded-lg transition-colors text-left",
                            isSelected ? "bg-primary/10" : "hover:bg-muted"
                          )}
                        >
                          <Checkbox checked={isSelected} />
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={staffUser.avatar_url || undefined} />
                            <AvatarFallback>
                              <User className="h-3 w-3" />
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">
                              {staffUser.full_name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {role ? ROLE_LABELS[role] : "Usuario"}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </div>

            <Button
              className="w-full"
              onClick={handleCreateGroup}
              disabled={
                !groupName.trim() ||
                selectedUsers.length === 0 ||
                createGroupConversation.isPending
              }
            >
              {createGroupConversation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Crear grupo ({selectedUsers.length} seleccionados)
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
