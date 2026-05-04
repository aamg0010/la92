/**
 * SendBudgetDialog.tsx
 * Envio del presupuesto por Email o WhatsApp.
 *
 * IMPORTANTE: No existe un endpoint de email configurado en el backend
 * actualmente (ver apiClient.ts / api/ folder). Mientras no exista, el envio
 * por email muestra un toast informativo. El envio por WhatsApp usa el deep
 * link `wa.me` + descarga del PDF para adjuntar manualmente.
 */

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Send,
  Mail,
  MessageCircle,
  Download,
  Info,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useClinicSettings } from "@/hooks/useSettings";
import { useCurrency } from "@/hooks/useCurrency";
import {
  type BudgetWithItems,
  useUpdateBudgetStatus,
} from "@/hooks/useBudgets";
import { generateBudgetPDF } from "./BudgetPDF";

interface SendBudgetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  budget: BudgetWithItems;
}

/**
 * Normaliza un telefono para wa.me: solo digitos, sin espacios ni simbolos.
 * Si empieza con 0 lo quita. Si no trae prefijo pais, no anade ninguno
 * (depende del pais de la clinica; mejor dejar al usuario incluirlo).
 */
function normalizePhoneForWhatsApp(phone: string): string {
  return phone.replace(/[^\d]/g, "").replace(/^0+/, "");
}

