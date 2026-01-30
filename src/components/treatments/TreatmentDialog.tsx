import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import {
  Treatment,
  TreatmentInsert,
  useCreateTreatment,
  useUpdateTreatment,
  TREATMENT_CATEGORIES,
} from "@/hooks/useTreatments";
import { TreatmentMaterialsPanel } from "./TreatmentMaterialsPanel";

const treatmentSchema = z.object({
  code: z.string().min(1, "El código es requerido"),
  name: z.string().min(1, "El nombre es requerido"),
  description: z.string().optional(),
  category: z.string().optional(),
  base_price: z.coerce.number().min(0, "El precio debe ser positivo"),
  duration_minutes: z.coerce.number().min(1).optional(),
  is_active: z.boolean().default(true),
  pre_instructions: z.string().optional(),
  post_instructions: z.string().optional(),
  consent_required: z.boolean().default(false),
  consent_template_url: z.string().optional(),
});

type TreatmentFormData = z.infer<typeof treatmentSchema>;

interface TreatmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  treatment?: Treatment | null;
}

export function TreatmentDialog({
  open,
  onOpenChange,
  treatment,
}: TreatmentDialogProps) {
  const [activeTab, setActiveTab] = useState("general");
  const isEditing = !!treatment;

  const createMutation = useCreateTreatment();
  const updateMutation = useUpdateTreatment();

  const form = useForm<TreatmentFormData>({
    resolver: zodResolver(treatmentSchema),
    defaultValues: {
      code: "",
      name: "",
      description: "",
      category: "",
      base_price: 0,
      duration_minutes: 30,
      is_active: true,
      pre_instructions: "",
      post_instructions: "",
      consent_required: false,
      consent_template_url: "",
    },
  });

  useEffect(() => {
    if (treatment) {
      form.reset({
        code: treatment.code,
        name: treatment.name,
        description: treatment.description || "",
        category: treatment.category || "",
        base_price: treatment.base_price,
        duration_minutes: treatment.duration_minutes || 30,
        is_active: treatment.is_active ?? true,
        pre_instructions: treatment.pre_instructions || "",
        post_instructions: treatment.post_instructions || "",
        consent_required: treatment.consent_required ?? false,
        consent_template_url: treatment.consent_template_url || "",
      });
    } else {
      form.reset({
        code: "",
        name: "",
        description: "",
        category: "",
        base_price: 0,
        duration_minutes: 30,
        is_active: true,
        pre_instructions: "",
        post_instructions: "",
        consent_required: false,
        consent_template_url: "",
      });
    }
    setActiveTab("general");
  }, [treatment, form, open]);

  const onSubmit = async (data: TreatmentFormData) => {
    const treatmentData: TreatmentInsert = {
      code: data.code,
      name: data.name,
      base_price: data.base_price,
      is_active: data.is_active,
      consent_required: data.consent_required,
      description: data.description || null,
      category: data.category || null,
      duration_minutes: data.duration_minutes || null,
      pre_instructions: data.pre_instructions || null,
      post_instructions: data.post_instructions || null,
      consent_template_url: data.consent_template_url || null,
    };

    if (isEditing && treatment) {
      await updateMutation.mutateAsync({ id: treatment.id, ...treatmentData });
    } else {
      await createMutation.mutateAsync(treatmentData);
    }
    onOpenChange(false);
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Tratamiento" : "Nuevo Tratamiento"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="instructions">Instrucciones</TabsTrigger>
                <TabsTrigger value="materials" disabled={!isEditing}>
                  Materiales
                </TabsTrigger>
              </TabsList>

              <TabsContent value="general" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Código *</FormLabel>
                        <FormControl>
                          <Input placeholder="TRT-001" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Categoría</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {TREATMENT_CATEGORIES.map((cat) => (
                              <SelectItem key={cat} value={cat}>
                                {cat}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre del Tratamiento *</FormLabel>
                      <FormControl>
                        <Input placeholder="Limpieza dental" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descripción</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Descripción detallada del tratamiento..."
                          rows={3}
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
                    name="base_price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Precio Base (COP) *</FormLabel>
                        <FormControl>
                          <Input type="number" min={0} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="duration_minutes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duración (minutos)</FormLabel>
                        <FormControl>
                          <Input type="number" min={1} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel>Estado Activo</FormLabel>
                    <FormDescription>
                      Tratamiento disponible para nuevas citas
                    </FormDescription>
                  </div>
                  <FormField
                    control={form.control}
                    name="is_active"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              <TabsContent value="instructions" className="space-y-4 mt-4">
                <FormField
                  control={form.control}
                  name="pre_instructions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Instrucciones Pre-Tratamiento</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Indicaciones que debe seguir el paciente antes del tratamiento..."
                          rows={4}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Se enviarán al paciente antes de la cita
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="post_instructions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Instrucciones Post-Tratamiento</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Cuidados que debe seguir el paciente después del tratamiento..."
                          rows={4}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Se entregarán al paciente después de la cita
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel>Requiere Consentimiento</FormLabel>
                    <FormDescription>
                      El paciente debe firmar un documento antes del tratamiento
                    </FormDescription>
                  </div>
                  <FormField
                    control={form.control}
                    name="consent_required"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                {form.watch("consent_required") && (
                  <FormField
                    control={form.control}
                    name="consent_template_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>URL Plantilla de Consentimiento</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="https://..."
                            type="url"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </TabsContent>

              <TabsContent value="materials" className="mt-4">
                {treatment && (
                  <TreatmentMaterialsPanel treatmentId={treatment.id} />
                )}
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? "Guardar Cambios" : "Crear Tratamiento"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
