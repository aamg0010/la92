import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  ArrowUpDown,
  Calendar,
  Download,
  Upload,
  History,
  Box,
  Pill,
  Wrench,
  FileText,
  ShoppingCart,
} from "lucide-react";

// Datos de ejemplo
const inventoryItems = [
  {
    id: "1",
    sku: "RES-001",
    name: "Resina Compuesta A2",
    category: "Materiales Dentales",
    quantity: 8,
    minStock: 10,
    unit: "jeringa",
    unitCost: 85000,
    supplier: "Dentales Colombia",
    expirationDate: "2025-06-15",
    location: "Gabinete A",
    status: "low",
  },
  {
    id: "2",
    sku: "ANE-001",
    name: "Lidocaína 2% c/Epinefrina",
    category: "Medicamentos",
    quantity: 45,
    minStock: 20,
    unit: "cartucho",
    unitCost: 3500,
    supplier: "Pharma Dental",
    expirationDate: "2025-03-20",
    location: "Refrigerador",
    status: "ok",
  },
  {
    id: "3",
    sku: "GUA-001",
    name: "Guantes de Nitrilo M",
    category: "Desechables",
    quantity: 3,
    minStock: 5,
    unit: "caja x100",
    unitCost: 45000,
    supplier: "MedSupply",
    expirationDate: null,
    location: "Almacén",
    status: "critical",
  },
  {
    id: "4",
    sku: "FRE-001",
    name: "Fresa Diamante Redonda",
    category: "Instrumental",
    quantity: 25,
    minStock: 10,
    unit: "unidad",
    unitCost: 12000,
    supplier: "Dental Tools",
    expirationDate: null,
    location: "Gabinete B",
    status: "ok",
  },
  {
    id: "5",
    sku: "CEM-001",
    name: "Cemento de Ionómero de Vidrio",
    category: "Materiales Dentales",
    quantity: 4,
    minStock: 5,
    unit: "kit",
    unitCost: 120000,
    supplier: "3M Dental",
    expirationDate: "2025-08-10",
    location: "Gabinete A",
    status: "low",
  },
];

const recentMovements = [
  {
    id: "1",
    date: "2025-01-28",
    item: "Resina Compuesta A2",
    type: "use",
    quantity: -2,
    user: "Dra. Ana María",
    reference: "Cita #1234",
  },
  {
    id: "2",
    date: "2025-01-27",
    item: "Lidocaína 2%",
    type: "purchase",
    quantity: 50,
    user: "Admin",
    reference: "Compra #567",
  },
  {
    id: "3",
    date: "2025-01-27",
    item: "Guantes de Nitrilo M",
    type: "use",
    quantity: -1,
    user: "Dra. Ana María",
    reference: "Uso diario",
  },
  {
    id: "4",
    date: "2025-01-26",
    item: "Fresa Diamante Redonda",
    type: "adjustment",
    quantity: -3,
    user: "Admin",
    reference: "Ajuste inventario",
  },
];

const categories = [
  { name: "Materiales Dentales", icon: Package, count: 45, value: 2850000 },
  { name: "Medicamentos", icon: Pill, count: 23, value: 450000 },
  { name: "Desechables", icon: Box, count: 18, value: 380000 },
  { name: "Instrumental", icon: Wrench, count: 67, value: 1200000 },
  { name: "Equipos", icon: ShoppingCart, count: 8, value: 15000000 },
  { name: "Oficina", icon: FileText, count: 12, value: 85000 },
];

