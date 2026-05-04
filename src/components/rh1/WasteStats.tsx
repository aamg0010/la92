/**
 * WasteStats.tsx
 * Cards de estadisticas de residuos (Dashboard RH1)
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Biohazard,
  Trash2,
  Recycle,
  Scale,
  AlertTriangle,
  Calendar,
  Clock,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type WasteStats as WasteStatsType,
  type UpcomingPickup,
  WASTE_TYPES,
  DAY_NAMES,
  formatPickupDate,
} from "@/hooks/useWasteManagement";

interface WasteStatsProps {
  stats: WasteStatsType | undefined;
  upcomingPickups: UpcomingPickup[] | undefined;
  isLoading?: boolean;
}

const WASTE_ICONS = {
  red: Biohazard,
  black: Trash2,
  white: Recycle,
};

export function WasteStats({ stats, upcomingPickups, isLoading }: WasteStatsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="pt-6">
              <div className="h-4 bg-muted rounded w-24 mb-3" />
              <div className="h-8 bg-muted rounded w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Get today's and tomorrow's pickups
  const todayPickups = upcomingPickups?.filter((p) => {
    const pickupDate = new Date(p.nextPickupDate);
    const today = new Date();
    return pickupDate.toDateString() === today.toDateString();
  });

  const tomorrowPickups = upcomingPickups?.filter((p) => {
    const pickupDate = new Date(p.nextPickupDate);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return pickupDate.toDateString() === tomorrow.toDateString();
  });

  return (
    <div className="space-y-4">
      {/* Alert if red waste is approaching limit */}
      {stats?.alertRedWeight && (
        <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-red-900 dark:text-red-100">
              Alerta de peso biosanitarios
            </h4>
            <p className="text-sm text-red-700 dark:text-red-300 mt-1">
              El peso acumulado de residuos biosanitarios (rojos) este mes supera los 20 kg.
              Considere programar una recogida anticipada.
            </p>
          </div>
        </div>
      )}

      {/* Today's/Tomorrow's pickups alert */}
      {(todayPickups?.length || tomorrowPickups?.length) ? (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg flex items-start gap-3">
          <Clock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-amber-900 dark:text-amber-100">
              Proximas recogidas
            </h4>
            <div className="text-sm text-amber-700 dark:text-amber-300 mt-1 space-y-1">
              {todayPickups?.map((p) => (
                <p key={p.id}>
                  <strong>Hoy:</strong> {WASTE_TYPES[p.wasteType].label}
                  {p.collectorCompany && ` - ${p.collectorCompany}`}
                </p>
              ))}
              {tomorrowPickups?.map((p) => (
                <p key={p.id}>
                  <strong>Manana:</strong> {WASTE_TYPES[p.wasteType].label}
                  {p.collectorCompany && ` - ${p.collectorCompany}`}
                </p>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total weight this month */}
        <Card className="stat-card">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Total Mes</p>
                <p className="mt-2 text-3xl font-display font-bold text-foreground">
                  {stats?.totalWeightKg?.toFixed(1) || "0"} kg
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {stats?.totalDisposals || 0} registros
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-primary/10 text-primary">
                <Scale className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Red - Biohazard */}
        <Card className={cn("stat-card border-l-4 border-l-red-500")}>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-500" />
                  Biosanitarios
                </p>
                <p className="mt-2 text-3xl font-display font-bold text-foreground">
                  {stats?.redWeightKg?.toFixed(1) || "0"} kg
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {stats?.byType?.red?.count || 0} disposiciones
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-red-100 dark:bg-red-950/50 text-red-600">
                <Biohazard className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Black - Ordinary */}
        <Card className={cn("stat-card border-l-4 border-l-slate-500")}>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-slate-700" />
                  Ordinarios
                </p>
                <p className="mt-2 text-3xl font-display font-bold text-foreground">
                  {stats?.blackWeightKg?.toFixed(1) || "0"} kg
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {stats?.byType?.black?.count || 0} disposiciones
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-slate-100 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300">
                <Trash2 className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* White - Recyclable */}
        <Card className={cn("stat-card border-l-4 border-l-emerald-500")}>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-500" />
                  Reciclables
                </p>
                <p className="mt-2 text-3xl font-display font-bold text-foreground">
                  {stats?.whiteWeightKg?.toFixed(1) || "0"} kg
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {stats?.byType?.white?.count || 0} disposiciones
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600">
                <Recycle className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming pickups calendar */}
      {upcomingPickups && upcomingPickups.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Proximas Recogidas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingPickups.slice(0, 5).map((pickup) => {
                const Icon = WASTE_ICONS[pickup.wasteType];
                const config = WASTE_TYPES[pickup.wasteType];

                return (
                  <div
                    key={pickup.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center",
                          config.bgColor,
                          config.color
                        )}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-medium">{config.label}</p>
                        <p className="text-sm text-muted-foreground">
                          {pickup.collectorCompany || "Sin empresa asignada"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge
                        variant={
                          formatPickupDate(pickup.nextPickupDate) === "Hoy"
                            ? "destructive"
                            : formatPickupDate(pickup.nextPickupDate) === "Manana"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {formatPickupDate(pickup.nextPickupDate)}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {DAY_NAMES[pickup.dayOfWeek]}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
