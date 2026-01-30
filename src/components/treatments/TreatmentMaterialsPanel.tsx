import { useState } from "react";
import { Plus, Trash2, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  useTreatmentMaterials,
  useAddTreatmentMaterial,
  useRemoveTreatmentMaterial,
} from "@/hooks/useTreatments";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface TreatmentMaterialsPanelProps {
  treatmentId: string;
}

export function TreatmentMaterialsPanel({
  treatmentId,
}: TreatmentMaterialsPanelProps) {
  const [selectedItemId, setSelectedItemId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [isOptional, setIsOptional] = useState(false);

  const { data: materials = [], isLoading } = useTreatmentMaterials(treatmentId);
  const addMutation = useAddTreatmentMaterial();
  const removeMutation = useRemoveTreatmentMaterial();

  // Fetch inventory items for selection
  const { data: inventoryItems = [] } = useQuery({
    queryKey: ["inventory-items-select"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventory_items")
        .select("id, name, unit, unit_cost")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const handleAddMaterial = async () => {
    if (!selectedItemId || !quantity) return;

    await addMutation.mutateAsync({
      treatment_id: treatmentId,
      inventory_item_id: selectedItemId,
      quantity_required: parseFloat(quantity),
      is_optional: isOptional,
    });

    setSelectedItemId("");
    setQuantity("1");
    setIsOptional(false);
  };

  const handleRemoveMaterial = async (id: string) => {
    await removeMutation.mutateAsync({ id, treatmentId });
  };

  // Calculate total material cost
  const totalCost = materials.reduce((sum, m) => {
    const unitCost = m.inventory_item?.unit_cost || 0;
    return sum + unitCost * m.quantity_required;
  }, 0);

  // Filter out already added items
  const availableItems = inventoryItems.filter(
    (item) => !materials.some((m) => m.inventory_item_id === item.id)
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 text-muted-foreground" />
          <h4 className="font-medium">Materiales Requeridos</h4>
        </div>
        <Badge variant="outline">
          Costo estimado: ${totalCost.toLocaleString("es-CO")}
        </Badge>
      </div>

      {/* Add material form */}
      <div className="flex gap-3 items-end p-4 bg-muted/50 rounded-lg">
        <div className="flex-1">
          <Label className="text-sm">Material</Label>
          <Select value={selectedItemId} onValueChange={setSelectedItemId}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar material" />
            </SelectTrigger>
            <SelectContent>
              {availableItems.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.name} ({item.unit})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-24">
          <Label className="text-sm">Cantidad</Label>
          <Input
            type="number"
            min="0.1"
            step="0.1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Switch
            id="optional"
            checked={isOptional}
            onCheckedChange={setIsOptional}
          />
          <Label htmlFor="optional" className="text-sm">
            Opcional
          </Label>
        </div>
        <Button
          onClick={handleAddMaterial}
          disabled={!selectedItemId || addMutation.isPending}
          size="sm"
        >
          <Plus className="h-4 w-4 mr-1" />
          Agregar
        </Button>
      </div>

      {/* Materials table */}
      {isLoading ? (
        <div className="text-center py-4 text-muted-foreground">
          Cargando materiales...
        </div>
      ) : materials.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No hay materiales asignados a este tratamiento
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Material</TableHead>
              <TableHead className="text-right">Cantidad</TableHead>
              <TableHead className="text-right">Costo Unit.</TableHead>
              <TableHead className="text-right">Subtotal</TableHead>
              <TableHead className="text-center">Tipo</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {materials.map((material) => {
              const unitCost = material.inventory_item?.unit_cost || 0;
              const subtotal = unitCost * material.quantity_required;
              return (
                <TableRow key={material.id}>
                  <TableCell className="font-medium">
                    {material.inventory_item?.name || "Material eliminado"}
                  </TableCell>
                  <TableCell className="text-right">
                    {material.quantity_required}{" "}
                    {material.inventory_item?.unit || ""}
                  </TableCell>
                  <TableCell className="text-right">
                    ${unitCost.toLocaleString("es-CO")}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    ${subtotal.toLocaleString("es-CO")}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant={material.is_optional ? "outline" : "default"}
                    >
                      {material.is_optional ? "Opcional" : "Requerido"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveMaterial(material.id)}
                      disabled={removeMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
