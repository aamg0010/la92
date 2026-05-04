import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Loader2 } from "lucide-react";
import { useCreatePatient } from "@/hooks/usePatients";
import { NewPatientConsentsPrompt } from "@/components/legal/NewPatientConsentsPrompt";

const patientSchema = z.object({
  first_name: z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(50),
  last_name: z.string().min(2, "El apellido debe tener al menos 2 caracteres").max(50),
  document_type: z.string().min(1, "Selecciona el tipo de documento"),
  document_number: z.string().min(5, "El documento debe tener al menos 5 caracteres").max(20),
  phone: z.string().min(7, "El teléfono debe tener al menos 7 dígitos").max(15),
  email: z.string().email("Correo inválido").optional().or(z.literal("")),
  birth_date: z.string().optional(),
  gender: z.string().optional(),
  marital_status: z.string().optional(),
  blood_type: z.string().optional(),
  occupation: z.string().max(100).optional(),
  address: z.string().max(200).optional(),
  city: z.string().max(50).optional(),
  health_insurance: z.string().max(100).optional(),
  notes: z.string().max(500).optional(),
});

const MARITAL_STATUS_OPTIONS = [
  { value: "soltero", label: "Soltero(a)" },
  { value: "casado", label: "Casado(a)" },
  { value: "union_libre", label: "Unión Libre" },
  { value: "divorciado", label: "Divorciado(a)" },
  { value: "viudo", label: "Viudo(a)" },
];

const BLOOD_TYPE_OPTIONS = [
  "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Desconocido"
];

type PatientFormData = z.infer<typeof patientSchema>;

interface NewPatientDialogProps {
  trigger?: React.ReactNode;
  onSuccess?: (patientId: string) => void;
}

export function NewPatientDialog({ trigger, onSuccess }: NewPatientDialogProps) {
  const [open, setOpen] = useState(false);
  const createPatient = useCreatePatient();
  const [createdPatient, setCreatedPatient] = useState<{
    id: string;
    fullName: string;
    phone: string | null;
    email: string | null;
  } | null>(null);

  const form = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      document_type: "CC",
      document_number: "",
      phone: "",
      email: "",
      birth_date: "",
      gender: "",
      marital_status: "",
      blood_type: "",
      occupation: "",
      address: "",
      city: "Medellín",
      health_insurance: "",
      notes: "",
    },
  });

  const onSubmit = async (data: PatientFormData) => {
    try {
      const result = await createPatient.mutateAsync({
        first_name: data.first_name,
        last_name: data.last_name,
        document_type: data.document_type,
        document_number: data.document_number,
        phone: data.phone,
        email: data.email || null,
        birth_date: data.birth_date || null,
        gender: data.gender || null,
        marital_status: data.marital_status || null,
        blood_type: data.blood_type || null,
        occupation: data.occupation || null,
        address: data.address || null,
        city: data.city || null,
        insurance_provider: data.health_insurance || null,
        notes: data.notes || null,
      });
      
      form.reset();
      setOpen(false);
      // Triggerea el flujo de consentimientos del paciente recien creado
      setCreatedPatient({
        id: result.id,
        fullName: `${data.first_name} ${data.last_name}`.trim(),
        phone: data.phone || null,
        email: data.email || null,
      });
      onSuccess?.(result.id);
    } catch (error) {
      // Error handled by mutation
    }
  };

  return (
    <>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-primary hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Paciente
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nuevo Paciente</DialogTitle>
          <DialogDescription>
            Ingresa los datos del nuevo paciente. Los campos marcados con * son obligatorios.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Información básica */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre *</FormLabel>
                    <FormControl>
                      <Input placeholder="Juan" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="last_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Apellido *</FormLabel>
                    <FormControl>
                      <Input placeholder="Pérez" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Documento */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="document_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo Doc. *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="CC">Cédula (CC)</SelectItem>
                        <SelectItem value="CE">Cédula Extranjería (CE)</SelectItem>
                        <SelectItem value="TI">Tarjeta Identidad (TI)</SelectItem>
                        <SelectItem value="PA">Pasaporte (PA)</SelectItem>
                        <SelectItem value="RC">Registro Civil (RC)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="document_number"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Número de Documento *</FormLabel>
                    <FormControl>
                      <Input placeholder="1234567890" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Contacto */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono *</FormLabel>
                    <FormControl>
                      <Input placeholder="3001234567" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="juan@email.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Datos personales */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="birth_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha de Nacimiento</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Género</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="M">Masculino</SelectItem>
                        <SelectItem value="F">Femenino</SelectItem>
                        <SelectItem value="O">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Información adicional requerida */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="marital_status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado Civil</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {MARITAL_STATUS_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
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
                name="blood_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Sangre</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {BLOOD_TYPE_OPTIONS.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
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
                name="occupation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ocupación</FormLabel>
                    <FormControl>
                      <Input placeholder="Profesión u oficio" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Ubicación */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ciudad</FormLabel>
                    <FormControl>
                      <Input placeholder="Medellín" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="health_insurance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>EPS / Aseguradora</FormLabel>
                    <FormControl>
                      <Input placeholder="Sura, Nueva EPS, etc." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dirección</FormLabel>
                  <FormControl>
                    <Input placeholder="Calle 123 # 45-67" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Información adicional relevante..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createPatient.isPending}>
                {createPatient.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  "Guardar Paciente"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>

    {createdPatient && (
      <NewPatientConsentsPrompt
        open={true}
        onOpenChange={(v) => !v && setCreatedPatient(null)}
        patientId={createdPatient.id}
        patientName={createdPatient.fullName}
        patientPhone={createdPatient.phone}
        patientEmail={createdPatient.email}
      />
    )}
    </>
  );
}
