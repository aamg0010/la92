/**
 * EnvironmentalChart.tsx
 * Grafico de tendencia semanal de temperatura y humedad
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
} from "recharts";
import { TrendingUp, AlertTriangle } from "lucide-react";
import { type WeeklyTrendDay, NORMAL_RANGES } from "@/hooks/useEnvironmentalMonitoring";

interface EnvironmentalChartProps {
  data: WeeklyTrendDay[] | undefined;
  isLoading: boolean;
  days?: number;
}

// Custom tooltip component
function CustomTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number | null;
    color: string;
    dataKey: string;
  }>;
  label?: string;
}) {
  if (!active || !payload) return null;

  const dataPoint = payload[0]?.payload as WeeklyTrendDay | undefined;

  return (
    <div className="bg-popover border border-border rounded-lg shadow-lg p-3 min-w-[200px]">
      <p className="font-medium text-sm mb-2">
        {dataPoint?.dayName} - {label}
      </p>
      {dataPoint?.readingCount === 0 ? (
        <p className="text-muted-foreground text-sm">Sin lecturas</p>
      ) : (
        <>
          <div className="space-y-1.5">
            {payload.map((entry, index) => {
              if (entry.value === null) return null;
              const isTemp = entry.dataKey === "avgTemperature";
              const isNormal = isTemp
                ? entry.value >= NORMAL_RANGES.temperature.min &&
                  entry.value <= NORMAL_RANGES.temperature.max
                : entry.value >= NORMAL_RANGES.humidity.min &&
                  entry.value <= NORMAL_RANGES.humidity.max;

              return (
                <div key={index} className="flex items-center justify-between gap-4">
                  <span className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: entry.color }}
                    />
                    <span className="text-sm">{entry.name}:</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="font-medium">
                      {entry.value}
                      {isTemp ? " C" : "%"}
                    </span>
                    {!isNormal && <AlertTriangle className="w-3 h-3 text-amber-500" />}
                  </span>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {dataPoint?.readingCount} lectura(s)
          </p>
          {dataPoint?.hasAlerts && (
            <Badge variant="destructive" className="mt-2 text-xs">
              Valores fuera de rango
            </Badge>
          )}
        </>
      )}
    </div>
  );
}

export function EnvironmentalChart({ data, isLoading, days = 7 }: EnvironmentalChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  // Format data for chart
  const chartData = (data || []).map((day) => ({
    ...day,
    date: new Date(day.date).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit" }),
  }));

  // Check if there's any data with readings
  const hasAnyData = chartData.some((d) => d.readingCount > 0);
  const daysWithAlerts = chartData.filter((d) => d.hasAlerts).length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="font-display flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Tendencia Ultimos {days} Dias
          </CardTitle>
          {daysWithAlerts > 0 && (
            <Badge variant="outline" className="text-amber-600 border-amber-300">
              <AlertTriangle className="w-3 h-3 mr-1" />
              {daysWithAlerts} dia(s) con alertas
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {!hasAnyData ? (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No hay datos para mostrar</p>
              <p className="text-sm">Registra lecturas para ver la tendencia</p>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />

              {/* Reference areas for normal ranges */}
              <ReferenceArea
                y1={NORMAL_RANGES.temperature.min}
                y2={NORMAL_RANGES.temperature.max}
                fill="#22c55e"
                fillOpacity={0.1}
                yAxisId="temp"
              />

              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />

              {/* Temperature Y-Axis (left) */}
              <YAxis
                yAxisId="temp"
                orientation="left"
                domain={[10, 35]}
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${v} C`}
              />

              {/* Humidity Y-Axis (right) */}
              <YAxis
                yAxisId="humidity"
                orientation="right"
                domain={[20, 80]}
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${v}%`}
              />

              <Tooltip content={<CustomTooltip />} />

              <Legend
                verticalAlign="top"
                height={36}
                formatter={(value) => (
                  <span className="text-sm text-foreground">{value}</span>
                )}
              />

              {/* Reference lines for normal ranges */}
              <ReferenceLine
                y={NORMAL_RANGES.temperature.min}
                yAxisId="temp"
                stroke="#f97316"
                strokeDasharray="5 5"
                strokeOpacity={0.5}
              />
              <ReferenceLine
                y={NORMAL_RANGES.temperature.max}
                yAxisId="temp"
                stroke="#f97316"
                strokeDasharray="5 5"
                strokeOpacity={0.5}
              />

              {/* Temperature line */}
              <Line
                yAxisId="temp"
                type="monotone"
                dataKey="avgTemperature"
                name="Temperatura"
                stroke="#f97316"
                strokeWidth={2}
                dot={(props) => {
                  const { cx, cy, payload } = props;
                  if (payload.avgTemperature === null) return null;
                  const isNormal =
                    payload.avgTemperature >= NORMAL_RANGES.temperature.min &&
                    payload.avgTemperature <= NORMAL_RANGES.temperature.max;
                  return (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={4}
                      fill={isNormal ? "#22c55e" : "#ef4444"}
                      stroke="white"
                      strokeWidth={2}
                    />
                  );
                }}
                connectNulls={false}
              />

              {/* Humidity line */}
              <Line
                yAxisId="humidity"
                type="monotone"
                dataKey="avgHumidity"
                name="Humedad"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={(props) => {
                  const { cx, cy, payload } = props;
                  if (payload.avgHumidity === null) return null;
                  const isNormal =
                    payload.avgHumidity >= NORMAL_RANGES.humidity.min &&
                    payload.avgHumidity <= NORMAL_RANGES.humidity.max;
                  return (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={4}
                      fill={isNormal ? "#22c55e" : "#ef4444"}
                      stroke="white"
                      strokeWidth={2}
                    />
                  );
                }}
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}

        {/* Legend for normal ranges */}
        <div className="flex flex-wrap items-center justify-center gap-4 mt-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-green-500" />
            <span>Valor normal</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-red-500" />
            <span>Fuera de rango</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-6 h-0.5 bg-orange-500 opacity-50" style={{ backgroundImage: "repeating-linear-gradient(90deg, #f97316, #f97316 5px, transparent 5px, transparent 10px)" }} />
            <span>Limites temperatura ({NORMAL_RANGES.temperature.min}-{NORMAL_RANGES.temperature.max} C)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
