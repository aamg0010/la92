import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Package,
  Plus,
  Search,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Calendar,
  Download,
  Upload,
  History,
  Box,
  Loader2,
} from "lucide-react";
import {
  useInventoryItems,
  useInventoryCategories,
  useInventoryMovements,
  useInventoryStats,
  useLowStockItems,
  useCreateInventoryItem,
  useCreateInventoryMovement,
  MOVEMENT_TYPES,
} from "@/hooks/useInventory";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const getStatusBadge = (quantity: number, minStock: number | null) => {
  const min = minStock ?? 0;
  if (quantity <= min * 0.5) {
    return <Badge variant="destructive">Stock Crítico</Badge>;
  }
  if (quantity <= min) {
    return <Badge className="bg-warning text-warning-foreground">Stock Bajo</Badge>;
  }
  return <Badge className="bg-success text-success-foreground">OK</Badge>;
};

const getMovementBadge = (type: string) => {
  switch (type) {
    case "purchase":
      return <Badge className="bg-success/20 text-success">Compra</Badge>;
    case "use":
      return <Badge className="bg-primary/20 text-primary">Uso</Badge>;
    case "adjustment":
      return <Badge className="bg-warning/20 text-warning">Ajuste</Badge>;
    case "return":
      return <Badge className="bg-accent/20 text-accent">Devolución</Badge>;
    case "expired":
      return <Badge variant="destructive">Vencido</Badge>;
    default:
      return <Badge variant="outline">{type}</Badge>;
  }
};

