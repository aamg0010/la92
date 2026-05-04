/**
 * ControlAmbiental.tsx
 * Pagina principal del modulo de Control Ambiental
 * Monitoreo de temperatura y humedad para cumplimiento normativo
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
  Thermometer,
  FileText,
  Calendar,
  Loader2,
  BarChart3,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import {
  useTodayReadings,
  useEnvironmentalStats,
  useWeeklyTrend,
  useEnvironmentalMonthlyReport,
  type EnvironmentalReading,
  MONTH_NAMES,
  NORMAL_RANGES,
} from "@/hooks/useEnvironmentalMonitoring";
import {
  EnvironmentalStats,
  EnvironmentalChart,
  ReadingsHistoryTable,
  ReadingForm,
} from "@/components/environmental";

const ControlAmbiental = () => {
  // Dialog state
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedReading, setSelectedReading] = useState<EnvironmentalReading | null>(null);

  // Report state
  const [reportYear, setReportYear] = useState(new Date().getFullYear());
  const [reportMonth, setReportMonth] = useState(new Date().getMonth() + 1);
  const [activeTab, setActiveTab] = useState("dashboard");

  // Fetch data
  const { data: todayData, isLoading: loadingToday } = useTodayReadings();
  const { data: stats, isLoading: loadingStats } = useEnvironmentalStats();
  const { data: weeklyTrend, isLoading: loadingTrend } = useWeeklyTrend(7);
  const { data: monthlyReport, isLoading: loadingReport } = useEnvironmentalMonthlyReport(
    reportYear,
    reportMonth
  );

  const handleEdit = (reading: EnvironmentalReading) => {
    setSelectedReading(reading);
    setCreateDialogOpen(true);
  };

  const handleCloseDialog = (open: boolean) => {
    setCreateDialogOpen(open);
    if (!open) {
      setSelectedReading(null);
    }
  };

  const handleExportCSV = () => {
    if (!monthlyReport) return;

    // Create CSV content
    const lines = [
      // Header
      `Reporte de Control Ambiental - ${MONTH_NAMES[monthlyReport.reportPeriod.month - 1]} ${monthlyReport.reportPeriod.year}`,
      "",
      "RESUMEN",
      `Total Lecturas,${monthlyReport.summary.totalReadings}`,
      `Dias con Lecturas,${monthlyReport.summary.daysWithReadings}`,
      `Dias Completos (AM+PM),${monthlyReport.summary.completeDays}`,
      `Promedio Temperatura,${monthlyReport.summary.avgTemperature} C`,
      `Promedio Humedad,${monthlyReport.summary.avgHumidity}%`,
      `Lecturas Fuera de Rango,${monthlyReport.summary.outOfRangeReadings}`,
      "",
      "PROMEDIOS SEMANALES",
      "Semana,Temperatura Promedio (C),Humedad Promedio (%),Lecturas",
      ...monthlyReport.weeklyAverages.map(
        (w) => `${w.weekNumber},${w.avgTemperature},${w.avgHumidity},${w.readings}`
      ),
      "",
      "LECTURAS FUERA DE RANGO",
      "Fecha,Hora,Turno,Temperatura (C),Humedad (%),Responsable,Notas",
      ...monthlyReport.outOfRangeDetails.map(
        (r) =>
          `${r.date},${r.time},${r.shift},${r.temperature},${r.humidity},"${r.userName}","${r.notes || ""}"`
      ),
      "",
      "DETALLE COMPLETO DE LECTURAS",
      "Fecha,Hora,Turno,Temperatura (C),Humedad (%),Temp Normal,Humedad Normal,Responsable,Notas",
      ...monthlyReport.allReadings.map(
        (r) =>
          `${r.date},${r.time},${r.shift},${r.temperature},${r.humidity},${r.isTemperatureNormal ? "Si" : "No"},${r.isHumidityNormal ? "Si" : "No"},"${r.userName}","${r.notes || ""}"`
      ),
      "",
      `Reporte generado: ${new Date(monthlyReport.generatedAt).toLocaleString("es-ES")}`,
      `Rango normal temperatura: ${NORMAL_RANGES.temperature.min}-${NORMAL_RANGES.temperature.max} C`,
      `Rango normal humedad: ${NORMAL_RANGES.humidity.min}-${NORMAL_RANGES.humidity.max}%`,
    ];

    const csv = lines.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `control_ambiental_${reportYear}_${String(reportMonth).padStart(2, "0")}.csv`;
    link.click();
  };

  // Generate year options (last 3 years)
  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return [currentYear, currentYear - 1, currentYear - 2];
  }, []);

  // Generate month options
  const monthOptions = MONTH_NAMES.map((name, index) => ({
    value: index + 1,
    label: name,
  }));

  return (
    <MainLayout>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl lg:text-4xl font-display font-bold text-foreground flex items-center gap-3">
              <Thermometer className="w-8 h-8 text-orange-500" />
              Control Ambiental
            </h1>
            <p className="text-muted-foreground mt-1">
              Monitoreo de temperatura y humedad para cumplimiento normativo
            </p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Registrar Lectura
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full max-w-lg grid-cols-3">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
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
          <TabsContent value="dashboard" className="space-y-6">
            {/* Stats Cards */}
            <EnvironmentalStats
              todayData={todayData}
              stats={stats}
              isLoading={loadingToday || loadingStats}
            />

            {/* Weekly Trend Chart */}
            <EnvironmentalChart data={weeklyTrend} isLoading={loadingTrend} days={7} />
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history">
            <ReadingsHistoryTable onEdit={handleEdit} />
          </TabsContent>

          {/* Report Tab */}
          <TabsContent value="report" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <CardTitle className="font-display">Reporte Mensual de Control Ambiental</CardTitle>
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
                      onClick={handleExportCSV}
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
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="p-4 bg-muted/50 rounded-lg text-center">
                        <p className="text-sm text-muted-foreground">Total Lecturas</p>
                        <p className="text-3xl font-display font-bold mt-1">
                          {monthlyReport.summary.totalReadings}
                        </p>
                      </div>
                      <div className="p-4 bg-muted/50 rounded-lg text-center">
                        <p className="text-sm text-muted-foreground">Dias Completos</p>
                        <p className="text-3xl font-display font-bold mt-1">
                          {monthlyReport.summary.completeDays}
                          <span className="text-sm font-normal text-muted-foreground">
                            /{monthlyReport.summary.totalDaysInMonth}
                          </span>
                        </p>
                      </div>
                      <div className="p-4 bg-muted/50 rounded-lg text-center">
                        <p className="text-sm text-muted-foreground">Promedio Temperatura</p>
                        <p className="text-3xl font-display font-bold mt-1">
                          {monthlyReport.summary.avgTemperature || "-"}
                          <span className="text-sm font-normal text-muted-foreground"> C</span>
                        </p>
                      </div>
                      <div className="p-4 bg-muted/50 rounded-lg text-center">
                        <p className="text-sm text-muted-foreground">Promedio Humedad</p>
                        <p className="text-3xl font-display font-bold mt-1">
                          {monthlyReport.summary.avgHumidity || "-"}
                          <span className="text-sm font-normal text-muted-foreground">%</span>
                        </p>
                      </div>
                    </div>

                    {/* Weekly Averages */}
                    {monthlyReport.weeklyAverages.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-3">Promedios Semanales</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                          {monthlyReport.weeklyAverages.map((week) => (
                            <div
                              key={week.weekNumber}
                              className="p-3 border rounded-lg bg-background"
                            >
                              <p className="text-sm font-medium text-muted-foreground">
                                Semana {week.weekNumber}
                              </p>
                              <div className="flex items-center justify-between mt-2">
                                <div className="flex items-center gap-1">
                                  <Thermometer className="w-4 h-4 text-orange-500" />
                                  <span>{week.avgTemperature} C</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className="text-blue-500">{week.avgHumidity}%</span>
                                </div>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                {week.readings} lecturas
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Out of Range Alerts */}
                    {monthlyReport.outOfRangeDetails.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-500" />
                          Lecturas Fuera de Rango ({monthlyReport.outOfRangeDetails.length})
                        </h4>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {monthlyReport.outOfRangeDetails.map((reading) => (
                            <div
                              key={reading.id}
                              className="p-3 border border-amber-200 bg-amber-50 dark:bg-amber-950/20 rounded-lg"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  <span className="font-medium">
                                    {new Date(reading.date).toLocaleDateString("es-ES", {
                                      day: "2-digit",
                                      month: "short",
                                    })}{" "}
                                    {reading.shift}
                                  </span>
                                  <span
                                    className={
                                      reading.tempOutOfRange ? "text-red-600 font-medium" : ""
                                    }
                                  >
                                    {reading.temperature} C
                                  </span>
                                  <span
                                    className={
                                      reading.humidityOutOfRange ? "text-red-600 font-medium" : ""
                                    }
                                  >
                                    {reading.humidity}%
                                  </span>
                                </div>
                                <span className="text-sm text-muted-foreground">
                                  {reading.userName}
                                </span>
                              </div>
                              {reading.notes && (
                                <p className="text-sm text-muted-foreground mt-1">{reading.notes}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Compliance Note */}
                    <div
                      className={`p-4 rounded-lg border ${
                        monthlyReport.summary.outOfRangeReadings === 0
                          ? "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800"
                          : "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {monthlyReport.summary.outOfRangeReadings === 0 ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        ) : (
                          <AlertTriangle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        )}
                        <div>
                          <h4 className="font-medium text-foreground">
                            {monthlyReport.summary.outOfRangeReadings === 0
                              ? "Cumplimiento Total"
                              : "Nota de Cumplimiento"}
                          </h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            {monthlyReport.summary.outOfRangeReadings === 0
                              ? "Todas las lecturas del mes estan dentro de los rangos normales."
                              : `Se detectaron ${monthlyReport.summary.outOfRangeReadings} lecturas fuera de los rangos normales. Revise las condiciones ambientales del consultorio.`}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            Rangos normales: Temperatura {NORMAL_RANGES.temperature.min}-
                            {NORMAL_RANGES.temperature.max} C | Humedad {NORMAL_RANGES.humidity.min}-
                            {NORMAL_RANGES.humidity.max}%
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Generado: {new Date(monthlyReport.generatedAt).toLocaleString("es-ES")}
                          </p>
                        </div>
                      </div>
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
      <ReadingForm
        open={createDialogOpen}
        onOpenChange={handleCloseDialog}
        reading={selectedReading}
      />
    </MainLayout>
  );
};

export default ControlAmbiental;
