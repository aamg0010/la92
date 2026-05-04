import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Receipt, ExternalLink, FileText, CheckCircle2, Clock } from "lucide-react";

export function FacturacionES() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Facturacion Electronica</h1>
          <p className="text-muted-foreground">
            Sistema de facturacion conforme a Verifactu - Agencia Tributaria
          </p>
        </div>
        <Badge variant="secondary" className="text-sm px-3 py-1">
          <Clock className="w-4 h-4 mr-1" />
          Proximamente
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-primary" />
              Verifactu
            </CardTitle>
            <CardDescription>
              Sistema de verificacion de facturas de la AEAT
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Este modulo permitira la emision de facturas electronicas conforme
              al sistema <strong>Verifactu</strong> exigido por la Agencia Tributaria
              Espanola a partir de 2026.
            </p>

            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Funcionalidades previstas:</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Emision de facturas con QR Verifactu
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Envio automatico a la AEAT
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Facturas rectificativas
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Libro registro de facturas
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Exportacion para contabilidad
                </li>
              </ul>
            </div>

            <Button variant="outline" className="w-full" asChild>
              <a
                href="https://sede.agenciatributaria.gob.es/Sede/procedimientoini/GC50.shtml"
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Mas informacion sobre Verifactu
              </a>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Requisitos Legales
            </CardTitle>
            <CardDescription>
              Normativa aplicable en Espana
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3 text-sm">
              <div className="p-3 bg-muted rounded-lg">
                <p className="font-medium">Ley Antifraude (11/2021)</p>
                <p className="text-muted-foreground text-xs mt-1">
                  Obliga a usar software certificado que garantice la
                  integridad de los registros de facturacion.
                </p>
              </div>

              <div className="p-3 bg-muted rounded-lg">
                <p className="font-medium">Real Decreto 1007/2023</p>
                <p className="text-muted-foreground text-xs mt-1">
                  Establece los requisitos tecnicos del sistema Verifactu
                  y los plazos de implementacion.
                </p>
              </div>

              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
                <p className="font-medium text-amber-800 dark:text-amber-200">
                  Plazo de implementacion
                </p>
                <p className="text-amber-700 dark:text-amber-300 text-xs mt-1">
                  1 de julio de 2026 para contribuyentes con facturacion
                  superior a 6 millones de euros anuales.
                </p>
              </div>
            </div>

            <div className="pt-2">
              <p className="text-xs text-muted-foreground">
                Clinident esta trabajando en la certificacion del sistema
                para cumplir con todos los requisitos antes del plazo legal.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-dashed">
        <CardContent className="py-8 text-center">
          <Receipt className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="font-semibold mb-2">
            Modulo en desarrollo
          </h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Estamos trabajando para tener este modulo disponible antes de la
            fecha limite. Recibira una notificacion cuando este listo.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default FacturacionES;
