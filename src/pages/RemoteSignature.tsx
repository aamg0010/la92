/**
 * RemoteSignature
 *
 * Pagina publica accesible en /firma/:token (fuera del ProtectedRoute).
 * El paciente abre este enlace desde su movil y firma cada plantilla
 * sin necesidad de login.
 *
 * Flujo:
 *  1. Validar token con validate_signature_token
 *  2. Mostrar plantillas una a una; el paciente lee y firma
 *  3. Datos del firmante (rol, nombre, DNI, relacion si aplica)
 *  4. Submit con submit_signature_via_token
 *  5. Pantalla de exito
 *
 * Estados de error: token invalido / usado / caducado / cancelado.
 */
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  useValidateSignatureToken,
  useSubmitSignatureViaToken,
  type RemoteSignaturePayload,
  type PatientConsentTemplateFull,
} from "@/hooks/usePatientConsents";
import { SignaturePad } from "@/components/legal/SignaturePad";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  XCircle,
  Clock as ClockIcon,
  AlertTriangle,
  Loader2,
  Shield,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import ReactMarkdown from "react-markdown";

const DOCUMENT_LABELS: Record<string, string> = {
  rgpd_patient: "RGPD",
  clinical_general: "Consentimiento clinico",
  clinical_treatment: "Consent. de tratamiento",
};

interface PerSignatureState {
  templateId: string;
  signature: string | null;
  hasReadDoc: boolean;
}