export default function Inventario() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [newItemDialogOpen, setNewItemDialogOpen] = useState(false);
  const [newMovementDialogOpen, setNewMovementDialogOpen] = useState(false);
  
  // Form states
  const [newItem, setNewItem] = useState({
    sku: "", name: "", category_id: "", unit: "unidad", quantity: 0,
    min_stock: 5, unit_cost: 0, supplier: "", location: "", expiration_date: "",
  });
  const [newMovement, setNewMovement] = useState({
    item_id: "", movement_type: "purchase", quantity: 0, notes: "",
  });

  // Data hooks
  const { data: items = [], isLoading: loadingItems } = useInventoryItems();
  const { data: categories = [] } = useInventoryCategories();
  const { data: movements = [], isLoading: loadingMovements } = useInventoryMovements();
  const { data: stats } = useInventoryStats();
  const { data: lowStockItems = [] } = useLowStockItems();
  
  // Mutations
  const createItem = useCreateInventoryItem();
  const createMovement = useCreateInventoryMovement();

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    const matchesCategory =
      selectedCategory === "all" || item.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleCreateItem = async () => {
    await createItem.mutateAsync({
      ...newItem,
      category_id: newItem.category_id || null,
      expiration_date: newItem.expiration_date || null,
    });
    setNewItemDialogOpen(false);
    setNewItem({
      sku: "", name: "", category_id: "", unit: "unidad", quantity: 0,
      min_stock: 5, unit_cost: 0, supplier: "", location: "", expiration_date: "",
    });
  };

  const handleCreateMovement = async () => {
    const movementType = MOVEMENT_TYPES.find(m => m.value === newMovement.movement_type);
    const signedQuantity = movementType?.sign === -1 
      ? -Math.abs(newMovement.quantity) 
      : Math.abs(newMovement.quantity);
    
    await createMovement.mutateAsync({
      item_id: newMovement.item_id,
      movement_type: newMovement.movement_type,
      quantity: signedQuantity,
      notes: newMovement.notes || undefined,
    });
    setNewMovementDialogOpen(false);
    setNewMovement({ item_id: "", movement_type: "purchase", quantity: 0, notes: "" });
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(amount);

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">Inventario</h1>
            <p className="text-muted-foreground mt-1">Gestión de materiales y materias primas</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
            <Dialog open={newItemDialogOpen} onOpenChange={setNewItemDialogOpen}>
              <DialogTrigger asChild>
                <Button><Plus className="w-4 h-4 mr-2" />Nuevo Artículo</Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Agregar Artículo al Inventario</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="space-y-2">
                    <Label>SKU</Label>
                    <Input placeholder="Ej: RES-002" value={newItem.sku} onChange={(e) => setNewItem({ ...newItem, sku: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Nombre *</Label>
                    <Input placeholder="Nombre del artículo" value={newItem.name} onChange={(e) => setNewItem({ ...newItem, name: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Categoría</Label>
                    <Select value={newItem.category_id} onValueChange={(v) => setNewItem({ ...newItem, category_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Unidad</Label>
                    <Input placeholder="Ej: caja, unidad, ml" value={newItem.unit} onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Cantidad Inicial</Label>
                    <Input type="number" value={newItem.quantity} onChange={(e) => setNewItem({ ...newItem, quantity: Number(e.target.value) })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Stock Mínimo</Label>
                    <Input type="number" value={newItem.min_stock} onChange={(e) => setNewItem({ ...newItem, min_stock: Number(e.target.value) })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Costo Unitario (COP)</Label>
                    <Input type="number" value={newItem.unit_cost} onChange={(e) => setNewItem({ ...newItem, unit_cost: Number(e.target.value) })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Proveedor</Label>
                    <Input placeholder="Nombre del proveedor" value={newItem.supplier} onChange={(e) => setNewItem({ ...newItem, supplier: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Ubicación</Label>
                    <Input placeholder="Ej: Gabinete A" value={newItem.location} onChange={(e) => setNewItem({ ...newItem, location: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Fecha de Vencimiento</Label>
                    <Input type="date" value={newItem.expiration_date} onChange={(e) => setNewItem({ ...newItem, expiration_date: e.target.value })} />
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <Button variant="outline" onClick={() => setNewItemDialogOpen(false)}>Cancelar</Button>
                  <Button onClick={handleCreateItem} disabled={!newItem.name || createItem.isPending}>
                    {createItem.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Guardar Artículo
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="card-elevated">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Package className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Artículos</p>
                  <p className="text-2xl font-bold text-foreground">{stats?.totalItems ?? 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="card-elevated">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Valor Total</p>
                  <p className="text-2xl font-bold text-foreground">
                    {formatCurrency(stats?.totalValue ?? 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="card-elevated">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
                  <TrendingDown className="w-6 h-6 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Stock Bajo</p>
                  <p className="text-2xl font-bold text-foreground">{stats?.lowStockCount ?? 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="card-elevated">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Por Vencer</p>
                  <p className="text-2xl font-bold text-foreground">{stats?.expiringCount ?? 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="inventory" className="space-y-4">
          <TabsList>
            <TabsTrigger value="inventory"><Package className="w-4 h-4 mr-2" />Inventario</TabsTrigger>
            <TabsTrigger value="movements"><History className="w-4 h-4 mr-2" />Movimientos</TabsTrigger>
            <TabsTrigger value="categories"><Box className="w-4 h-4 mr-2" />Categorías</TabsTrigger>
            <TabsTrigger value="alerts"><AlertTriangle className="w-4 h-4 mr-2" />Alertas ({lowStockItems.length})</TabsTrigger>
          </TabsList>

          {/* Inventory Tab */}
          <TabsContent value="inventory" className="space-y-4">
            <Card className="card-elevated">
              <CardHeader className="pb-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por nombre o SKU..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-[200px]"><SelectValue placeholder="Categoría" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las categorías</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Dialog open={newMovementDialogOpen} onOpenChange={setNewMovementDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline"><Upload className="w-4 h-4 mr-2" />Registrar Movimiento</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Registrar Movimiento de Inventario</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 mt-4">
                        <div className="space-y-2">
                          <Label>Artículo *</Label>
                          <Select value={newMovement.item_id} onValueChange={(v) => setNewMovement({ ...newMovement, item_id: v })}>
                            <SelectTrigger><SelectValue placeholder="Seleccionar artículo" /></SelectTrigger>
                            <SelectContent>
                              {items.map((item) => (
                                <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Tipo de Movimiento *</Label>
                          <Select value={newMovement.movement_type} onValueChange={(v) => setNewMovement({ ...newMovement, movement_type: v })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {MOVEMENT_TYPES.map((type) => (
                                <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Cantidad *</Label>
                          <Input type="number" min="1" value={newMovement.quantity} onChange={(e) => setNewMovement({ ...newMovement, quantity: Number(e.target.value) })} />
                        </div>
                        <div className="space-y-2">
                          <Label>Notas</Label>
                          <Input placeholder="Referencia o notas adicionales" value={newMovement.notes} onChange={(e) => setNewMovement({ ...newMovement, notes: e.target.value })} />
                        </div>
                      </div>
                      <div className="flex justify-end gap-3 mt-6">
                        <Button variant="outline" onClick={() => setNewMovementDialogOpen(false)}>Cancelar</Button>
                        <Button onClick={handleCreateMovement} disabled={!newMovement.item_id || !newMovement.quantity || createMovement.isPending}>
                          {createMovement.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                          Registrar
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {loadingItems ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>SKU</TableHead>
                        <TableHead>Artículo</TableHead>
                        <TableHead>Categoría</TableHead>
                        <TableHead className="text-center">Cantidad</TableHead>
                        <TableHead className="text-right">Costo Unit.</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Vencimiento</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredItems.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                            No hay artículos en el inventario
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredItems.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-mono text-sm">{item.sku || "-"}</TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">{item.name}</p>
                                <p className="text-xs text-muted-foreground">{item.supplier || "-"}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{item.category?.name || "Sin categoría"}</Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <span className="font-medium">{Number(item.quantity)}</span>
                              <span className="text-muted-foreground text-sm"> {item.unit}</span>
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {formatCurrency(Number(item.unit_cost))}
                            </TableCell>
                            <TableCell>{getStatusBadge(Number(item.quantity), item.min_stock ? Number(item.min_stock) : null)}</TableCell>
                            <TableCell>
                              {item.expiration_date ? (
                                <span className="text-sm">{format(new Date(item.expiration_date), "dd/MM/yyyy")}</span>
                              ) : (
                                <span className="text-muted-foreground">N/A</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Movements Tab */}
          <TabsContent value="movements" className="space-y-4">
            <Card className="card-elevated">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Movimientos Recientes</h3>
                </div>
              </CardHeader>
              <CardContent>
                {loadingMovements ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Artículo</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead className="text-center">Cantidad</TableHead>
                        <TableHead>Notas</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {movements.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                            No hay movimientos registrados
                          </TableCell>
                        </TableRow>
                      ) : (
                        movements.slice(0, 20).map((mov) => (
                          <TableRow key={mov.id}>
                            <TableCell className="text-sm">
                              {format(new Date(mov.created_at), "dd MMM yyyy HH:mm", { locale: es })}
                            </TableCell>
                            <TableCell className="font-medium">{mov.item?.name || "-"}</TableCell>
                            <TableCell>{getMovementBadge(mov.movement_type)}</TableCell>
                            <TableCell className={`text-center font-semibold ${Number(mov.quantity) > 0 ? "text-success" : "text-destructive"}`}>
                              {Number(mov.quantity) > 0 ? "+" : ""}{Number(mov.quantity)}
                            </TableCell>
                            <TableCell className="text-muted-foreground">{mov.notes || "-"}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent value="categories" className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((cat) => {
                const catItems = items.filter((i) => i.category_id === cat.id);
                const catValue = catItems.reduce((acc, i) => acc + Number(i.quantity) * Number(i.unit_cost), 0);
                return (
                  <Card key={cat.id} className="card-elevated hover:shadow-lg transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Package className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-foreground">{cat.name}</p>
                          <p className="text-sm text-muted-foreground">{catItems.length} artículos</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-foreground">{formatCurrency(catValue)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Alerts Tab */}
          <TabsContent value="alerts" className="space-y-4">
            <Card className="card-elevated">
              <CardHeader>
                <h3 className="font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-warning" />
                  Alertas de Stock Bajo
                </h3>
              </CardHeader>
              <CardContent>
                {lowStockItems.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">No hay alertas de stock bajo</p>
                ) : (
                  <div className="space-y-3">
                    {lowStockItems.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-warning/5 border border-warning/20">
                        <div>
                          <p className="font-medium text-foreground">{item.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Stock actual: {Number(item.quantity)} {item.unit} · Mínimo: {Number(item.min_stock)} {item.unit}
                          </p>
                        </div>
                        {getStatusBadge(Number(item.quantity), item.min_stock ? Number(item.min_stock) : null)}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
