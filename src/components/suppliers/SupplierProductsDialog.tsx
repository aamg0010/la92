import { useState } from "react";
import { Plus, Trash2, Link2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Supplier,
  useSupplierProducts,
  useAddSupplierProduct,
  useDeleteSupplierProduct,
} from "@/hooks/useSuppliers";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/apiClient";

interface SupplierProductsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier: Supplier | null;
}

export function SupplierProductsDialog({
  open,
  onOpenChange,
  supplier,
}: SupplierProductsDialogProps) {
  const [productName, setProductName] = useState("");
  const [supplierSku, setSupplierSku] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [linkedItemId, setLinkedItemId] = useState("");
  const [isPreferred, setIsPreferred] = useState(false);

  const { data: products = [], isLoading } = useSupplierProducts(
    supplier?.id ?? null
  );
  const addMutation = useAddSupplierProduct();
  const deleteMutation = useDeleteSupplierProduct();

  // Fetch inventory items for linking
  const { data: inventoryItems = [] } = useQuery({
    queryKey: ["inventory-items-link"],
    queryFn: async () => {
      const { data, error } = await api
        .from("inventory_items")
        .select("id,name,unit")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data as { id: string; name: string; unit: string }[];
    },
  });

  const handleAddProduct = async () => {
    if (!supplier || !productName || !unitPrice) return;

    await addMutation.mutateAsync({
      supplier_id: supplier.id,
      product_name: productName,
      supplier_sku: supplierSku || null,
      unit_price: parseFloat(unitPrice),
      inventory_item_id: linkedItemId || null,
      is_preferred: isPreferred,
      min_order_quantity: 1,
      lead_time_days: 3,
      notes: null,
    });

    setProductName("");
    setSupplierSku("");
    setUnitPrice("");
    setLinkedItemId("");
    setIsPreferred(false);
  };

  const handleDeleteProduct = async (id: string) => {
    if (!supplier) return;
    await deleteMutation.mutateAsync({ id, supplierId: supplier.id });
  };

  if (!supplier) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Productos de {supplier.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Add product form */}
          <div className="p-4 bg-muted/50 rounded-lg space-y-4">
            <h4 className="font-medium">Agregar Producto</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nombre del Producto *</Label>
                <Input
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="Resina composite A2"
                />
              </div>
              <div>
                <Label>SKU Proveedor</Label>
                <Input
                  value={supplierSku}
                  onChange={(e) => setSupplierSku(e.target.value)}
                  placeholder="RC-A2-001"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Precio Unitario (COP) *</Label>
                <Input
                  type="number"
                  min={0}
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div>
                <Label>Vincular a Inventario</Label>
                <Select value={linkedItemId} onValueChange={setLinkedItemId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar item" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Sin vincular</SelectItem>
                    {inventoryItems.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end gap-4">
                <div className="flex items-center gap-2">
                  <Switch
                    id="preferred"
                    checked={isPreferred}
                    onCheckedChange={setIsPreferred}
                  />
                  <Label htmlFor="preferred">Preferido</Label>
                </div>
                <Button
                  onClick={handleAddProduct}
                  disabled={!productName || !unitPrice || addMutation.isPending}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Agregar
                </Button>
              </div>
            </div>
          </div>

          {/* Products table */}
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Cargando productos...
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay productos registrados para este proveedor
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead className="text-right">Precio</TableHead>
                  <TableHead>Vinculado a</TableHead>
                  <TableHead className="text-center">Estado</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">
                      {product.product_name}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {product.supplier_sku || "—"}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ${product.unit_price.toLocaleString("es-CO")}
                    </TableCell>
                    <TableCell>
                      {product.inventory_item ? (
                        <span className="flex items-center gap-1 text-sm">
                          <Link2 className="h-3.5 w-3.5 text-muted-foreground" />
                          {product.inventory_item.name}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {product.is_preferred && (
                        <Badge variant="default">Preferido</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteProduct(product.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
