/**
 * SendSignatureLinkDialog
 *
 * Crea un token UUID en el servidor para que el paciente firme desde su movil.
 * Permite seleccionar las plantillas a firmar y muestra:
 *  - Codigo QR (escaneable con el movil del paciente, generado via api.qrserver.com)
 *  - URL de firma para copiar
 *  - Botones rapidos: WhatsApp, SMS, Email
 *
 * Diseno deliberado: el QR se carga desde un servicio externo gratuito para
 * evitar agregar dependencias npm (qrcode.react, qrcode). Si en futuro se
 * quiere generar localmente, basta con sustituir el <img> por <QRCode value=.../>
 * y agregar la libreria.
 */
import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useCreateSignatureToken, type PatientConsentTemplate } from "@/hooks/usePatientConsents";
import { useToast } from "@/hooks/use-toast";
import {
  Copy,
  Loader2,
  MessageCircle,
  Mail,
  Smartphone,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";

const DOCUMENT_LABELS: Record<string, string> = {
  rgpd_patient: "RGPD",
  clinical_general: "Clinico",
  clinical_treatment: "Tratamiento",
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId: string;
  patientName?: string;
  patientPhone?: string | null;
  patientEmail?: string | null;
  treatmentId?: string;
  availableTemplates: PatientConsentTemplate[];
}

export function SendSignatureLinkDialog({
  open,
  onOpenChange,
  patientId,
  patientName,
  patientPhone,
  patientEmail,
  treatmentId,
  availableTemplates,
}: Props) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set(availableTemplates.map((t) => t.id))
  );
  const [expiresHours, setExpiresHours] = useState(48);
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [copyOk, setCopyOk] = useState(false);

  const createMutation = useCreateSignatureToken();
  const { toast } = useToast();

  const signatureUrl = useMemo(() => {
    if (!generatedToken) return null;
    if (typeof window === "undefined") return null;
    return `${window.location.origin}/firma/${generatedToken}`;
  }, [generatedToken]);

  const qrUrl = useMemo(() => {
    if (!signatureUrl) return null;
    return `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=8&data=${encodeURIComponent(signatureUrl)}`;
  }, [signatureUrl]);

  const messageText = useMemo(() => {
    const name = patientName ? `Hola ${patientName}` : "Hola";
    return `${name}, le compartimos el enlace para firmar sus consentimientos clinicos: ${signatureUrl}`;
  }, [patientName, signatureUrl]);

  const toggleTemplate = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleGenerate = async () => {
    if (selectedIds.size === 0) {
      toast({
        title: "Selecciona al menos una plantilla",
        variant: "destructive",
      });
      return;
    }
    try {
      const result = await createMutation.mutateAsync({
        patientId,
        templateIds: Array.from(selectedIds),
        treatmentId,
        expiresHours,
      });
      if (result.token) {
        setGeneratedToken(result.token);
      }
    } catch {
      // toast handled
    }
  };

  const handleCopyUrl = async () => {
    if (!signatureUrl) return;
    try {
      await navigator.clipboard.writeText(signatureUrl);
      setCopyOk(true);
      setTimeout(() => setCopyOk(false), 1500);
    } catch {
      toast({
        title: "No se pudo copiar al portapapeles",
        variant: "destructive",
      });
    }
  };

  const sanitizePhone = (raw: string | null | undefined) =>
    raw ? raw.replace(/[^\d+]/g, "") : "";

  const whatsappHref = useMemo(() => {
    if (!signatureUrl) return null;
    const phone = sanitizePhone(patientPhone);
    return `https://wa.me/${phone.replace(/^\+/, "")}?text=${encodeURIComponent(messageText)}`;
  }, [signatureUrl, patientPhone, messageText]);

  const smsHref = useMemo(() => {
    if (!signatureUrl) return null;
    const phone = sanitizePhone(patientPhone);
    return `sms:${phone}?body=${encodeURIComponent(messageText)}`;
  }, [signatureUrl, patientPhone, messageText]);

  const mailHref = useMemo(() => {
    if (!signatureUrl) return null;
    const subject = "Firma de consentimientos";
    const body = `${messageText}\n\nEl enlace caduca en ${expiresHours} horas.`;
    const to = patientEmail ?? "";
    return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }, [signatureUrl, patientEmail, messageText, expiresHours]);

  const handleClose = () => {
    setGeneratedToken(null);
    setCopyOk(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="w-5 h-5" />
            Firma desde el movil del paciente
          </DialogTitle>
          <DialogDescription>
            Genera un enlace de firma temporal y compartelo con el paciente.
          </DialogDescription>
        </DialogHeader>

        {!generatedToken ? (
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Plantillas a firmar</Label>
              <div className="space-y-1 mt-2 max-h-[200px] overflow-y-auto">
                {availableTemplates.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">
                    No hay plantillas pendientes para este paciente.
                  </p>
                ) : (
                  availableTemplates.map((tpl) => (
                    <label
                      key={tpl.id}
                      className="flex items-start gap-2 p-2 rounded hover:bg-muted/40 cursor-pointer"
                    >
                      <Checkbox
                        checked={selectedIds.has(tpl.id)}
                        onCheckedChange={() => toggleTemplate(tpl.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium">{tpl.title}</span>
                          <Badge variant="outline" className="text-xs">
                            {DOCUMENT_LABELS[tpl.document_type] || tpl.document_type}
                          </Badge>
                          <Badge variant="outline" className="text-xs">v{tpl.version}</Badge>
                        </div>
                        {tpl.treatment_type && (
                          <p className="text-xs text-muted-foreground">
                            {tpl.treatment_type}
                          </p>
                        )}
                      </div>
                    </label>
                  ))
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="expiresHours">Validez del enlace (horas)</Label>
              <Input
                id="expiresHours"
                type="number"
                min={1}
                max={720}
                value={expiresHours}
                onChange={(e) => setExpiresHours(Math.max(1, Math.min(720, Number(e.target.value) || 48)))}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Por defecto 48 horas. Maximo 30 dias.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-col items-center gap-3">
              {qrUrl && (
                <div className="border rounded-lg p-2 bg-white">
                  <img
                    src={qrUrl}
                    alt="QR"
                    width={240}
                    height={240}
                    className="block"
                  />
                </div>
              )}
              <p className="text-xs text-muted-foreground text-center">
                El paciente puede escanear este QR con su movil para abrir el enlace.
              </p>
            </div>

            <div>
              <Label className="text-sm">Enlace</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  readOnly
                  value={signatureUrl ?? ""}
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
                <Button variant="outline" size="icon" onClick={handleCopyUrl} title="Copiar enlace">
                  {copyOk ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {whatsappHref && (
                <Button asChild variant="outline" className="w-full">
                  <a href={whatsappHref} target="_blank" rel="noreferrer">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    WhatsApp
                  </a>
                </Button>
              )}
              {smsHref && (
                <Button asChild variant="outline" className="w-full">
                  <a href={smsHref}>
                    <Smartphone className="w-4 h-4 mr-2" />
                    SMS
                  </a>
                </Button>
              )}
              {mailHref && (
                <Button asChild variant="outline" className="w-full">
                  <a href={mailHref}>
                    <Mail className="w-4 h-4 mr-2" />
                    Email
                  </a>
                </Button>
              )}
            </div>

            {signatureUrl && (
              <Button asChild variant="ghost" size="sm" className="w-full">
                <a href={signatureUrl} target="_blank" rel="noreferrer">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Abrir enlace en nueva pestana
                </a>
              </Button>
            )}

            <p className="text-xs text-muted-foreground text-center">
              El enlace caduca en {expiresHours} {expiresHours === 1 ? "hora" : "horas"}.
              Una vez utilizado, no podra abrirse de nuevo.
            </p>
          </div>
        )}

        <DialogFooter>
          {!generatedToken ? (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={selectedIds.size === 0 || createMutation.isPending}
              >
                {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Generar enlace
              </Button>
            </>
          ) : (
            <Button onClick={handleClose}>Cerrar</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
