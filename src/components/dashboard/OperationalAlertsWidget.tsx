import { BellRing, Clock3, Package2, TriangleAlert } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useInventoryStats, useLowStockItems } from "@/hooks/useInventory";
import { useRecentClinicalRecommendations } from "@/hooks/useClinicalHistory";

export function OperationalAlertsWidget() {
  const { data: lowStockItems = [] } = useLowStockItems();
  const { data: inventoryStats } = useInventoryStats();
  const { data: recommendations = [] } = useRecentClinicalRecommendations(5);

  const expiringCount = inventoryStats?.expiringCount ?? 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BellRing className="h-5 w-5 text-primary" />
          Alertas Operativas
        </CardTitle>
        <CardDescription>
          Resumen visible de inventario y recomendaciones clinicas recientes.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-3">
          <AlertStat
            icon={<Package2 className="h-4 w-4" />}
            label="Stock bajo"
            value={lowStockItems.length}
            tone={lowStockItems.length > 0 ? "warning" : "default"}
          />
          <AlertStat
            icon={<Clock3 className="h-4 w-4" />}
            label="Por vencer"
            value={expiringCount}
            tone={expiringCount > 0 ? "warning" : "default"}
          />
          <AlertStat
            icon={<TriangleAlert className="h-4 w-4" />}
            label="Recomendaciones"
            value={recommendations.length}
            tone={recommendations.length > 0 ? "warning" : "default"}
          />
        </div>

        {lowStockItems.length > 0 ? (
          <section className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-sm font-medium">Items con stock bajo</h4>
              <Badge variant="outline">{lowStockItems.length}</Badge>
            </div>
            <div className="space-y-2">
              {lowStockItems.slice(0, 5).map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                  <div>
                    <p className="font-medium text-foreground">{item.name}</p>
                    <p className="text-muted-foreground">
                      Stock actual: {item.quantity} {item.unit} | Minimo: {item.min_stock}
                    </p>
                  </div>
                  <Badge variant="destructive">Revisar</Badge>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {recommendations.length > 0 ? (
          <section className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-sm font-medium">Recomendaciones clinicas recientes</h4>
              <Badge variant="outline">{recommendations.length}</Badge>
            </div>
            <div className="space-y-2">
              {recommendations.map((entry) => (
                <div key={entry.id} className="rounded-lg border p-3 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-foreground">{entry.diagnosis}</p>
                    <span className="text-xs text-muted-foreground">
                      {new Date(entry.created_at).toLocaleDateString("es-ES")}
                    </span>
                  </div>
                  {entry.notes ? (
                    <p className="mt-1 line-clamp-3 text-muted-foreground">{entry.notes}</p>
                  ) : null}
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {lowStockItems.length === 0 && recommendations.length === 0 && expiringCount === 0 ? (
          <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            No hay alertas operativas relevantes en este momento.
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function AlertStat({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone: "default" | "warning";
}) {
  const toneClass = tone === "warning"
    ? "border-amber-300/60 bg-amber-50 text-amber-950"
    : "border-border bg-muted/30 text-foreground";

  return (
    <div className={`rounded-lg border p-3 ${toneClass}`}>
      <div className="flex items-center gap-2 text-sm font-medium">
        {icon}
        <span>{label}</span>
      </div>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}