export function SendBudgetDialog({
  open,
  onOpenChange,
  budget,
}: SendBudgetDialogProps) {
  const { toast } = useToast();
  const { data: clinic } = useClinicSettings();
  const { formatMoney, currency } = useCurrency();
  const updateStatus = useUpdateBudgetStatus();

  const patientFullName = budget.patient
    ? `${budget.patient.first_name} ${budget.patient.last_name}`
    : "";

  // Email state
  const [emailTo, setEmailTo] = useState(budget.patient?.email ?? "");
  const [emailSubject, setEmailSubject] = useState(
    `Presupuesto de tratamiento - ${clinic?.clinic_name ?? "Clinica Dental"}`,
  );
  const [emailBody, setEmailBody] = useState(
    `Hola ${patientFullName},\n\nAdjunto el presupuesto ${budget.budget_number} por un total de ${formatMoney(Number(budget.total))}.\n\nQuedamos a tu disposicion para cualquier consulta.\n\nUn saludo,\n${clinic?.clinic_name ?? "Clinica Dental"}`,
  );

  // WhatsApp state
  const [whatsappPhone, setWhatsappPhone] = useState(budget.patient?.phone ?? "");
  const [whatsappMessage, setWhatsappMessage] = useState(
    `Hola ${patientFullName}, te envio el presupuesto ${budget.budget_number} por un total de ${formatMoney(Number(budget.total))}. Adjunto el PDF en este chat. Quedo a tu disposicion para cualquier duda. Saludos, ${clinic?.clinic_name ?? "Clinica Dental"}.`,
  );

  // Mantener defaults sincronizados si cambia el budget o la clinica.
  useEffect(() => {
    if (open) {
      setEmailTo(budget.patient?.email ?? "");
      setEmailSubject(
        `Presupuesto de tratamiento - ${clinic?.clinic_name ?? "Clinica Dental"}`,
      );
      setEmailBody(
        `Hola ${patientFullName},\n\nAdjunto el presupuesto ${budget.budget_number} por un total de ${formatMoney(Number(budget.total))}.\n\nQuedamos a tu disposicion para cualquier consulta.\n\nUn saludo,\n${clinic?.clinic_name ?? "Clinica Dental"}`,
      );
      setWhatsappPhone(budget.patient?.phone ?? "");
      setWhatsappMessage(
        `Hola ${patientFullName}, te envio el presupuesto ${budget.budget_number} por un total de ${formatMoney(Number(budget.total))}. Adjunto el PDF en este chat. Quedo a tu disposicion para cualquier duda. Saludos, ${clinic?.clinic_name ?? "Clinica Dental"}.`,
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, budget.id, clinic?.clinic_name]);

  const downloadPdf = () => {
    const pdf = generateBudgetPDF(budget, clinic, { currency });
    pdf.save(`${budget.budget_number}.pdf`);
  };

  const markAsSentIfDraft = async () => {
    if (budget.status === "draft") {
      try {
        await updateStatus.mutateAsync({ id: budget.id, status: "sent" });
      } catch {
        // toast gestionado en hook
      }
    }
  };

  const handleSendEmail = async () => {
    if (!emailTo.trim()) {
      toast({
        title: "Email requerido",
        description: "Introduce la direccion de email del destinatario.",
        variant: "destructive",
      });
      return;
    }

    // TODO: cuando exista un endpoint de email en el backend (p.ej.
    // POST /rpc/send_email con { to, subject, body, attachments[] }),
    // se puede usar api.rpc('send_email', { ... }) adjuntando el PDF
    // como base64 generado con generateBudgetPDF(budget, clinic).output('datauristring').
    toast({
      title: "Envio por email no disponible",
      description:
        "El envio por email requiere configuracion del backend. Descarga el PDF y envialo desde tu cliente de correo o usa WhatsApp.",
    });
    await markAsSentIfDraft();
  };

  const handleSendWhatsApp = () => {
    const normalized = normalizePhoneForWhatsApp(whatsappPhone);
    if (!normalized) {
      toast({
        title: "Telefono requerido",
        description: "Introduce un numero de telefono valido (con prefijo de pais).",
        variant: "destructive",
      });
      return;
    }
    const url = `https://wa.me/${normalized}?text=${encodeURIComponent(whatsappMessage)}`;
    window.open(url, "_blank", "noopener,noreferrer");
    void markAsSentIfDraft();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="w-5 h-5 text-primary" />
            Enviar presupuesto {budget.budget_number}
          </DialogTitle>
          <DialogDescription>
            Envia el presupuesto por email o WhatsApp al paciente.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="email">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="email" className="gap-2">
              <Mail className="w-4 h-4" />
              Email
            </TabsTrigger>
            <TabsTrigger value="whatsapp" className="gap-2">
              <MessageCircle className="w-4 h-4" />
              WhatsApp
            </TabsTrigger>
          </TabsList>

          {/* EMAIL */}
          <TabsContent value="email" className="space-y-4 mt-4">
            <div className="rounded-lg bg-warning/10 border border-warning/20 p-3 flex gap-2 text-sm">
              <Info className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
              <p className="text-muted-foreground">
                El envio por email requiere configuracion del backend (SMTP / proveedor
                de correo). Mientras tanto, usa WhatsApp o descarga el PDF y envialo
                desde tu cliente de correo.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="emailTo">Para</Label>
              <Input
                id="emailTo"
                type="email"
                value={emailTo}
                onChange={(e) => setEmailTo(e.target.value)}
                placeholder="paciente@ejemplo.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="emailSubject">Asunto</Label>
              <Input
                id="emailSubject"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="emailBody">Mensaje</Label>
              <Textarea
                id="emailBody"
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                rows={8}
              />
            </div>

            <div className="flex justify-between gap-2">
              <Button variant="outline" onClick={downloadPdf}>
                <Download className="w-4 h-4 mr-2" />
                Descargar PDF
              </Button>
              <Button onClick={handleSendEmail} disabled={updateStatus.isPending}>
                {updateStatus.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                Enviar email
              </Button>
            </div>
          </TabsContent>

          {/* WHATSAPP */}
          <TabsContent value="whatsapp" className="space-y-4 mt-4">
            <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 flex gap-2 text-sm">
              <Info className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <div className="text-muted-foreground">
                <p className="mb-1">
                  Flujo de envio manual: 1) Descarga el PDF, 2) Abre WhatsApp con el
                  mensaje pre-rellenado, 3) Adjunta el PDF descargado en el chat.
                </p>
                <p className="text-xs">
                  Incluye el prefijo internacional en el telefono (ej. +34, +57).
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="waPhone">Telefono</Label>
              <Input
                id="waPhone"
                type="tel"
                value={whatsappPhone}
                onChange={(e) => setWhatsappPhone(e.target.value)}
                placeholder="+34 600 000 000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="waMessage">Mensaje</Label>
              <Textarea
                id="waMessage"
                value={whatsappMessage}
                onChange={(e) => setWhatsappMessage(e.target.value)}
                rows={6}
              />
            </div>

            <div className="flex justify-between gap-2">
              <Button variant="outline" onClick={downloadPdf}>
                <Download className="w-4 h-4 mr-2" />
                Descargar PDF
              </Button>
              <Button onClick={handleSendWhatsApp} className="bg-[#25D366] hover:bg-[#20ba5a] text-white">
                <MessageCircle className="w-4 h-4 mr-2" />
                Abrir WhatsApp
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default SendBudgetDialog;
