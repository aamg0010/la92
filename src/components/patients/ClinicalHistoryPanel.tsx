import { useState } from "react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { useClinicalHistory, useToggleClinicalHistoryStatus } from "@/hooks/useClinicalHistory";
import { ClinicalHistoryDialog } from "./ClinicalHistoryDialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  FileText,
  Calendar,
  Stethoscope,
  Pill,
  MessageSquare,
  ExternalLink,
  Loader2,
  ClipboardList,
  MoreVertical,
  Archive,
  ArchiveRestore,
  Eye,
  EyeOff,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ClinicalHistoryPanelProps {
  patientId: string;
  patientName: string;
}

export function ClinicalHistoryPanel({ patientId, patientName }: ClinicalHistoryPanelProps) {
  const [showArchived, setShowArchived] = useState(false);
  const { data: entries, isLoading } = useClinicalHistory(patientId);
  const toggleStatus = useToggleClinicalHistoryStatus();

  const filteredEntries = entries?.filter(entry => 
    showArchived ? true : entry.is_active
  ) || [];

  const activeCount = entries?.filter(e => e.is_active).length || 0;
  const archivedCount = entries?.filter(e => !e.is_active).length || 0;

  const handleToggleStatus = (entryId: string, currentStatus: boolean) => {
    toggleStatus.mutate({ 
      entryId, 
      isActive: !currentStatus, 
      patientId 
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Historia Clínica</h3>
          <Badge variant="secondary">{activeCount} activos</Badge>
          {archivedCount > 0 && (
            <Badge variant="outline" className="text-muted-foreground">
              {archivedCount} archivados
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Switch
              id="show-archived"
              checked={showArchived}
              onCheckedChange={setShowArchived}
            />
            <Label htmlFor="show-archived" className="text-sm text-muted-foreground cursor-pointer">
              {showArchived ? (
                <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3" /> Ver archivados
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <EyeOff className="w-3 h-3" /> Ocultar archivados
                </span>
              )}
            </Label>
          </div>
          <ClinicalHistoryDialog patientId={patientId} patientName={patientName} />
        </div>
      </div>

      {/* Timeline */}
      {filteredEntries && filteredEntries.length > 0 ? (
        <ScrollArea className="h-[400px] pr-4">
          <div className="relative space-y-4">
            {/* Timeline line */}
            <div className="absolute left-[18px] top-6 bottom-6 w-0.5 bg-border" />
            
            {filteredEntries.map((entry, index) => (
              <div key={entry.id} className={cn(
                "relative flex gap-4 transition-opacity",
                !entry.is_active && "opacity-60"
              )}>
                {/* Timeline dot */}
                <div className={cn(
                  "w-9 h-9 rounded-full flex items-center justify-center shrink-0 z-10",
                  !entry.is_active 
                    ? "bg-muted text-muted-foreground" 
                    : index === 0 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-muted"
                )}>
                  {entry.is_active ? (
                    <Stethoscope className="w-4 h-4" />
                  ) : (
                    <Archive className="w-4 h-4" />
                  )}
                </div>
                
                {/* Content card */}
                <div className={cn(
                  "flex-1 p-4 rounded-lg border bg-card hover:shadow-md transition-shadow",
                  !entry.is_active 
                    ? "border-dashed border-muted-foreground/30" 
                    : "border-border"
                )}>
                  {/* Header with date and actions */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        {format(parseISO(entry.created_at), "d 'de' MMMM yyyy, HH:mm", { locale: es })}
                      </div>
                      {!entry.is_active && (
                        <Badge variant="outline" className="text-xs bg-muted">
                          <Archive className="w-3 h-3 mr-1" />
                          Archivado
                        </Badge>
                      )}
                    </div>
                    
                    {/* Actions dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleToggleStatus(entry.id, entry.is_active)}
                          disabled={toggleStatus.isPending}
                        >
                          {entry.is_active ? (
                            <>
                              <Archive className="w-4 h-4 mr-2" />
                              Archivar registro
                            </>
                          ) : (
                            <>
                              <ArchiveRestore className="w-4 h-4 mr-2" />
                              Restaurar registro
                            </>
                          )}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  {/* Tooth badge */}
                  {entry.tooth_number && (
                    <Badge variant="outline" className="mb-2">
                      Pieza {entry.tooth_number}
                    </Badge>
                  )}
                  
                  {/* Diagnosis */}
                  <div className="mb-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-1">
                      <Stethoscope className="w-4 h-4 text-primary" />
                      Diagnóstico
                    </div>
                    <p className="text-sm text-foreground/90 pl-6">
                      {entry.diagnosis}
                    </p>
                  </div>
                  
                  {/* Treatment */}
                  {entry.treatment && (
                    <div className="mb-3">
                      <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-1">
                        <Pill className="w-4 h-4 text-accent" />
                        Tratamiento
                      </div>
                      <p className="text-sm text-foreground/90 pl-6">
                        {entry.treatment}
                      </p>
                    </div>
                  )}
                  
                  {/* Notes */}
                  {entry.notes && (
                    <div className="mb-3">
                      <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-1">
                        <MessageSquare className="w-4 h-4 text-muted-foreground" />
                        Notas
                      </div>
                      <p className="text-sm text-muted-foreground pl-6">
                        {entry.notes}
                      </p>
                    </div>
                  )}
                  
                  {/* Archived info */}
                  {!entry.is_active && entry.archived_at && (
                    <div className="mt-3 pt-2 border-t border-dashed border-muted-foreground/30">
                      <p className="text-xs text-muted-foreground">
                        Archivado el {format(parseISO(entry.archived_at), "d 'de' MMMM yyyy, HH:mm", { locale: es })}
                      </p>
                    </div>
                  )}
                  
                  {/* Attachments */}
                  {entry.attachments && entry.attachments.length > 0 && (
                    <div className="pt-2 border-t border-border">
                      <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        Archivos Adjuntos
                      </div>
                      <div className="flex flex-wrap gap-2 pl-6">
                        {entry.attachments.map((att, attIndex) => (
                          <Button
                            key={attIndex}
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => window.open(att.url, "_blank")}
                          >
                            <FileText className="w-3 h-3 mr-1" />
                            {att.name}
                            <ExternalLink className="w-3 h-3 ml-1" />
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      ) : (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <ClipboardList className="w-12 h-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-2">
            {showArchived 
              ? "No hay registros de historia clínica" 
              : "No hay registros activos"}
          </p>
          {!showArchived && archivedCount > 0 ? (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowArchived(true)}
            >
              <Archive className="w-4 h-4 mr-2" />
              Ver {archivedCount} archivados
            </Button>
          ) : (
            <ClinicalHistoryDialog 
              patientId={patientId} 
              patientName={patientName}
              trigger={
                <Button variant="outline" size="sm">
                  Agregar primer registro
                </Button>
              }
            />
          )}
        </div>
      )}
    </div>
  );
}