export default function RemoteSignature() {
  const { token } = useParams<{ token: string }>();
  const { data: validation, isLoading } = useValidateSignatureToken(token);
  const submitMutation = useSubmitSignatureViaToken();

  // Datos del firmante (compartidos para todas las plantillas)
  const [signerRole, setSignerRole] = useState<"patient" | "guardian" | "representative">("patient");
  const [signerFullName, setSignerFullName] = useState("");
  const [signerDocument, setSignerDocument] = useState("");
  const [signerRelationship, setSignerRelationship] = useState("");
  const [acceptDeclaration, setAcceptDeclaration] = useState(false);

  // Estado por plantilla
  const [perSignature, setPerSignature] = useState<Record<string, PerSignatureState>>({});
  const [currentIdx, setCurrentIdx] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const templates: PatientConsentTemplateFull[] = useMemo(
    () => validation?.templates ?? [],
    [validation?.templates]
  );

  useEffect(() => {
    // Inicializar estado por plantilla
    if (templates.length > 0 && Object.keys(perSignature).length === 0) {
      const initial: Record<string, PerSignatureState> = {};
      for (const t of templates) {
        initial[t.id] = { templateId: t.id, signature: null, hasReadDoc: false };
      }
      setPerSignature(initial);
    }
  }, [templates, perSignature]);

  // Pantallas de error / estados especiales
  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!validation || !validation.success) {
    const state = validation?.state ?? "invalid";
    return <ErrorScreen state={state} message={validation?.error} />;
  }

  if (submitted) {
    return <SuccessScreen clinicName={validation.clinic_name} />;
  }

  const currentTpl = templates[currentIdx];
  const currentState = currentTpl ? perSignature[currentTpl.id] : null;

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (el.scrollHeight - el.scrollTop <= el.clientHeight + 40) {
      if (currentTpl && currentState && !currentState.hasReadDoc) {
        setPerSignature((prev) => ({
          ...prev,
          [currentTpl.id]: { ...prev[currentTpl.id], hasReadDoc: true },
        }));
      }
    }
  };

  const handleSignature = (value: string | null) => {
    if (!currentTpl) return;
    setPerSignature((prev) => ({
      ...prev,
      [currentTpl.id]: { ...prev[currentTpl.id], signature: value },
    }));
  };

  const allSigned = templates.every((t) => perSignature[t.id]?.signature);
  const canSubmit =
    allSigned &&
    signerFullName.trim().length >= 3 &&
    acceptDeclaration &&
    (signerRole === "patient" || signerRelationship.trim().length > 0);

  const goNext = () => {
    if (currentIdx < templates.length - 1) setCurrentIdx(currentIdx + 1);
  };
  const goPrev = () => {
    if (currentIdx > 0) setCurrentIdx(currentIdx - 1);
  };

  const handleSubmit = async () => {
    if (!canSubmit || !token) return;
    const payload: RemoteSignaturePayload[] = templates.map((t) => ({
      template_id: t.id,
      signature_data: perSignature[t.id].signature as string,
      signer_full_name: signerFullName,
      signer_document: signerDocument || undefined,
      signer_role: signerRole,
      signer_relationship: signerRole !== "patient" ? signerRelationship || undefined : undefined,
    }));

    try {
      await submitMutation.mutateAsync({ token, signatures: payload });
      setSubmitted(true);
    } catch (e) {
      // mostraremos el error en banner
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 px-3 py-4 sm:py-8">
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Cabecera */}
        <div className="text-center space-y-1">
          <Shield className="w-10 h-10 mx-auto text-primary" />
          <h1 className="text-xl sm:text-2xl font-bold">Firma de consentimientos</h1>
          <p className="text-sm text-muted-foreground">
            {validation.clinic_name}
            {validation.patient_name ? ` - ${validation.patient_name}` : ""}
          </p>
        </div>

        {/* Tabs de plantillas */}
        <div className="flex flex-wrap gap-1 justify-center">
          {templates.map((t, idx) => {
            const isCurrent = idx === currentIdx;
            const isSigned = !!perSignature[t.id]?.signature;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setCurrentIdx(idx)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs whitespace-nowrap border ${
                  isCurrent
                    ? "bg-primary text-primary-foreground border-primary"
                    : isSigned
                      ? "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/40 dark:text-green-300"
                      : "bg-card border-border"
                }`}
              >
                {isSigned && <CheckCircle2 className="w-3 h-3" />}
                {idx + 1}. {DOCUMENT_LABELS[t.document_type] || t.document_type}
              </button>
            );
          })}
        </div>

        {/* Documento actual */}
        {currentTpl && currentState && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-base">{currentTpl.title}</CardTitle>
                <Badge variant="outline">v{currentTpl.version}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                className="border rounded-lg p-3 bg-muted/20 max-h-[260px] overflow-y-auto text-sm prose prose-sm dark:prose-invert max-w-none"
                onScroll={handleScroll}
              >
                <ReactMarkdown>{currentTpl.content}</ReactMarkdown>
              </div>

              {!currentState.hasReadDoc && (
                <p className="text-xs text-amber-600 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Desplaza el documento hasta el final antes de firmar.
                </p>
              )}

              <div>
                <Label className="text-sm">Firma de este documento *</Label>
                <SignaturePad onSignatureChange={handleSignature} />
              </div>

              <div className="flex justify-between items-center pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goPrev}
                  disabled={currentIdx === 0}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Anterior
                </Button>
                <span className="text-xs text-muted-foreground">
                  {currentIdx + 1} / {templates.length}
                </span>
                <Button
                  size="sm"
                  onClick={goNext}
                  disabled={currentIdx === templates.length - 1 || !currentState.signature}
                >
                  Siguiente
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Datos del firmante */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Datos del firmante</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label htmlFor="signerRoleR">Soy</Label>
              <select
                id="signerRoleR"
                className="w-full h-10 mt-1 px-3 border rounded-md bg-background text-sm"
                value={signerRole}
                onChange={(e) => setSignerRole(e.target.value as typeof signerRole)}
              >
                <option value="patient">El propio paciente</option>
                <option value="guardian">Tutor legal del paciente</option>
                <option value="representative">Representante autorizado</option>
              </select>
            </div>
            <div>
              <Label htmlFor="signerNameR">Nombre y apellidos *</Label>
              <Input
                id="signerNameR"
                value={signerFullName}
                onChange={(e) => setSignerFullName(e.target.value)}
                placeholder="Nombre completo"
                autoComplete="name"
              />
            </div>
            <div>
              <Label htmlFor="signerDocR">DNI / NIE</Label>
              <Input
                id="signerDocR"
                value={signerDocument}
                onChange={(e) => setSignerDocument(e.target.value)}
                placeholder="Opcional"
              />
            </div>
            {signerRole !== "patient" && (
              <div>
                <Label htmlFor="signerRelR">Relacion con el paciente *</Label>
                <Input
                  id="signerRelR"
                  value={signerRelationship}
                  onChange={(e) => setSignerRelationship(e.target.value)}
                  placeholder="padre, madre, tutor, etc."
                />
              </div>
            )}

            <label className="flex items-start gap-2 pt-2 cursor-pointer">
              <Checkbox
                checked={acceptDeclaration}
                onCheckedChange={(c) => setAcceptDeclaration(c === true)}
              />
              <span className="text-xs text-muted-foreground leading-relaxed">
                Declaro que he leido los documentos anteriores, que la informacion facilitada es veraz
                y que firmo de forma libre y voluntaria.
              </span>
            </label>
          </CardContent>
        </Card>

        {submitMutation.isError && (
          <p className="text-sm text-red-600 text-center">
            {(submitMutation.error as Error)?.message || "Error al enviar las firmas"}
          </p>
        )}

        <Button
          className="w-full"
          size="lg"
          disabled={!canSubmit || submitMutation.isPending}
          onClick={handleSubmit}
        >
          {submitMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Enviar firma{templates.length > 1 ? "s" : ""}
        </Button>

        {!allSigned && (
          <p className="text-xs text-center text-muted-foreground">
            Aun faltan documentos por firmar.
          </p>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Subcomponentes de estado
// ---------------------------------------------------------------------------

function LoadingScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-slate-50">
      <Loader2 className="w-10 h-10 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">Validando enlace...</p>
    </div>
  );
}

function ErrorScreen({ state, message }: { state: string; message?: string }) {
  const config: Record<string, { title: string; desc: string; Icon: typeof XCircle }> = {
    invalid: {
      title: "Enlace no valido",
      desc: message || "El enlace no es correcto. Solicite uno nuevo a su clinica.",
      Icon: XCircle,
    },
    used: {
      title: "Enlace ya utilizado",
      desc: "Este enlace ya se ha utilizado para firmar. Si necesita firmar de nuevo, solicite uno nuevo.",
      Icon: CheckCircle2,
    },
    expired: {
      title: "Enlace caducado",
      desc: "Este enlace ha caducado. Solicite uno nuevo a su clinica.",
      Icon: ClockIcon,
    },
    cancelled: {
      title: "Enlace cancelado",
      desc: "Este enlace fue cancelado por la clinica.",
      Icon: XCircle,
    },
  };
  const cfg = config[state] || config.invalid;
  const { Icon } = cfg;
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-slate-50">
      <Card className="max-w-md w-full">
        <CardContent className="pt-8 pb-6 text-center space-y-3">
          <Icon className="w-12 h-12 mx-auto text-amber-500" />
          <h2 className="text-lg font-semibold">{cfg.title}</h2>
          <p className="text-sm text-muted-foreground">{cfg.desc}</p>
        </CardContent>
      </Card>
    </div>
  );
}

function SuccessScreen({ clinicName }: { clinicName?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-slate-50">
      <Card className="max-w-md w-full">
        <CardContent className="pt-8 pb-6 text-center space-y-3">
          <CheckCircle2 className="w-14 h-14 mx-auto text-green-600" />
          <h2 className="text-xl font-semibold">Firmas registradas</h2>
          <p className="text-sm text-muted-foreground">
            Sus consentimientos han sido recibidos correctamente
            {clinicName ? ` por ${clinicName}` : ""}.
            <br />
            Ya puede cerrar esta ventana.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
