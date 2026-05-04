/**
 * SettlementsPanel.tsx
 * Panel para liquidacion de odontologos
 *
 * Formula: Liquidacion = (Ingresos - Costos Laboratorio) x Porcentaje
 */

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Calculator,
  Calendar,
  Check,
  DollarSign,
  FileText,
  FlaskConical,
  Loader2,
  Percent,
  Save,
  User,
  X,
  AlertCircle,
  TrendingUp,
  Clock,
} from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";
import {
  useDoctorsForSettlement,
  useCalculateSettlement,
  useDoctorSettlements,
  usePendingSettlements,
  useCreateSettlement,
  useMarkSettlementPaid,
  useCancelSettlement,
  useUpdateSettlementPercentage,
  useSettlementStats,
  getStatusBadge,
  type SettlementCalculation,
  type DoctorSettlement,
} from "@/hooks/useSettlements";

export function SettlementsPanel() {
  const { formatMoney } = useCurrency();

  // State for calculation
  const [selectedDoctor, setSelectedDoctor] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  // State for viewing details
  const [viewSettlement, setViewSettlement] = useState<DoctorSettlement | null>(null);

  // State for marking as paid
  const [paySettlement, setPaySettlement] = useState<DoctorSettlement | null>(null);
  const [payNotes, setPayNotes] = useState("");

  // State for editing percentage
  const [editPercentage, setEditPercentage] = useState<{
    userId: string;
    name: string;
    current: number;
  } | null>(null);
  const [newPercentage, setNewPercentage] = useState("");

  // Queries
  const { data: doctors, isLoading: loadingDoctors } = useDoctorsForSettlement();
  const { data: calculation, isLoading: calculating } = useCalculateSettlement(
    selectedDoctor || null,
    selectedDate || null
  );
  const { data: pendingSettlements, isLoading: loadingPending } = usePendingSettlements();
  const { data: allSettlements, isLoading: loadingAll } = useDoctorSettlements();
  const { data: stats } = useSettlementStats();

  // Mutations
  const createSettlement = useCreateSettlement();
  const markPaid = useMarkSettlementPaid();
  const cancelSettlement = useCancelSettlement();
  const updatePercentage = useUpdateSettlementPercentage();

  // Handlers
  const handleSaveSettlement = () => {
    if (calculation) {
      createSettlement.mutate(calculation);
    }
  };

  const handleMarkPaid = () => {
    if (paySettlement) {
      markPaid.mutate(
        { settlementId: paySettlement.id, notes: payNotes },
        {
          onSuccess: () => {
            setPaySettlement(null);
            setPayNotes("");
          },
        }
      );
    }
  };

  const handleUpdatePercentage = () => {
    if (editPercentage && newPercentage) {
      updatePercentage.mutate(
        { userId: editPercentage.userId, percentage: parseFloat(newPercentage) },
        {
          onSuccess: () => {
            setEditPercentage(null);
            setNewPercentage("");
          },
        }
      );
    }
  };

  const handleCancel = (settlement: DoctorSettlement) => {
    if (confirm("Esta seguro de cancelar esta liquidacion?")) {
      cancelSettlement.mutate({ settlementId: settlement.id });
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pendientes</p>
                <p className="text-2xl font-bold">{stats?.pendingCount || 0}</p>
                <p className="text-sm text-yellow-600">
                  {formatMoney(stats?.totalPending || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Check className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pagadas</p>
                <p className="text-2xl font-bold">{stats?.paidCount || 0}</p>
                <p className="text-sm text-green-600">
                  {formatMoney(stats?.totalPaid || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Liquidaciones</p>
                <p className="text-2xl font-bold">
                  {formatMoney(stats?.total || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <User className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Odontologos</p>
                <p className="text-2xl font-bold">{doctors?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="calculate" className="space-y-4">
        <TabsList>
          <TabsTrigger value="calculate" className="gap-2">
            <Calculator className="h-4 w-4" />
            Calcular Liquidacion
          </TabsTrigger>
          <TabsTrigger value="pending" className="gap-2">
            <Clock className="h-4 w-4" />
            Pendientes ({pendingSettlements?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <FileText className="h-4 w-4" />
            Historial
          </TabsTrigger>
          <TabsTrigger value="config" className="gap-2">
            <Percent className="h-4 w-4" />
            Configuracion
          </TabsTrigger>
        </TabsList>

        {/* Tab: Calcular Liquidacion */}
        <TabsContent value="calculate" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Calcular Liquidacion del Dia</CardTitle>
              <CardDescription>
                Seleccione un odontologo y fecha para calcular su liquidacion
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Odontologo</Label>
                  <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar odontologo..." />
                    </SelectTrigger>
                    <SelectContent>
                      {doctors?.map((doc) => (
                        <SelectItem key={doc.user_id} value={doc.user_id}>
                          {doc.full_name} ({doc.settlement_percentage}%)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Fecha</Label>
                  <Input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                  />
                </div>

                <div className="flex items-end">
                  <Button
                    disabled={!selectedDoctor || !selectedDate || calculating}
                    className="w-full"
                  >
                    {calculating ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Calculator className="h-4 w-4 mr-2" />
                    )}
                    Calcular
                  </Button>
                </div>
              </div>

              {calculation && (
                <CalculationResult
                  calculation={calculation}
                  formatMoney={formatMoney}
                  onSave={handleSaveSettlement}
                  isSaving={createSettlement.isPending}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Liquidaciones Pendientes */}
        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>Liquidaciones Pendientes de Pago</CardTitle>
              <CardDescription>
                Liquidaciones calculadas que aun no han sido pagadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingPending ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : pendingSettlements?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Check className="h-12 w-12 mx-auto mb-2 text-green-500" />
                  <p>No hay liquidaciones pendientes</p>
                </div>
              ) : (
                <SettlementsTable
                  settlements={pendingSettlements || []}
                  formatMoney={formatMoney}
                  onView={setViewSettlement}
                  onPay={setPaySettlement}
                  onCancel={handleCancel}
                  showPayButton
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Historial */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Liquidaciones</CardTitle>
              <CardDescription>
                Todas las liquidaciones registradas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingAll ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <SettlementsTable
                  settlements={allSettlements || []}
                  formatMoney={formatMoney}
                  onView={setViewSettlement}
                  onPay={setPaySettlement}
                  onCancel={handleCancel}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Configuracion */}
        <TabsContent value="config">
          <Card>
            <CardHeader>
              <CardTitle>Porcentajes de Liquidacion</CardTitle>
              <CardDescription>
                Configure el porcentaje de liquidacion para cada odontologo
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingDoctors ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Odontologo</TableHead>
                      <TableHead>Especialidad</TableHead>
                      <TableHead>Rol</TableHead>
                      <TableHead className="text-right">Porcentaje</TableHead>
                      <TableHead className="w-[100px]">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {doctors?.map((doc) => (
                      <TableRow key={doc.user_id}>
                        <TableCell className="font-medium">
                          {doc.full_name}
                        </TableCell>
                        <TableCell>{doc.specialty || "-"}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{doc.role}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="font-mono font-bold">
                            {doc.settlement_percentage}%
                          </span>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditPercentage({
                                userId: doc.user_id,
                                name: doc.full_name,
                                current: doc.settlement_percentage,
                              });
                              setNewPercentage(doc.settlement_percentage.toString());
                            }}
                          >
                            <Percent className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog: Ver detalles de liquidacion */}
      <Dialog open={!!viewSettlement} onOpenChange={() => setViewSettlement(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalle de Liquidacion</DialogTitle>
            <DialogDescription>
              {viewSettlement?.doctor?.full_name} -{" "}
              {viewSettlement?.settlement_date}
            </DialogDescription>
          </DialogHeader>

          {viewSettlement && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Ingresos Brutos</p>
                  <p className="text-lg font-semibold text-green-600">
                    {formatMoney(viewSettlement.gross_income)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Costos Laboratorio</p>
                  <p className="text-lg font-semibold text-red-600">
                    -{formatMoney(viewSettlement.lab_costs)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Ingreso Neto</p>
                  <p className="text-lg font-semibold">
                    {formatMoney(viewSettlement.net_income)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Porcentaje</p>
                  <p className="text-lg font-semibold">
                    {viewSettlement.settlement_percentage}%
                  </p>
                </div>
              </div>

              <Separator />

              <div className="bg-primary/5 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">Total a Pagar</p>
                <p className="text-3xl font-bold text-primary">
                  {formatMoney(viewSettlement.settlement_amount)}
                </p>
              </div>

              <div className="flex items-center justify-between">
                <Badge className={getStatusBadge(viewSettlement.status).color}>
                  {getStatusBadge(viewSettlement.status).label}
                </Badge>
                {viewSettlement.paid_date && (
                  <span className="text-sm text-muted-foreground">
                    Pagada el {viewSettlement.paid_date}
                  </span>
                )}
              </div>

              {viewSettlement.notes && (
                <div className="bg-muted p-3 rounded-lg">
                  <p className="text-sm">{viewSettlement.notes}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setViewSettlement(null)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Marcar como pagada */}
      <Dialog open={!!paySettlement} onOpenChange={() => setPaySettlement(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Marcar Liquidacion como Pagada</DialogTitle>
            <DialogDescription>
              {paySettlement?.doctor?.full_name} - {paySettlement?.settlement_date}
            </DialogDescription>
          </DialogHeader>

          {paySettlement && (
            <div className="space-y-4">
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <p className="text-sm text-muted-foreground">Monto a Pagar</p>
                <p className="text-3xl font-bold text-green-600">
                  {formatMoney(paySettlement.settlement_amount)}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Notas (opcional)</Label>
                <Textarea
                  placeholder="Ej: Pago en efectivo, transferencia #123..."
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setPaySettlement(null)}>
              Cancelar
            </Button>
            <Button onClick={handleMarkPaid} disabled={markPaid.isPending}>
              {markPaid.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              Confirmar Pago
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Editar porcentaje */}
      <Dialog open={!!editPercentage} onOpenChange={() => setEditPercentage(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Porcentaje de Liquidacion</DialogTitle>
            <DialogDescription>{editPercentage?.name}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Porcentaje de Liquidacion (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={newPercentage}
                onChange={(e) => setNewPercentage(e.target.value)}
                placeholder="Ej: 45"
              />
              <p className="text-sm text-muted-foreground">
                Porcentaje actual: {editPercentage?.current}%
              </p>
            </div>

            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-800">
                <AlertCircle className="h-4 w-4 inline mr-1" />
                Este porcentaje se aplicara a futuras liquidaciones. Las
                liquidaciones ya calculadas mantendran su porcentaje original.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditPercentage(null)}>
              Cancelar
            </Button>
            <Button
              onClick={handleUpdatePercentage}
              disabled={updatePercentage.isPending || !newPercentage}
            >
              {updatePercentage.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============ Sub-components ============

interface CalculationResultProps {
  calculation: SettlementCalculation;
  formatMoney: (amount: number) => string;
  onSave: () => void;
  isSaving: boolean;
}

function CalculationResult({
  calculation,
  formatMoney,
  onSave,
  isSaving,
}: CalculationResultProps) {
  return (
    <div className="mt-6 space-y-4">
      <Separator />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Ingresos */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              Ingresos del Dia
            </CardTitle>
          </CardHeader>
          <CardContent>
            {calculation.incomeItems.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Sin ingresos registrados
              </p>
            ) : (
              <div className="space-y-2">
                {calculation.incomeItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center text-sm"
                  >
                    <div>
                      <p className="font-medium">{item.patientName}</p>
                      <p className="text-muted-foreground text-xs">
                        {item.description}
                      </p>
                    </div>
                    <span className="font-mono text-green-600">
                      +{formatMoney(item.amount)}
                    </span>
                  </div>
                ))}
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Total Ingresos</span>
                  <span className="text-green-600">
                    {formatMoney(calculation.grossIncome)}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Costos de Laboratorio */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <FlaskConical className="h-5 w-5 text-red-600" />
              Costos de Laboratorio
            </CardTitle>
          </CardHeader>
          <CardContent>
            {calculation.labCostItems.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Sin costos de laboratorio
              </p>
            ) : (
              <div className="space-y-2">
                {calculation.labCostItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center text-sm"
                  >
                    <div>
                      <p className="font-medium">{item.description}</p>
                      <p className="text-muted-foreground text-xs">
                        {item.patientName} - {item.labName}
                      </p>
                    </div>
                    <span className="font-mono text-red-600">
                      -{formatMoney(item.amount)}
                    </span>
                  </div>
                ))}
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Total Laboratorio</span>
                  <span className="text-red-600">
                    -{formatMoney(calculation.labCosts)}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Resumen de Liquidacion */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
            <div>
              <p className="text-sm text-muted-foreground">Ingresos Brutos</p>
              <p className="text-xl font-bold text-green-600">
                {formatMoney(calculation.grossIncome)}
              </p>
            </div>
            <div className="flex items-center justify-center text-2xl text-muted-foreground">
              -
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Laboratorio</p>
              <p className="text-xl font-bold text-red-600">
                {formatMoney(calculation.labCosts)}
              </p>
            </div>
            <div className="flex items-center justify-center text-2xl text-muted-foreground">
              x {calculation.settlementPercentage}%
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Liquidacion</p>
              <p className="text-2xl font-bold text-primary">
                {formatMoney(calculation.settlementAmount)}
              </p>
            </div>
          </div>

          <Separator className="my-4" />

          <div className="flex justify-between items-center">
            <div>
              <p className="font-medium">{calculation.doctorName}</p>
              <p className="text-sm text-muted-foreground">
                Fecha: {calculation.settlementDate}
              </p>
            </div>
            <Button
              onClick={onSave}
              disabled={
                isSaving ||
                (calculation.grossIncome === 0 && calculation.labCosts === 0)
              }
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Guardar Liquidacion
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface SettlementsTableProps {
  settlements: DoctorSettlement[];
  formatMoney: (amount: number) => string;
  onView: (s: DoctorSettlement) => void;
  onPay: (s: DoctorSettlement) => void;
  onCancel: (s: DoctorSettlement) => void;
  showPayButton?: boolean;
}

function SettlementsTable({
  settlements,
  formatMoney,
  onView,
  onPay,
  onCancel,
  showPayButton,
}: SettlementsTableProps) {
  if (settlements.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p>No hay liquidaciones registradas</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Fecha</TableHead>
          <TableHead>Odontologo</TableHead>
          <TableHead className="text-right">Ingresos</TableHead>
          <TableHead className="text-right">Lab</TableHead>
          <TableHead className="text-right">%</TableHead>
          <TableHead className="text-right">Liquidacion</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead className="w-[120px]">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {settlements.map((settlement) => (
          <TableRow key={settlement.id}>
            <TableCell>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                {settlement.settlement_date}
              </div>
            </TableCell>
            <TableCell className="font-medium">
              {settlement.doctor?.full_name || "N/A"}
            </TableCell>
            <TableCell className="text-right font-mono text-green-600">
              {formatMoney(settlement.gross_income)}
            </TableCell>
            <TableCell className="text-right font-mono text-red-600">
              -{formatMoney(settlement.lab_costs)}
            </TableCell>
            <TableCell className="text-right font-mono">
              {settlement.settlement_percentage}%
            </TableCell>
            <TableCell className="text-right font-mono font-bold">
              {formatMoney(settlement.settlement_amount)}
            </TableCell>
            <TableCell>
              <Badge className={getStatusBadge(settlement.status).color}>
                {getStatusBadge(settlement.status).label}
              </Badge>
            </TableCell>
            <TableCell>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onView(settlement)}
                >
                  <FileText className="h-4 w-4" />
                </Button>
                {showPayButton && settlement.status === "pending" && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-green-600 hover:text-green-700"
                      onClick={() => onPay(settlement)}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => onCancel(settlement)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default SettlementsPanel;
