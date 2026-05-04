import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, RotateCcw, TimerReset } from "lucide-react";
import { formatOdontogramDuration, useOdontogramSession } from "@/hooks/useOdontogramSession";
import { useCreateOdontogramEvent } from "@/hooks/useClinicalHistory";

const UPPER_TEETH = ["18", "17", "16", "15", "14", "13", "12", "11", "21", "22", "23", "24", "25", "26", "27", "28"];
const LOWER_TEETH = ["48", "47", "46", "45", "44", "43", "42", "41", "31", "32", "33", "34", "35", "36", "37", "38"];

interface OdontogramPanelProps {
  patientId: string;
  patientName: string;
  selectedTooth?: string;
  onSelectTooth?: (tooth: string) => void;
}

export function OdontogramPanel({ patientId, patientName, selectedTooth, onSelectTooth }: OdontogramPanelProps) {
  const {
    selectedTooth: internalTooth,
    setSelectedTooth,
    isSessionRunning,
    activeElapsedMs,
    stats,
    startSession,
    stopSession,
    clearHistory,
  } = useOdontogramSession();
  const logEvent = useCreateOdontogramEvent();

  const activeTooth = selectedTooth ?? internalTooth;

  const handleSelectTooth = async (tooth: string) => {
    setSelectedTooth(tooth);
    onSelectTooth?.(tooth);
    await logEvent.mutateAsync({
      patient_id: patientId,
      operation: "SELECCION_PIEZA",
      tooth_number: tooth,
      notes: `Se selecciono la pieza ${tooth} en el odontograma React para ${patientName}.`,
      extra: { source: "odontogram-react" },
    });
  };

  const handleStartSession = async () => {
    await startSession();
    await logEvent.mutateAsync({
      patient_id: patientId,
      operation: "INICIO_CITA_ODONTOGRAMA",
      tooth_number: activeTooth || null,
      notes: `Se inicio una sesion de odontograma React para ${patientName}${activeTooth ? ` sobre pieza ${activeTooth}` : ""}.`,
      extra: { source: "odontogram-react" },
    });
  };

  const handleStopSession = async () => {
    await stopSession();
    await logEvent.mutateAsync({
      patient_id: patientId,
      operation: "FIN_CITA_ODONTOGRAMA",
      tooth_number: activeTooth || null,
      notes: `Se finalizo una sesion de odontograma React para ${patientName}${activeTooth ? ` sobre pieza ${activeTooth}` : ""}.`,
      extra: { source: "odontogram-react", elapsed_ms: activeElapsedMs },
    });
  };

  const handleClearHistory = async () => {
    await clearHistory();
    await logEvent.mutateAsync({
      patient_id: patientId,
      operation: "LIMPIEZA_HISTORIAL_LOCAL_ODONTOGRAMA",
      tooth_number: activeTooth || null,
      notes: `Se limpio el historial local del odontograma React para ${patientName}.`,
      extra: { source: "odontogram-react" },
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Odontograma Digital
            </CardTitle>
            <CardDescription>
              Haz clic en una pieza dental para seleccionarla y registrar tratamientos, observaciones o procedimientos.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{activeTooth ? `Pieza ${activeTooth}` : "Sin pieza"}</Badge>
            <Badge variant="outline">{stats.sessions} sesiones</Badge>
            <Badge variant="outline">{formatOdontogramDuration(stats.totalMs)}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <ToothRow title="Arcada superior" teeth={UPPER_TEETH} selectedTooth={activeTooth} onSelectTooth={handleSelectTooth} />
        <ToothRow title="Arcada inferior" teeth={LOWER_TEETH} selectedTooth={activeTooth} onSelectTooth={handleSelectTooth} />

        <div className="grid gap-3 md:grid-cols-4">
          <StatCard label="Sesion actual" value={isSessionRunning ? formatOdontogramDuration(activeElapsedMs) : "00:00:00"} />
          <StatCard label="Promedio" value={formatOdontogramDuration(stats.averageMs)} />
          <StatCard label="Mas trabajada" value={stats.topTooth || "-"} />
          <StatCard label="Tiempo pieza top" value={formatOdontogramDuration(stats.topToothMs)} />
        </div>

        <div className="flex flex-wrap gap-3">
          <Button onClick={() => void handleStartSession()} disabled={!activeTooth || isSessionRunning || logEvent.isPending}>
            <Activity className="mr-2 h-4 w-4" />
            Iniciar sesion
          </Button>
          <Button variant="outline" onClick={() => void handleStopSession()} disabled={!isSessionRunning || logEvent.isPending}>
            <TimerReset className="mr-2 h-4 w-4" />
            Finalizar sesion
          </Button>
          <Button variant="ghost" onClick={() => void handleClearHistory()} disabled={logEvent.isPending}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Limpiar historial local
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ToothRow({
  title,
  teeth,
  selectedTooth,
  onSelectTooth,
}: {
  title: string;
  teeth: string[];
  selectedTooth: string;
  onSelectTooth: (tooth: string) => Promise<void>;
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-8 lg:grid-cols-16">
        {teeth.map((tooth) => {
          const isActive = selectedTooth === tooth;
          return (
            <button
              key={tooth}
              type="button"
              onClick={() => void onSelectTooth(tooth)}
              className={[
                "rounded-lg border px-2 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background hover:border-primary/40 hover:bg-muted",
              ].join(" ")}
            >
              {tooth}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-muted/30 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold text-foreground">{value}</p>
    </div>
  );
}
