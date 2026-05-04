/**
 * WasteDisposalForm.tsx
 * Formulario para registrar disposicion de residuos
 */

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertTriangle, Biohazard, Trash2, Recycle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useCreateWasteDisposal,
  useUpdateWasteDisposal,
  WASTE_TYPES,
  type WasteDisposal,
  type WasteType,
  type CreateWasteDisposalData,
} from "@/hooks/useWasteManagement";
import { useAuth } from "@/contexts/AuthContext";

interface WasteDisposalFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  disposal?: WasteDisposal | null;
}

const WASTE_TYPE_ICONS: Record<WasteType, React.ReactNode> = {
  red: <Biohazard className="w-5 h-5" />,
  black: <Trash2 className="w-5 h-5" />,
  white: <Recycle className="w-5 h-5" />,
};

// Opciones de responsable
const RESPONSIBLE_OPTIONS = [
  { value: "Recepcionista", label: "Recepcionista" },
  { value: "Odontólogo", label: "Odontólogo" },
] as const;

export function WasteDisposalForm({ open, onOpenChange, disposal }: WasteDisposalFormProps) {
  const { user } = useAuth();
  const createDisposal = useCreateWasteDisposal();
  const updateDisposal = useUpdateWasteDisposal();

  const [formData, setFormData] = useState<CreateWasteDisposalData>({
    disposal_date: new Date().toISOString().split("T")[0],
    waste_type: "black",
    weight_kg: 0,
    responsible_name: "Recepcionista",
    notes: "",
  });

  const [weightWarning, setWeightWarning] = useState(false);

  useEffect(() => {
    if (disposal) {
      setFormData({
        disposal_date: disposal.disposal_date,
        waste_type: disposal.waste_type,
        weight_kg: disposal.weight_kg,
        responsible_name: disposal.responsible_name,
        responsible_id: disposal.responsible_id || undefined,
        notes: disposal.notes || "",
      });
    } else {
      setFormData({
        disposal_date: new Date().toISOString().split("T")[0],
        waste_type: "black",
        weight_kg: 0,
        responsible_name: "Recepcionista",
        notes: "",
      });
    }
  }, [disposal, open]);

  // Check weight limit for red bags
  useEffect(() => {
    const maxWeight = WASTE_TYPES[formData.waste_type].maxWeight;
    setWeightWarning(!!maxWeight && formData.weight_kg > maxWeight);
  }, [formData.waste_type, formData.weight_kg]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.weight_kg <= 0) {
      return;
    }

    try {
      if (disposal) {
        await updateDisposal.mutateAsync({
          id: disposal.id,
          data: formData,
        });
      } else {
        await createDisposal.mutateAsync(formData);
      }
      onOpenChange(false);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const isLoading = createDisposal.isPending || updateDisposal.isPending;
  const isEditing = !!disposal;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="font-display">
            {isEditing ? "Editar Registro" : "Registrar Disposicion de Residuos"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Actualiza los datos del registro de residuos."
              : "Registra la disposicion de residuos para cumplimiento normativo."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Waste Type Selection */}
          <div className="space-y-2">
            <Label>Tipo de Residuo</Label>
            <div className="grid grid-cols-3 gap-3">
              {(Object.keys(WASTE_TYPES) as WasteType[]).map((type) => {
                const config = WASTE_TYPES[type];
                const isSelected = formData.waste_type === type;

                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setFormData({ ...formData, waste_type: type })}
                    className={cn(
                      "p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2",
                      isSelected
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-muted-foreground/50",
                      config.bgColor
                    )}
                  >
                    <div className={cn("p-2 rounded-full", config.color)}>
                      {WASTE_TYPE_ICONS[type]}
                    </div>
                    <span className={cn("text-sm font-medium", isSelected && "text-primary")}>
                      {config.label}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {WASTE_TYPES[formData.waste_type].description}
            </p>
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="disposal_date">Fecha de Disposicion</Label>
            <Input
              id="disposal_date"
              type="date"
              value={formData.disposal_date}
              onChange={(e) => setFormData({ ...formData, disposal_date: e.target.value })}
              max={new Date().toISOString().split("T")[0]}
              required
            />
          </div>

          {/* Weight */}
          <div className="space-y-2">
            <Label htmlFor="weight_kg">Peso (kg)</Label>
            <Input
              id="weight_kg"
              type="number"
              step="0.1"
              min="0.1"
              value={formData.weight_kg || ""}
              onChange={(e) =>
                setFormData({ ...formData, weight_kg: parseFloat(e.target.value) || 0 })
              }
              placeholder="Ej: 5.5"
              required
            />
            {weightWarning && (
              <Alert variant="destructive" className="py-2">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  El peso maximo recomendado para bolsas rojas es de{" "}
                  {WASTE_TYPES.red.maxWeight} kg. Considera dividir en multiples bolsas.
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Responsible */}
          <div className="space-y-2">
            <Label htmlFor="responsible_name">Responsable</Label>
            <Select
              value={formData.responsible_name}
              onValueChange={(v) => setFormData({ ...formData, responsible_name: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona responsable" />
              </SelectTrigger>
              <SelectContent>
                {RESPONSIBLE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Observaciones (opcional)</Label>
            <Textarea
              id="notes"
              value={formData.notes || ""}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Notas adicionales sobre esta disposicion..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || formData.weight_kg <= 0}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEditing ? "Actualizar" : "Registrar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
