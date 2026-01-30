import { useState } from "react";
import { Plus, Trash2, ShoppingCart } from "lucide-react";
import {
  Dialog,
  DialogContent,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSuppliers, useCreatePurchaseOrder } from "@/hooks/useSuppliers";
import { Loader2 } from "lucide-react";

interface OrderItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  inventory_item_id?: string;
}

interface PurchaseOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PurchaseOrderDialog({
  open,
  onOpenChange,
}: PurchaseOrderDialogProps) {
  const [supplierId, setSupplierId] = useState("");
  const [expectedDelivery, setExpectedDelivery] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<OrderItem[]>([]);

  // New item form
  const [newDescription, setNewDescription] = useState("");
  const [newQuantity, setNewQuantity] = useState("1");
  const [newUnitPrice, setNewUnitPrice] = useState("");

  const { data: suppliers = [] } = useSuppliers();
  const createMutation = useCreatePurchaseOrder();

  const addItem = () => {
    if (!newDescription || !newQuantity || !newUnitPrice) return;

    setItems([
      ...items,
      {
        id: crypto.randomUUID(),
        description: newDescription,
        quantity: parseFloat(newQuantity),
        unit_price: parseFloat(newUnitPrice),
      },
    ]);

    setNewDescription("");
    setNewQuantity("1");
    setNewUnitPrice("");
  };

  const removeItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const subtotal = items.reduce(
    (sum, item) => sum + item.quantity * item.unit_price,
    0
  );

  const handleSubmit = async () => {
    if (!supplierId || items.length === 0) return;

    await createMutation.mutateAsync({
      supplier_id: supplierId,
      expected_delivery: expectedDelivery || undefined,
      notes: notes || undefined,
      items: items.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        inventory_item_id: item.inventory_item_id,
      })),
    });

    // Reset form
    setSupplierId("");
    setExpectedDelivery("");
    setNotes("");
    setItems([]);
    onOpenChange(false);
  };

  const activeSuppliers = suppliers.filter((s) => s.is_active);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Nueva Orden de Compra
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Order header */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Proveedor *</Label>
              <Select value={supplierId} onValueChange={setSupplierId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar proveedor" />
                </SelectTrigger>
                <SelectContent>
                  {activeSuppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Fecha Entrega Esperada</Label>
              <Input
                type="date"
                value={expectedDelivery}
                onChange={(e) => setExpectedDelivery(e.target.value)}
              />
            </div>
          </div>

          {/* Add item form */}
          <div className="p-4 bg-muted/50 rounded-lg space-y-4">
            <h4 className="font-medium">Agregar Ítem</h4>
            <div className="grid grid-cols-4 gap-4">
              <div className="col-span-2">
                <Label>Descripción *</Label>
                <Input
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Nombre del producto"
                />
              </div>
              <div>
                <Label>Cantidad *</Label>
                <Input
                  type="number"
                  min={1}
                  value={newQuantity}
                  onChange={(e) => setNewQuantity(e.target.value)}
                />
              </div>
              <div>
                <Label>Precio Unit. (COP) *</Label>
                <Input
                  type="number"
                  min={0}
                  value={newUnitPrice}
                  onChange={(e) => setNewUnitPrice(e.target.value)}
                />
              </div>
            </div>
            <Button
              onClick={addItem}
              variant="outline"
              disabled={!newDescription || !newQuantity || !newUnitPrice}
            >
              <Plus className="h-4 w-4 mr-1" />
              Agregar Ítem
            </Button>
          </div>

          {/* Items table */}
          {items.length > 0 && (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="text-right">Cantidad</TableHead>
                    <TableHead className="text-right">Precio Unit.</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        {item.description}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.quantity}
                      </TableCell>
                      <TableCell className="text-right">
                        ${item.unit_price.toLocaleString("es-CO")}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ${(item.quantity * item.unit_price).toLocaleString("es-CO")}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(item.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell colSpan={3} className="text-right font-medium">
                      Total:
                    </TableCell>
                    <TableCell className="text-right font-bold text-lg">
                      ${subtotal.toLocaleString("es-CO")}
                    </TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}

          {/* Notes */}
          <div>
            <Label>Notas</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Instrucciones especiales..."
              rows={2}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!supplierId || items.length === 0 || createMutation.isPending}
            >
              {createMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Crear Orden
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
