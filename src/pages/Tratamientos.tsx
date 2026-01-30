import { useState } from "react";
import { Plus, Search, Filter, Stethoscope, Truck, ShoppingCart } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTreatments, Treatment, TREATMENT_CATEGORIES } from "@/hooks/useTreatments";
import { useSuppliers, Supplier, usePurchaseOrders, PURCHASE_ORDER_STATUS } from "@/hooks/useSuppliers";
import { useUserRole } from "@/hooks/useUserRole";
import { TreatmentDialog } from "@/components/treatments/TreatmentDialog";
import { TreatmentsTable } from "@/components/treatments/TreatmentsTable";
import { SupplierDialog } from "@/components/suppliers/SupplierDialog";
import { SuppliersTable } from "@/components/suppliers/SuppliersTable";
import { SupplierProductsDialog } from "@/components/suppliers/SupplierProductsDialog";
import { PurchaseOrderDialog } from "@/components/suppliers/PurchaseOrderDialog";
import { StockAlertsPanel } from "@/components/suppliers/StockAlertsPanel";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function Tratamientos() {
  const [activeTab, setActiveTab] = useState("tratamientos");
  
  // Treatments state
  const [treatmentDialogOpen, setTreatmentDialogOpen] = useState(false);
  const [selectedTreatment, setSelectedTreatment] = useState<Treatment | null>(null);
  const [treatmentSearch, setTreatmentSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Suppliers state
  const [supplierDialogOpen, setSupplierDialogOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [productsDialogOpen, setProductsDialogOpen] = useState(false);
  const [supplierForProducts, setSupplierForProducts] = useState<Supplier | null>(null);
  const [supplierSearch, setSupplierSearch] = useState("");

  // Purchase orders state
  const [purchaseOrderDialogOpen, setPurchaseOrderDialogOpen] = useState(false);

  // Data
  const { data: treatments = [], isLoading: loadingTreatments } = useTreatments();
  const { data: suppliers = [], isLoading: loadingSuppliers } = useSuppliers();
  const { data: purchaseOrders = [], isLoading: loadingOrders } = usePurchaseOrders();
  const { data: userRole } = useUserRole();

  const canManageTreatments = userRole === "admin" || userRole === "doctor";
  const canManageSuppliers = userRole === "admin";

  // Filter treatments
  const filteredTreatments = treatments.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(treatmentSearch.toLowerCase()) ||
      t.code.toLowerCase().includes(treatmentSearch.toLowerCase());
    const matchesCategory =
      categoryFilter === "all" || t.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Filter suppliers
  const filteredSuppliers = suppliers.filter((s) =>
    s.name.toLowerCase().includes(supplierSearch.toLowerCase()) ||
    (s.contact_name?.toLowerCase().includes(supplierSearch.toLowerCase()) ?? false)
  );

  const handleEditTreatment = (treatment: Treatment) => {
    setSelectedTreatment(treatment);
    setTreatmentDialogOpen(true);
  };

  const handleNewTreatment = () => {
    setSelectedTreatment(null);
    setTreatmentDialogOpen(true);
  };

  const handleEditSupplier = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setSupplierDialogOpen(true);
  };

  const handleNewSupplier = () => {
    setSelectedSupplier(null);
    setSupplierDialogOpen(true);
  };

  const handleViewProducts = (supplier: Supplier) => {
    setSupplierForProducts(supplier);
    setProductsDialogOpen(true);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">
              Tratamientos y Proveedores
            </h1>
            <p className="text-muted-foreground mt-1">
              Gestiona el catálogo de tratamientos y proveedores de materiales
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="tratamientos" className="flex items-center gap-2">
              <Stethoscope className="h-4 w-4" />
              Tratamientos
            </TabsTrigger>
            <TabsTrigger value="proveedores" className="flex items-center gap-2">
              <Truck className="h-4 w-4" />
              Proveedores
            </TabsTrigger>
            <TabsTrigger value="ordenes" className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Órdenes de Compra
            </TabsTrigger>
          </TabsList>

          {/* Treatments Tab */}
          <TabsContent value="tratamientos" className="space-y-4 mt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar tratamientos..."
                  value={treatmentSearch}
                  onChange={(e) => setTreatmentSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[200px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las categorías</SelectItem>
                  {TREATMENT_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {canManageTreatments && (
                <Button onClick={handleNewTreatment}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Tratamiento
                </Button>
              )}
            </div>

            {loadingTreatments ? (
              <div className="text-center py-12 text-muted-foreground">
                Cargando tratamientos...
              </div>
            ) : (
              <TreatmentsTable
                treatments={filteredTreatments}
                onEdit={handleEditTreatment}
              />
            )}
          </TabsContent>

          {/* Suppliers Tab */}
          <TabsContent value="proveedores" className="space-y-6 mt-6">
            <StockAlertsPanel />

            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar proveedores..."
                  value={supplierSearch}
                  onChange={(e) => setSupplierSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              {canManageSuppliers && (
                <Button onClick={handleNewSupplier}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Proveedor
                </Button>
              )}
            </div>

            {loadingSuppliers ? (
              <div className="text-center py-12 text-muted-foreground">
                Cargando proveedores...
              </div>
            ) : (
              <SuppliersTable
                suppliers={filteredSuppliers}
                onEdit={handleEditSupplier}
                onViewProducts={handleViewProducts}
              />
            )}
          </TabsContent>

          {/* Purchase Orders Tab */}
          <TabsContent value="ordenes" className="space-y-4 mt-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Historial de Órdenes</h3>
              {canManageSuppliers && (
                <Button onClick={() => setPurchaseOrderDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva Orden
                </Button>
              )}
            </div>

            {loadingOrders ? (
              <div className="text-center py-12 text-muted-foreground">
                Cargando órdenes...
              </div>
            ) : purchaseOrders.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No hay órdenes de compra registradas
              </div>
            ) : (
              <div className="rounded-lg border bg-card">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>N° Orden</TableHead>
                      <TableHead>Proveedor</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Entrega Esperada</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-center">Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchaseOrders.map((order) => {
                      const statusInfo = PURCHASE_ORDER_STATUS[order.status as keyof typeof PURCHASE_ORDER_STATUS];
                      return (
                        <TableRow key={order.id}>
                          <TableCell className="font-mono font-medium">
                            {order.order_number}
                          </TableCell>
                          <TableCell>
                            {(order.supplier as any)?.name || "—"}
                          </TableCell>
                          <TableCell>
                            {format(new Date(order.order_date), "dd MMM yyyy", {
                              locale: es,
                            })}
                          </TableCell>
                          <TableCell>
                            {order.expected_delivery
                              ? format(new Date(order.expected_delivery), "dd MMM yyyy", {
                                  locale: es,
                                })
                              : "—"}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            ${order.total.toLocaleString("es-CO")}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge className={statusInfo?.color}>
                              {statusInfo?.label || order.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialogs */}
      <TreatmentDialog
        open={treatmentDialogOpen}
        onOpenChange={setTreatmentDialogOpen}
        treatment={selectedTreatment}
      />

      <SupplierDialog
        open={supplierDialogOpen}
        onOpenChange={setSupplierDialogOpen}
        supplier={selectedSupplier}
      />

      <SupplierProductsDialog
        open={productsDialogOpen}
        onOpenChange={setProductsDialogOpen}
        supplier={supplierForProducts}
      />

      <PurchaseOrderDialog
        open={purchaseOrderDialogOpen}
        onOpenChange={setPurchaseOrderDialogOpen}
      />
    </MainLayout>
  );
}
