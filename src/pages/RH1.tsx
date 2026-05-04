/**
 * RH1.tsx
 * Pagina principal del modulo de Gestion de Residuos Biologicos
 * Cumplimiento normativo RH1 para clinicas dentales
 */

import { useState, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Download,
  Biohazard,
  FileText,
  Calendar,
  Loader2,
  Trash2,
  Recycle,
  AlertCircle,
} from "lucide-react";
import {
  useWasteStats,
  useUpcomingPickups,
  useWasteMonthlyReport,
  WASTE_TYPES,
  type WasteDisposal,
  type WasteType,
} from "@/hooks/useWasteManagement";
import {
  WasteStats,
  WasteHistoryTable,
  WasteDisposalForm,
} from "@/components/rh1";

const RH1 = () => {
  // Dialog state
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedDisposal, setSelectedDisposal] = useState<WasteDisposal | null>(null);

  // Report state
  const [reportYear, setReportYear] = useState(new Date().getFullYear());
  const [reportMonth, setReportMonth] = useState(new Date().getMonth() + 1);
  const [activeTab, setActiveTab] = useState("dashboard");

  // Fetch data
  const { data: stats, isLoading: loadingStats } = useWasteStats();
  const { data: upcomingPickups, isLoading: loadingPickups } = useUpcomingPickups(14);
  const { data: monthlyReport, isLoading: loadingReport } = useWasteMonthlyReport(
    reportYear,
    reportMonth
  );

  const handleEdit = (disposal: WasteDisposal) => {
    setSelectedDisposal(disposal);
    setCreateDialogOpen(true);
  };

  const handleCloseDialog = (open: boolean) => {
    setCreateDialogOpen(open);
    if (!open) {
      setSelectedDisposal(null);
    }
  };

  const handleExportReport = () => {
    if (!monthlyReport) return;

    // Create CSV content
    const lines = [
      // Header
      `Reporte de Residuos RH1 - ${monthlyReport.reportPeriod.month}/${monthlyReport.reportPeriod.year}`,
      "",
      "RESUMEN",
      `Total Disposiciones,${monthlyReport.summary.totalDisposals}`,
      `Peso Total (kg),${monthlyReport.summary.totalWeightKg}`,
      "",
      "POR TIPO DE RESIDUO",
      "Tipo,Cantidad,Peso Total (kg),Peso Promedio (kg)",
      ...monthlyReport.byType.map(
        (t) =>
          `${WASTE_TYPES[t.type].label},${t.disposalCount},${t.totalWeightKg},${t.avgWeightKg}`
      ),
      "",
      "DETALLE DE DISPOSICIONES",
      "Fecha,Tipo,Peso (kg),Responsable,Notas",
      ...monthlyReport.disposals.map(
        (d) =>
          `${d.date},${WASTE_TYPES[d.type as WasteType].label},${d.weightKg},"${d.responsible}","${d.notes || ""}"`
      ),
    ];

    const csv = lines.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `reporte_rh1_${reportYear}_${String(reportMonth).padStart(2, "0")}.csv`;
    link.click();
  };

  // Generate year options (last 3 years)
  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return [currentYear, currentYear - 1, currentYear - 2];
  }, []);

  // Generate month options
  const monthOptions = [
    { value: 1, label: "Enero" },
    { value: 2, label: "Febrero" },
    { value: 3, label: "Marzo" },
    { value: 4, label: "Abril" },
    { value: 5, label: "Mayo" },
    { value: 6, label: "Junio" },
    { value: 7, label: "Julio" },
    { value: 8, label: "Agosto" },
    { value: 9, label: "Septiembre" },
    { value: 10, label: "Octubre" },
    { value: 11, label: "Noviembre" },
    { value: 12, label: "Diciembre" },
  ];

  return (
    <MainLayout>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl lg:text-4xl font-display font-bold text-foreground flex items-center gap-3">
              <Biohazard className="w-8 h-8 text-red-600" />
              Gestion de Residuos RH1
            </h1>
            <p className="text-muted-foreground mt-1">
              Control y seguimiento de residuos biologicos para cumplimiento normativo
            </p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Registrar Disposicion
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full max-w-lg grid-cols-3">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <Biohazard className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Historial</span>
            </TabsTrigger>
            <TabsTrigger value="report" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">Reporte</span>
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-4">
            <WasteStats
              stats={stats}
              upcomingPickups={upcomingPickups}
              isLoading={loadingStats || loadingPickups}
            />

            {/* Info cards about waste types */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(Object.keys(WASTE_TYPES) as WasteType[]).map((type) => {
                const config = WASTE_TYPES[type];
                const Icon = type === "red" ? Biohazard : type === "black" ? Trash2 : Recycle;

                return (
                  <Card key={type} className={config.bgColor}>
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-lg ${config.color} bg-white/50 dark:bg-black/20`}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold">{config.label}</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {config.description}
                          </p>
                          {config.maxWeight && (
                            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              Peso maximo por bolsa: {config.maxWeight} kg
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history">
            <WasteHistoryTable onEdit={handleEdit} />
          </TabsContent>

          {/* Report Tab */}
          <TabsContent value="report" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <CardTitle className="font-display">Reporte Mensual RH1</CardTitle>
                  <div className="flex items-center gap-2">
                    <Select
                      value={String(reportMonth)}
                      onValueChange={(v) => setReportMonth(Number(v))}
                    >
                      <SelectTrigger className="w-36">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {monthOptions.map((m) => (
                          <SelectItem key={m.value} value={String(m.value)}>
                            {m.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select
                      value={String(reportYear)}
                      onValueChange={(v) => setReportYear(Number(v))}
                    >
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {yearOptions.map((y) => (
                          <SelectItem key={y} value={String(y)}>
                            {y}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Button
                      variant="outline"
                      onClick={handleExportReport}
                      disabled={!monthlyReport || loadingReport}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Exportar CSV
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loadingReport ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : monthlyReport ? (
                  <div className="space-y-6">
                    {/* Summary */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="p-4 bg-muted/50 rounded-lg text-center">
                        <p className="text-sm text-muted-foreground">Total Disposiciones</p>
                        <p className="text-3xl font-display font-bold mt-1">
                          {monthlyReport.summary.totalDisposals}
                        </p>
                      </div>
                      <div className="p-4 bg-muted/50 rounded-lg text-center">
                        <p className="text-sm text-muted-foreground">Peso Total</p>
                        <p className="text-3xl font-display font-bold mt-1">
                          {monthlyReport.summary.totalWeightKg.toFixed(1)} kg
                        </p>
                      </div>
                      <div className="p-4 bg-muted/50 rounded-lg text-center">
                        <p className="text-sm text-muted-foreground">Promedio por Disposicion</p>
                        <p className="text-3xl font-display font-bold mt-1">
                          {monthlyReport.summary.totalDisposals > 0
                            ? (
                                monthlyReport.summary.totalWeightKg /
                                monthlyReport.summary.totalDisposals
                              ).toFixed(1)
                            : "0"}{" "}
                          kg
                        </p>
                      </div>
                    </div>

                    {/* By Type */}
                    <div>
                      <h4 className="font-semibold mb-3">Por Tipo de Residuo</h4>
                      <div className="space-y-3">
                        {monthlyReport.byType.length > 0 ? (
                          monthlyReport.byType.map((item) => {
                            const config = WASTE_TYPES[item.type];
                            const percentage =
                              monthlyReport.summary.totalWeightKg > 0
                                ? (item.totalWeightKg / monthlyReport.summary.totalWeightKg) * 100
                                : 0;

                            return (
                              <div key={item.type} className="space-y-1">
                                <div className="flex items-center justify-between text-sm">
                                  <span className="font-medium">{config.label}</span>
                                  <span className="text-muted-foreground">
                                    {item.totalWeightKg.toFixed(1)} kg ({item.disposalCount} disp.)
                                  </span>
                                </div>
                                <div className="h-2 bg-muted rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all ${
                                      item.type === "red"
                                        ? "bg-red-500"
                                        : item.type === "black"
                                        ? "bg-slate-600"
                                        : "bg-emerald-500"
                                    }`}
                                    style={{ width: `${percentage}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            No hay datos para este periodo
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Compliance note */}
                    <div className="p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <h4 className="font-medium text-blue-900 dark:text-blue-100">
                        Nota de Cumplimiento
                      </h4>
                      <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                        Este reporte cumple con los requisitos de documentacion RH1 para
                        establecimientos de salud. Conserve una copia impresa firmada para
                        inspecciones sanitarias.
                      </p>
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                        Generado: {new Date(monthlyReport.generatedAt).toLocaleString("es-ES")}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FileText className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">No hay datos para este periodo</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Create/Edit Dialog */}
      <WasteDisposalForm
        open={createDialogOpen}
        onOpenChange={handleCloseDialog}
        disposal={selectedDisposal}
      />
    </MainLayout>
  );
};

export default RH1;
