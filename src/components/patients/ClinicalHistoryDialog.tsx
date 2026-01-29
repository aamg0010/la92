import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Upload, X, FileText, Loader2 } from "lucide-react";
import { useCreateClinicalHistory, useUploadClinicalAttachment } from "@/hooks/useClinicalHistory";
import { Badge } from "@/components/ui/badge";

const formSchema = z.object({
  diagnosis: z.string().min(3, "El diagnóstico debe tener al menos 3 caracteres"),
  treatment: z.string().optional(),
  tooth_number: z.string().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface ClinicalHistoryDialogProps {
  patientId: string;
  patientName: string;
  trigger?: React.ReactNode;
}

const TOOTH_OPTIONS = [
  "11", "12", "13", "14", "15", "16", "17", "18",
  "21", "22", "23", "24", "25", "26", "27", "28",
  "31", "32", "33", "34", "35", "36", "37", "38",
  "41", "42", "43", "44", "45", "46", "47", "48",
  "51", "52", "53", "54", "55",
  "61", "62", "63", "64", "65",
  "71", "72", "73", "74", "75",
  "81", "82", "83", "84", "85",
];

export function ClinicalHistoryDialog({ patientId, patientName, trigger }: ClinicalHistoryDialogProps) {
  const [open, setOpen] = useState(false);
  const [attachments, setAttachments] = useState<{ name: string; url: string; type: string }[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const createMutation = useCreateClinicalHistory();
  const uploadMutation = useUploadClinicalAttachment();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      diagnosis: "",
      treatment: "",
      tooth_number: "",
      notes: "",
    },
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      for (const file of Array.from(files)) {
        const result = await uploadMutation.mutateAsync({ file, patientId });
        setAttachments(prev => [...prev, result]);
      }
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: FormData) => {
    await createMutation.mutateAsync({
      patient_id: patientId,
      diagnosis: data.diagnosis,
      treatment: data.treatment || null,
      tooth_number: data.tooth_number || null,
      notes: data.notes || null,
      attachments,
    });
    
    form.reset();
    setAttachments([]);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Registro
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">
            Nuevo Registro de Historia Clínica
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Paciente: {patientName}
          </p>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="diagnosis"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Diagnóstico *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describa el diagnóstico..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="tooth_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pieza Dental</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="max-h-60">
                        <SelectItem value="general">General / Múltiples</SelectItem>
                        {TOOTH_OPTIONS.map(tooth => (
                          <SelectItem key={tooth} value={tooth}>
                            Pieza {tooth}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="treatment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tratamiento Aplicado</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Extracción, Limpieza..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas Adicionales</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Observaciones, recomendaciones, seguimiento..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Attachments */}
            <div className="space-y-2">
              <FormLabel>Archivos Adjuntos</FormLabel>
              
              {attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {attachments.map((att, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="flex items-center gap-1 py-1 px-2"
                    >
                      <FileText className="w-3 h-3" />
                      <span className="max-w-[150px] truncate">{att.name}</span>
                      <button
                        type="button"
                        onClick={() => removeAttachment(index)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                  disabled={isUploading}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById("file-upload")?.click()}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4 mr-2" />
                  )}
                  {isUploading ? "Subiendo..." : "Adjuntar Archivos"}
                </Button>
                <span className="text-xs text-muted-foreground">
                  PDF, imágenes, documentos (máx. 10MB)
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  "Guardar Registro"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
