/**
 * NewPatientConsentsPrompt
 *
 * Dialog que se muestra justo despues de crear un paciente nuevo.
 * Ofrece dos caminos:
 *  - Recoger firmas ahora en la clinica (PatientConsentsPanel embebido)
 *  - Enviar enlace al movil del paciente (SendSignatureLinkDialog)
 *
 * Es opcional (puede saltarse) para no bloquear el flujo de alta cuando
 * la clinica solo quiere registrar al paciente y resolver consentimientos
 * mas tarde.
 */
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  CheckCircle2,
  Smartphone,
  FileSignature,
  ArrowRight,
} from "lucide-react";
import { PatientConsentsPanel } from "@/components/legal/PatientConsentsPanel";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId: string;
  patientName?: string;
  patientPhone?: string | null;
  patientEmail?: string | null;
}

export function NewPatientConsentsPrompt({
  open,
  onOpenChange,
  patientId,
  patientName,
  patientPhone,
  patientEmail,
}: Props) {
  const [mode, setMode] = useState<"choose" | "in_clinic">("choose");

  const handleClose = () => {
    setMode("choose");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            Paciente creado correctamente
          </DialogTitle>
          <DialogDescription>
            Ahora puedes recoger los consentimientos del paciente (RGPD y consentimiento clinico).
            Es recomendable hacerlo antes del primer tratamiento.
          </DialogDescription>
        </DialogHeader>

        {mode === "choose" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-4">
            <Card
              className="cursor-pointer hover:border-primary transition-colors"
              onClick={() => setMode("in_clinic")}
            >
              <CardContent className="pt-6 text-center space-y-2">
                <FileSignature className="w-10 h-10 mx-auto text-primary" />
                <h3 className="font-semibold">Firmar aqui mismo</h3>
                <p className="text-xs text-muted-foreground">
                  Recoge la firma del paciente en este equipo (tablet, ordenador o pantalla
                  tactil).
                </p>
                <Button variant="outline" size="sm" className="mt-2">
                  Empezar
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer hover:border-primary transition-colors"
              onClick={() => setMode("in_clinic")}
            >
              <CardContent className="pt-6 text-center space-y-2">
                <Smartphone className="w-10 h-10 mx-auto text-primary" />
                <h3 className="font-semibold">Enviar al movil</h3>
                <p className="text-xs text-muted-foreground">
                  Genera un enlace para que el paciente firme desde su telefono
                  (WhatsApp, SMS, email o QR).
                </p>
                <Button variant="outline" size="sm" className="mt-2">
                  Empezar
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          <PatientConsentsPanel
            patientId={patientId}
            patientName={patientName}
            patientPhone={patientPhone}
            patientEmail={patientEmail}
          />
        )}

        <DialogFooter>
          {mode === "in_clinic" && (
            <Button variant="ghost" onClick={() => setMode("choose")}>
              Volver
            </Button>
          )}
          <Button variant="outline" onClick={handleClose}>
            {mode === "choose" ? "Hacerlo mas tarde" : "Cerrar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
