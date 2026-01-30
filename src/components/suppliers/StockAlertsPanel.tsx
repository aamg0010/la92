import { AlertTriangle, XCircle, Clock, Check, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  usePendingStockAlerts,
  useAcknowledgeStockAlert,
  useResolveStockAlert,
  ALERT_STATUS,
  ALERT_TYPES,
} from "@/hooks/useSuppliers";

export function StockAlertsPanel() {
  const { data: alerts = [], isLoading } = usePendingStockAlerts();
  const acknowledgeMutation = useAcknowledgeStockAlert();
  const resolveMutation = useResolveStockAlert();

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "out_of_stock":
        return <XCircle className="h-5 w-5 text-destructive" />;
      case "expiring_soon":
        return <Clock className="h-5 w-5 text-primary" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-destructive" />;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Alertas de Stock
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Cargando alertas...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Alertas de Stock
          {alerts.length > 0 && (
            <Badge variant="destructive">{alerts.length}</Badge>
          )}
        </CardTitle>
        <CardDescription>
          Materiales que requieren atención inmediata
        </CardDescription>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
            <Check className="h-12 w-12 mx-auto mb-2 text-primary" />
            <p>No hay alertas pendientes</p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="flex items-center justify-between p-4 rounded-lg border bg-card"
              >
                <div className="flex items-center gap-4">
                  {getAlertIcon(alert.alert_type)}
                  <div>
                    <p className="font-medium">
                      {alert.inventory_item?.name || "Item desconocido"}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>
                        Stock actual: {alert.current_quantity}{" "}
                        {alert.inventory_item?.unit}
                      </span>
                      <span>•</span>
                      <span>Mínimo: {alert.min_stock}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    className={
                      ALERT_STATUS[alert.status as keyof typeof ALERT_STATUS]
                        ?.color
                    }
                  >
                    {ALERT_TYPES[alert.alert_type as keyof typeof ALERT_TYPES]
                      ?.label || alert.alert_type}
                  </Badge>
                  {alert.status === "pending" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => acknowledgeMutation.mutate(alert.id)}
                      disabled={acknowledgeMutation.isPending}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Atender
                    </Button>
                  )}
                  {alert.status === "acknowledged" && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() =>
                        resolveMutation.mutate({ id: alert.id })
                      }
                      disabled={resolveMutation.isPending}
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Resolver
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