const getStatusBadge = (status: string) => {
  switch (status) {
    case "critical":
      return <Badge variant="destructive">Stock Crítico</Badge>;
    case "low":
      return <Badge className="bg-warning text-warning-foreground">Stock Bajo</Badge>;
    default:
      return <Badge className="bg-success text-success-foreground">OK</Badge>;
  }
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

  const filteredItems = inventoryItems.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const lowStockItems = inventoryItems.filter(
    (item) => item.status === "low" || item.status === "critical"
  );

  const totalValue = inventoryItems.reduce(
    (acc, item) => acc + item.quantity * item.unitCost,
    0
  );

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">
              Inventario
            </h1>
            <p className="text-muted-foreground mt-1">
              Gestión de materiales y materias primas del consultorio
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Nuevo Artículo
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Agregar Artículo al Inventario</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="space-y-2">
                    <Label>SKU</Label>
                    <Input placeholder="Ej: RES-002" />
                  </div>
                  <div className="space-y-2">
                    <Label>Nombre</Label>
                    <Input placeholder="Nombre del artículo" />
                  </div>
                  <div className="space-y-2">
                    <Label>Categoría</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.name} value={cat.name}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Unidad</Label>
                    <Input placeholder="Ej: caja, unidad, ml" />
                  </div>
                  <div className="space-y-2">
                    <Label>Cantidad Inicial</Label>
                    <Input type="number" placeholder="0" />
                  </div>
                  <div className="space-y-2">
                    <Label>Stock Mínimo</Label>
                    <Input type="number" placeholder="5" />
                  </div>
                  <div className="space-y-2">
                    <Label>Costo Unitario (COP)</Label>
                    <Input type="number" placeholder="0" />
                  </div>
                  <div className="space-y-2">
                    <Label>Proveedor</Label>
                    <Input placeholder="Nombre del proveedor" />
                  </div>
                  <div className="space-y-2">
                    <Label>Ubicación</Label>
                    <Input placeholder="Ej: Gabinete A" />
                  </div>
                  <div className="space-y-2">
                    <Label>Fecha de Vencimiento</Label>
                    <Input type="date" />
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <Button variant="outline">Cancelar</Button>
                  <Button>Guardar Artículo</Button>
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
                  <p className="text-2xl font-bold text-foreground">
                    {inventoryItems.length}
                  </p>
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
                    ${(totalValue / 1000000).toFixed(1)}M
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
                  <p className="text-2xl font-bold text-foreground">
                    {lowStockItems.length}
                  </p>
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
                  <p className="text-2xl font-bold text-foreground">3</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="inventory" className="space-y-4">
          <TabsList>
            <TabsTrigger value="inventory">
              <Package className="w-4 h-4 mr-2" />
              Inventario
            </TabsTrigger>
            <TabsTrigger value="movements">
              <History className="w-4 h-4 mr-2" />
              Movimientos
            </TabsTrigger>
            <TabsTrigger value="categories">
              <Box className="w-4 h-4 mr-2" />
              Categorías
            </TabsTrigger>
            <TabsTrigger value="alerts">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Alertas ({lowStockItems.length})
            </TabsTrigger>
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
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las categorías</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat.name} value={cat.name}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>SKU</TableHead>
                      <TableHead>Artículo</TableHead>
                      <TableHead>Categoría</TableHead>
                      <TableHead className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          Cantidad
                          <ArrowUpDown className="w-3 h-3" />
                        </div>
                      </TableHead>
                      <TableHead className="text-right">Costo Unit.</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Vencimiento</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-mono text-sm">
                          {item.sku}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{item.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.supplier}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{item.category}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="font-medium">{item.quantity}</span>
                          <span className="text-muted-foreground text-sm">
                            {" "}
                            {item.unit}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          ${item.unitCost.toLocaleString()}
                        </TableCell>
                        <TableCell>{getStatusBadge(item.status)}</TableCell>
                        <TableCell>
                          {item.expirationDate ? (
                            <span className="text-sm">{item.expirationDate}</span>
                          ) : (
                            <span className="text-muted-foreground">N/A</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm">
                              <Upload className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <TrendingDown className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Movements Tab */}
          <TabsContent value="movements">
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle>Historial de Movimientos</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Artículo</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="text-center">Cantidad</TableHead>
                      <TableHead>Usuario</TableHead>
                      <TableHead>Referencia</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentMovements.map((movement) => (
                      <TableRow key={movement.id}>
                        <TableCell>{movement.date}</TableCell>
                        <TableCell className="font-medium">
                          {movement.item}
                        </TableCell>
                        <TableCell>{getMovementBadge(movement.type)}</TableCell>
                        <TableCell className="text-center">
                          <span
                            className={
                              movement.quantity > 0
                                ? "text-success font-medium"
                                : "text-destructive font-medium"
                            }
                          >
                            {movement.quantity > 0 ? "+" : ""}
                            {movement.quantity}
                          </span>
                        </TableCell>
                        <TableCell>{movement.user}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {movement.reference}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent value="categories">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((category) => {
                const Icon = category.icon;
                return (
                  <Card key={category.name} className="card-elevated hover:shadow-lg transition-shadow cursor-pointer">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Icon className="w-7 h-7 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground">
                            {category.name}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {category.count} artículos
                          </p>
                          <p className="text-sm font-medium text-primary">
                            ${(category.value / 1000).toFixed(0)}K valor
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Alerts Tab */}
          <TabsContent value="alerts">
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-warning" />
                  Alertas de Stock
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {lowStockItems.map((item) => (
                    <div
                      key={item.id}
                      className={`p-4 rounded-lg border ${
                        item.status === "critical"
                          ? "bg-destructive/5 border-destructive/30"
                          : "bg-warning/5 border-warning/30"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                              item.status === "critical"
                                ? "bg-destructive/10"
                                : "bg-warning/10"
                            }`}
                          >
                            <Package
                              className={`w-6 h-6 ${
                                item.status === "critical"
                                  ? "text-destructive"
                                  : "text-warning"
                              }`}
                            />
                          </div>
                          <div>
                            <p className="font-semibold">{item.name}</p>
                            <p className="text-sm text-muted-foreground">
                              SKU: {item.sku} • {item.supplier}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold">
                            {item.quantity} / {item.minStock}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {item.unit}
                          </p>
                        </div>
                        <Button variant="outline" size="sm">
                          <ShoppingCart className="w-4 h-4 mr-2" />
                          Ordenar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
