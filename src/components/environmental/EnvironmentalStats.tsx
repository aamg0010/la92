/**
 * EnvironmentalStats.tsx
 * Dashboard de estadisticas ambientales con lecturas del dia
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Thermometer,
  Droplets,
  Sun,
  Moon,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  TrendingUp,
  Gauge,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type TodayReadings,
  type EnvironmentalStats as StatsType,
  NORMAL_RANGES,
  formatTime,
  calculateCompletionPercentage,
} from "@/hooks/useEnvironmentalMonitoring";

interface EnvironmentalStatsProps {
  todayData: TodayReadings | null | undefined;
  stats: StatsType | null | undefined;
  isLoading: boolean;
}

export function EnvironmentalStats({ todayData, stats, isLoading }: EnvironmentalStatsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const amReading = todayData?.amReading;
  const pmReading = todayData?.pmReading;
  const hasAmReading = !!amReading;
  const hasPmReading = !!pmReading;
  const todayComplete = hasAmReading && hasPmReading;

  // Calculate monthly completion percentage
  const completionPercentage = stats
    ? calculateCompletionPercentage(
        stats.daysWithReadings,
        stats.totalDaysInMonth,
        undefined
      )
    : 0;

  // Check for any alerts
  const hasAlerts =
    (amReading && (!amReading.isTemperatureNormal || !amReading.isHumidityNormal)) ||
    (pmReading && (!pmReading.isTemperatureNormal || !pmReading.isHumidityNormal));

  return (
    <div className="space-y-4">
      {/* Today's Readings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* AM Reading Card */}
        <Card className={cn(hasAmReading && !amReading?.isTemperatureNormal && "border-amber-300")}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Sun className="w-4 h-4 text-amber-500" />
                Lectura Manana (AM)
              </span>
              {hasAmReading ? (
                <Badge
                  variant={
                    amReading?.isTemperatureNormal && amReading?.isHumidityNormal
                      ? "default"
                      : "destructive"
                  }
                  className="text-xs"
                >
                  {amReading?.isTemperatureNormal && amReading?.isHumidityNormal
                    ? "Normal"
                    : "Alerta"}
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs">
                  Pendiente
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {hasAmReading ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Thermometer
                      className={cn(
                        "w-5 h-5",
                        amReading?.isTemperatureNormal ? "text-green-500" : "text-red-500"
                      )}
                    />
                    <div>
                      <p className="text-2xl font-display font-bold">
                        {amReading?.temperature}
                        <span className="text-sm font-normal text-muted-foreground"> C</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Droplets
                      className={cn(
                        "w-5 h-5",
                        amReading?.isHumidityNormal ? "text-blue-500" : "text-red-500"
                      )}
                    />
                    <div>
                      <p className="text-2xl font-display font-bold">
                        {amReading?.humidity}
                        <span className="text-sm font-normal text-muted-foreground">%</span>
                      </p>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Registrado a las {formatTime(amReading?.time || "")} por {amReading?.userName}
                </p>
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                <Sun className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Sin lectura de la manana</p>
                <p className="text-xs">06:00 - 12:00</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* PM Reading Card */}
        <Card className={cn(hasPmReading && !pmReading?.isTemperatureNormal && "border-amber-300")}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Moon className="w-4 h-4 text-indigo-500" />
                Lectura Tarde (PM)
              </span>
              {hasPmReading ? (
                <Badge
                  variant={
                    pmReading?.isTemperatureNormal && pmReading?.isHumidityNormal
                      ? "default"
                      : "destructive"
                  }
                  className="text-xs"
                >
                  {pmReading?.isTemperatureNormal && pmReading?.isHumidityNormal
                    ? "Normal"
                    : "Alerta"}
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs">
                  Pendiente
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {hasPmReading ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Thermometer
                      className={cn(
                        "w-5 h-5",
                        pmReading?.isTemperatureNormal ? "text-green-500" : "text-red-500"
                      )}
                    />
                    <div>
                      <p className="text-2xl font-display font-bold">
                        {pmReading?.temperature}
                        <span className="text-sm font-normal text-muted-foreground"> C</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Droplets
                      className={cn(
                        "w-5 h-5",
                        pmReading?.isHumidityNormal ? "text-blue-500" : "text-red-500"
                      )}
                    />
                    <div>
                      <p className="text-2xl font-display font-bold">
                        {pmReading?.humidity}
                        <span className="text-sm font-normal text-muted-foreground">%</span>
                      </p>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Registrado a las {formatTime(pmReading?.time || "")} por {pmReading?.userName}
                </p>
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                <Moon className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Sin lectura de la tarde</p>
                <p className="text-xs">12:00 - 20:00</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today Status */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              Estado Hoy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {todayComplete ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <span className="text-lg font-semibold text-green-600">Completo</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  <span className="text-lg font-semibold text-amber-600">
                    {hasAmReading || hasPmReading ? "Parcial" : "Pendiente"}
                  </span>
                </>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {hasAmReading && hasPmReading
                ? "2/2 lecturas registradas"
                : hasAmReading || hasPmReading
                ? "1/2 lecturas registradas"
                : "0/2 lecturas registradas"}
            </p>
          </CardContent>
        </Card>

        {/* Monthly Average Temperature */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Thermometer className="w-4 h-4 text-orange-500" />
              Promedio Temp. Mes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-display font-bold">
              {stats?.avgTemperature ?? "-"}
              <span className="text-sm font-normal text-muted-foreground"> C</span>
            </p>
            <p className="text-xs text-muted-foreground">
              Min: {stats?.minTemperature ?? "-"} C / Max: {stats?.maxTemperature ?? "-"} C
            </p>
          </CardContent>
        </Card>

        {/* Monthly Average Humidity */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Droplets className="w-4 h-4 text-blue-500" />
              Promedio Hum. Mes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-display font-bold">
              {stats?.avgHumidity ?? "-"}
              <span className="text-sm font-normal text-muted-foreground">%</span>
            </p>
            <p className="text-xs text-muted-foreground">
              Min: {stats?.minHumidity ?? "-"}% / Max: {stats?.maxHumidity ?? "-"}%
            </p>
          </CardContent>
        </Card>

        {/* Monthly Compliance */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Gauge className="w-4 h-4 text-green-500" />
              Cumplimiento Mes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-2xl font-display font-bold">{completionPercentage}%</p>
                <span className="text-xs text-muted-foreground">
                  {stats?.daysWithReadings ?? 0}/{stats?.totalDaysInMonth ?? 0} dias
                </span>
              </div>
              <Progress value={completionPercentage} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts Section */}
      {stats && stats.outOfRangeCount > 0 && (
        <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/10">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-amber-800 dark:text-amber-200">
                  {stats.outOfRangeCount} lecturas fuera de rango este mes
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  Temperatura: {stats.temperatureOutOfRange} alertas | Humedad:{" "}
                  {stats.humidityOutOfRange} alertas
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Normal Ranges Reference */}
      <Card className="bg-muted/30">
        <CardContent className="pt-4">
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Thermometer className="w-4 h-4 text-orange-500" />
              <span className="text-muted-foreground">Temperatura normal:</span>
              <span className="font-medium">
                {NORMAL_RANGES.temperature.min}-{NORMAL_RANGES.temperature.max} C
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Droplets className="w-4 h-4 text-blue-500" />
              <span className="text-muted-foreground">Humedad normal:</span>
              <span className="font-medium">
                {NORMAL_RANGES.humidity.min}-{NORMAL_RANGES.humidity.max}%
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
