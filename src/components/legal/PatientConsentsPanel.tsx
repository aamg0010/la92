/**
 * PatientConsentsPanel
 *
 * Panel que muestra el estado de los consentimientos del paciente:
 *  - Plantillas pendientes (RGPD paciente, clinico general, por tratamiento)
 *  - Historial de firmados / revocados
 *
 * Acciones por plantilla pendiente:
 *  - "Firmar ahora" -> abre dialog con SignaturePad (in-clinic)
 *  - "Enviar al movil" -> abre SendSignatureLinkDialog (token + QR/links)
 *
 * Acciones por consentimiento firmado:
 *  - Ver detalle
 *  - Revocar (con motivo)
 */
import { useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SignaturePad } from "@/components/legal/SignaturePad";
import { SendSignatureLinkDialog } from "@/components/legal/SendSignatureLinkDialog";
import {
  usePendingPatientConsents,
  usePatientConsentsHistory,
  usePatientConsentDetail,
  useRecordPatientConsent,
  useRevokePatientConsent,
  type PatientConsentTemplate,
  type PatientConsentRecord,
} from "@/hooks/usePatientConsents";
import { useLegalDocument } from "@/hooks/useLegalAcceptance";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import {
  CheckCircle2,
  Clock,
  FileSignature,
  Loader2,
  Shield,
  Smartphone,
  XCircle,
  Eye,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";
import ReactMarkdown from "react-markdown";

const DOCUMENT_LABELS: Record<string, string> = {
  rgpd_patient: "RGPD",
  clinical_general: "Consentimiento clinico",
  clinical_treatment: "Consent. tratamiento",
};

interface PatientConsentsPanelProps {
  patientId: string;
  patientName?: string;
  patientPhone?: string | null;
  patientEmail?: string | null;
  treatmentId?: string;
  treatmentType?: string;
}

export function PatientConsentsPanel({
  patientId,
  patientName,
  patientPhone,
  patientEmail,
  treatmentId,
  treatmentType,
}: PatientConsentsPanelProps) {
  const { data: pending, isLoading: loadingPending } = usePendingPatientConsents(patientId, {
    treatmentId,
    treatmentType,
  });
  const { data: history, isLoading: loadingHistory } = usePatientConsentsHistory(patientId);

  const [signTemplate, setSignTemplate] = useState<PatientConsentTemplate | null>(null);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [selectedDetailId, setSelectedDetailId] = useState<string | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<PatientConsentRecord | null>(null);

  const isLoading = loadingPending || loadingHistory;

  const activeHistory = useMemo(() => history?.filter((h) => h.status === "active") ?? [], [history]);
  const revokedHistory = useMemo(() => history?.filter((h) => h.status !== "active") ?? [], [history]);

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between flex-wrap gap-2">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Consentimientos del paciente
              </CardTitle>
              <CardDescription>
                RGPD, consentimiento clinico general y consentimientos especificos por tratamiento.
              </CardDescription>
            </div>
            {pending && pending.length > 0 && (
              <Button
                variant="default"
                size="sm"
                onClick={() => setSendDialogOpen(true)}
              >
                <Smartphone className="w-4 h-4 mr-2" />
                Enviar al movil
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {/* Pendientes */}
              <section>
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-600" />
                  Pendientes de firmar
                  {pending && pending.length > 0 && (
                    <Badge variant="secondary">{pending.length}</Badge>
                  )}
                </h4>
                {pending && pending.length > 0 ? (
                  <div className="space-y-2">
                    {pending.map((tpl) => (
                      <div
                        key={tpl.id}
                        className="flex items-center justify-between p-3 border rounded-lg bg-amber-50/30 dark:bg-amber-950/10"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium truncate">{tpl.title}</span>
                            <Badge variant="outline" className="text-xs">
                              {DOCUMENT_LABELS[tpl.document_type] || tpl.document_type}
                            </Badge>
                            {tpl.is_clinic_specific && (
                              <Badge variant="outline" className="text-xs">propia</Badge>
                            )}
                            <Badge variant="outline" className="text-xs">v{tpl.version}</Badge>
                          </div>
                          {tpl.treatment_type && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Tratamiento: {tpl.treatment_type}
                            </p>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSignTemplate(tpl)}
                        >
                          <FileSignature className="w-4 h-4 mr-2" />
                          Firmar ahora
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    No hay consentimientos pendientes.
                  </p>
                )}
              </section>

              {/* Firmados activos */}
              <section>
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  Firmados activos
                  {activeHistory.length > 0 && (
                    <Badge variant="secondary">{activeHistory.length}</Badge>
                  )}
                </h4>
                {activeHistory.length > 0 ? (
                  <div className="space-y-2">
                    {activeHistory.map((c) => (
                      <ConsentRow
                        key={c.id}
                        consent={c}
                        onView={() => setSelectedDetailId(c.id)}
                        onRevoke={() => setRevokeTarget(c)}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    Aun no se han firmado consentimientos.
                  </p>
                )}
              </section>

              {/* Revocados */}
              {revokedHistory.length > 0 && (
                <section>
                  <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-red-600" />
                    Revocados / sustituidos
                    <Badge variant="secondary">{revokedHistory.length}</Badge>
                  </h4>
                  <div className="space-y-2">
                    {revokedHistory.map((c) => (
                      <ConsentRow
                        key={c.id}
                        consent={c}
                        onView={() => setSelectedDetailId(c.id)}
                      />
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Dialog: firmar in-clinic */}
      {signTemplate && (
        <SignConsentDialog
          patientId={patientId}
          template={signTemplate}
          treatmentId={treatmentId}
          onClose={() => setSignTemplate(null)}
        />
      )}

      {/* Dialog: enviar enlace de firma al movil */}
      {sendDialogOpen && (
        <SendSignatureLinkDialog
          open={sendDialogOpen}
          onOpenChange={setSendDialogOpen}
          patientId={patientId}
          patientName={patientName}
          patientPhone={patientPhone}
          patientEmail={patientEmail}
          treatmentId={treatmentId}
          availableTemplates={pending ?? []}
        />
      )}

      {/* Dialog: detalle */}
      <ConsentDetailDialog
        consentId={selectedDetailId}
        onClose={() => setSelectedDetailId(null)}
      />

      {/* Dialog: revocar */}
      {revokeTarget && (
        <RevokeConsentDialog
          consent={revokeTarget}
          patientId={patientId}
          onClose={() => setRevokeTarget(null)}
        />
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Subcomponentes
// ---------------------------------------------------------------------------

function ConsentRow({
  consent,
  onView,
  onRevoke,
}: {
  consent: PatientConsentRecord;
  onView: () => void;
  onRevoke?: () => void;
}) {
  const isRemote = consent.collection_method !== "in_clinic";
  return (
    <div className="flex items-center justify-between p-3 border rounded-lg gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium truncate">{consent.template_title}</span>
          <Badge variant="outline" className="text-xs">
            {DOCUMENT_LABELS[consent.template_document_type] || consent.template_document_type}
          </Badge>
          <Badge variant="outline" className="text-xs">v{consent.template_version}</Badge>
          {isRemote && (
            <Badge variant="outline" className="text-xs flex items-center gap-1">
              <Smartphone className="w-3 h-3" />
              Remoto
            </Badge>
          )}
          {consent.signer_role !== "patient" && (
            <Badge variant="outline" className="text-xs">
              {consent.signer_role === "guardian" ? "Tutor legal" : "Representante"}
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Firmado por {consent.signer_full_name}
          {consent.signer_document ? ` (${consent.signer_document})` : ""}
          {" - "}
          {format(parseISO(consent.signed_at), "dd MMM yyyy HH:mm", { locale: es })}
        </p>
        {consent.status === "revoked" && consent.revocation_reason && (
          <p className="text-xs text-red-600 mt-1">
            Revocado: {consent.revocation_reason}
            {consent.revoked_at &&
              ` (${format(parseISO(consent.revoked_at), "dd MMM yyyy", { locale: es })})`}
          </p>
        )}
      </div>
      <div className="flex gap-1 flex-shrink-0">
        <Button size="sm" variant="ghost" onClick={onView} title="Ver detalle">
          <Eye className="w-4 h-4" />
        </Button>
        {onRevoke && consent.status === "active" && (
          <Button
            size="sm"
            variant="ghost"
            onClick={onRevoke}
            className="text-red-600 hover:text-red-700"
            title="Revocar"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

function SignConsentDialog({
  patientId,
  template,
  treatmentId,
  onClose,
}: {
  patientId: string;
  template: PatientConsentTemplate;
  treatmentId?: string;
  onClose: () => void;
}) {
  const { data: tplFull, isLoading: loadingDoc } = useLegalDocument(template.id);
  const recordMutation = useRecordPatientConsent();

  const [signerName, setSignerName] = useState("");
  const [signerDocument, setSignerDocument] = useState("");
  const [signerRole, setSignerRole] = useState<"patient" | "guardian" | "representative">("patient");
  const [signerRelationship, setSignerRelationship] = useState("");
  const [signature, setSignature] = useState<string | null>(null);
  const [hasReadDoc, setHasReadDoc] = useState(false);

  const canSubmit = signerName.trim().length >= 3 && !!signature && hasReadDoc;

  const handleSubmit = async () => {
    if (!canSubmit || !signature) return;
    try {
      await recordMutation.mutateAsync({
        patientId,
        templateId: template.id,
        signatureData: signature,
        signerFullName: signerName,
        signerDocument: signerDocument || undefined,
        signerRole,
        signerRelationship: signerRole !== "patient" ? signerRelationship || undefined : undefined,
        treatmentId,
        deviceType: "desktop",
        collectionMethod: "in_clinic",
      });
      onClose();
    } catch {
      // toast handled
    }
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{template.title}</DialogTitle>
          <DialogDescription>
            {DOCUMENT_LABELS[template.document_type] || template.document_type} - version {template.version}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 flex flex-col gap-4">
          {loadingDoc ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : (
            <ScrollArea
              className="flex-1 border rounded-lg p-4 bg-muted/20"
              onScrollCapture={(e) => {
                const el = e.currentTarget.querySelector("[data-radix-scroll-area-viewport]") as HTMLElement | null;
                if (!el) return;
                if (el.scrollHeight - el.scrollTop <= el.clientHeight + 40) {
                  setHasReadDoc(true);
                }
              }}
            >
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown>{tplFull?.content || ""}</ReactMarkdown>
              </div>
            </ScrollArea>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="signerRole">El firmante es</Label>
              <select
                id="signerRole"
                className="w-full h-9 mt-1 px-3 border rounded-md bg-background text-sm"
                value={signerRole}
                onChange={(e) => setSignerRole(e.target.value as typeof signerRole)}
              >
                <option value="patient">El propio paciente</option>
                <option value="guardian">Tutor legal</option>
                <option value="representative">Representante</option>
              </select>
            </div>
            <div>
              <Label htmlFor="signerName">Nombre y apellidos del firmante *</Label>
              <Input
                id="signerName"
                value={signerName}
                onChange={(e) => setSignerName(e.target.value)}
                placeholder="Nombre completo"
              />
            </div>
            <div>
              <Label htmlFor="signerDocument">DNI / NIE</Label>
              <Input
                id="signerDocument"
                value={signerDocument}
                onChange={(e) => setSignerDocument(e.target.value)}
                placeholder="Opcional"
              />
            </div>
            {signerRole !== "patient" && (
              <div>
                <Label htmlFor="signerRelationship">Relacion con el paciente</Label>
                <Input
                  id="signerRelationship"
                  value={signerRelationship}
                  onChange={(e) => setSignerRelationship(e.target.value)}
                  placeholder="padre, madre, tutor..."
                />
              </div>
            )}
          </div>

          <div>
            <Label className="text-sm">Firma *</Label>
            <SignaturePad onSignatureChange={setSignature} />
          </div>

          {!hasReadDoc && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              Desplaza el documento hasta el final antes de firmar.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit || recordMutation.isPending}>
            {recordMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Registrar firma
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ConsentDetailDialog({
  consentId,
  onClose,
}: {
  consentId: string | null;
  onClose: () => void;
}) {
  const { data: detail, isLoading } = usePatientConsentDetail(consentId);

  return (
    <Dialog open={!!consentId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{detail?.template_title || "Consentimiento"}</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : detail ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 bg-muted/40 rounded-lg text-xs">
              <div>
                <span className="text-muted-foreground">Version</span>
                <p className="font-medium">{detail.template_version}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Fecha</span>
                <p className="font-medium">
                  {format(parseISO(detail.signed_at), "dd/MM/yyyy HH:mm", { locale: es })}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Firmante</span>
                <p className="font-medium">{detail.signer_full_name}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Hash firma</span>
                <p className="font-mono text-[10px] truncate">
                  {detail.signature_hash?.substring(0, 24)}...
                </p>
              </div>
            </div>

            <ScrollArea className="flex-1 border rounded-lg p-4">
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown>{detail.template_content_snapshot}</ReactMarkdown>
              </div>

              {detail.signature_data && (
                <div className="mt-6 pt-4 border-t">
                  <p className="text-xs text-muted-foreground mb-2">Firma:</p>
                  <img
                    src={detail.signature_data}
                    alt="Firma"
                    className="max-w-[280px] border rounded bg-white p-2"
                  />
                </div>
              )}
            </ScrollArea>
          </>
        ) : null}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RevokeConsentDialog({
  consent,
  patientId,
  onClose,
}: {
  consent: PatientConsentRecord;
  patientId: string;
  onClose: () => void;
}) {
  const [reason, setReason] = useState("");
  const revokeMutation = useRevokePatientConsent(patientId);

  const handleRevoke = async () => {
    if (reason.trim().length < 3) return;
    try {
      await revokeMutation.mutateAsync({ consentId: consent.id, reason });
      onClose();
    } catch {
      // toast handled
    }
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Revocar consentimiento</DialogTitle>
          <DialogDescription>
            {consent.template_title} (v{consent.template_version})
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-sm">
            Esta accion marcara el consentimiento como revocado. No se elimina del registro
            (queda disponible para auditoria).
          </p>
          <div>
            <Label htmlFor="revokeReason">Motivo de la revocacion *</Label>
            <Textarea
              id="revokeReason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ej: el paciente solicita retirar su consentimiento..."
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleRevoke}
            disabled={reason.trim().length < 3 || revokeMutation.isPending}
          >
            {revokeMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Revocar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
