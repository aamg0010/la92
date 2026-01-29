import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { useClinicalHistory } from "@/hooks/useClinicalHistory";
import { ClinicalHistoryDialog } from "./ClinicalHistoryDialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Calendar,
  Stethoscope,
  Pill,
  MessageSquare,
  ExternalLink,
  Loader2,
  ClipboardList,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ClinicalHistoryPanelProps {
  patientId: string;
  patientName: string;
}

export function ClinicalHistoryPanel({ patientId, patientName }: ClinicalHistoryPanelProps) {
  const { data: entries, isLoading } = useClinicalHistory(patientId);

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
          <Badge variant="secondary">{entries?.length || 0} registros</Badge>
        </div>
        <ClinicalHistoryDialog patientId={patientId} patientName={patientName} />
      </div>

      {/* Timeline */}
      {entries && entries.length > 0 ? (
        <ScrollArea className="h-[400px] pr-4">
          <div className="relative space-y-4">
            {/* Timeline line */}
            <div className="absolute left-[18px] top-6 bottom-6 w-0.5 bg-border" />
            
            {entries.map((entry, index) => (
              <div key={entry.id} className="relative flex gap-4">
                {/* Timeline dot */}
                <div className={cn(
                  "w-9 h-9 rounded-full flex items-center justify-center shrink-0 z-10",
                  index === 0 ? "bg-primary text-primary-foreground" : "bg-muted"
                )}>
                  <Stethoscope className="w-4 h-4" />
                </div>
                
                {/* Content card */}
                <div className="flex-1 p-4 rounded-lg border border-border bg-card hover:shadow-md transition-shadow">
                  {/* Date */}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                    <Calendar className="w-3 h-3" />
                    {format(parseISO(entry.created_at), "d 'de' MMMM yyyy, HH:mm", { locale: es })}
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
            No hay registros de historia clínica
          </p>
          <ClinicalHistoryDialog 
            patientId={patientId} 
            patientName={patientName}
            trigger={
              <Button variant="outline" size="sm">
                Agregar primer registro
              </Button>
            }
          />
        </div>
      )}
    </div>
  );
}
