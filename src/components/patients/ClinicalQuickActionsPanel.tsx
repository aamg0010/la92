import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Archive,
  ClipboardPlus,
  FileCheck2,
  Loader2,
  Pill,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
  Upload,
  UserRound,
} from "lucide-react";
import {
  useClinicalHistory,
  useCloseClinicalCase,
  useCreateClinicalConsent,
  useCreateClinicalFormula,
  useCreateClinicalHistory,
  useCreateClinicalRecommendation,
  useUploadClinicalAttachment,
} from "@/hooks/useClinicalHistory";

interface ClinicalQuickActionsPanelProps {
  patientId: string;
  patientName: string;
  selectedTooth?: string;
  onSelectedToothChange?: (tooth: string) => void;
}

type QuickTab = "perfil" | "recomendacion" | "formula" | "consentimiento" | "cierre";

const emptyForm = {
  diagnosis: "",
  treatment: "",
  notes: "",
  toothNumber: "",
};

const emptyExtendedProfile = {
  responsible: "",
  responsibleContact: "",
  companions: "",
  assignedDoctor: "",
  consultationReason: "",
  background: "",
  allergies: "",
  otherNotes: "",
};

export function ClinicalQuickActionsPanel({
  patientId,
  patientName,
  selectedTooth,
  onSelectedToothChange,
}: ClinicalQuickActionsPanelProps) {
  const [activeTab, setActiveTab] = useState<QuickTab>("perfil");
  const [perfil, setPerfil] = useState(emptyForm);
  const [extendedProfile, setExtendedProfile] = useState(emptyExtendedProfile);
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [recomendacion, setRecomendacion] = useState({ diagnosis: "", notes: "" });
  const [formula, setFormula] = useState({ diagnosis: "", treatment: "", notes: "" });
  const [consentimiento, setConsentimiento] = useState({ diagnosis: "", notes: "", signedBy: "" });
  const [cierre, setCierre] = useState({ diagnosis: "", treatment: "", notes: "", archiveActive: true });

  const createEntry = useCreateClinicalHistory();
  const uploadAttachment = useUploadClinicalAttachment();
  const createRecommendation = useCreateClinicalRecommendation();
  const createFormula = useCreateClinicalFormula();
  const createConsent = useCreateClinicalConsent();
  const closeClinicalCase = useCloseClinicalCase();
  const { data: history = [] } = useClinicalHistory(patientId);

  useEffect(() => {
    if (!selectedTooth) return;
    setPerfil((current) => ({ ...current, toothNumber: selectedTooth }));
  }, [selectedTooth]);

  const activeEntries = useMemo(() => history.filter((entry) => entry.is_active), [history]);
  const archivedEntries = history.length - activeEntries.length;
  const activeRecommendations = useMemo(
    () => history.filter((entry) => entry.is_active && entry.diagnosis === "RECOMENDACION_ESPECIAL"),
    [history]
  );

  const isBusy =
    createEntry.isPending ||
    uploadAttachment.isPending ||
    createRecommendation.isPending ||
    createFormula.isPending ||
    createConsent.isPending ||
    closeClinicalCase.isPending;

  const savePerfil = async () => {
    await createEntry.mutateAsync({
      patient_id: patientId,
      diagnosis: perfil.diagnosis,
      treatment: perfil.treatment || null,
      tooth_number: perfil.toothNumber || null,
      notes: perfil.notes || null,
    });
    setPerfil((current) => ({ ...emptyForm, toothNumber: current.toothNumber }));
  };

  const saveExtendedProfile = async () => {
    const attachments = [] as { name: string; url: string; type: string }[];
    if (profilePhoto) {
      const uploaded = await uploadAttachment.mutateAsync({ file: profilePhoto, patientId });
      attachments.push(uploaded);
    }

    await createEntry.mutateAsync({
      patient_id: patientId,
      diagnosis: "PERFIL_EXTENDIDO",
      notes: JSON.stringify({
        responsible: extendedProfile.responsible,
        responsible_contact: extendedProfile.responsibleContact,
        companions: extendedProfile.companions,
        assigned_doctor: extendedProfile.assignedDoctor,
        consultation_reason: extendedProfile.consultationReason,
        background: extendedProfile.background,
        allergies: extendedProfile.allergies,
        other_notes: extendedProfile.otherNotes,
        source: "react_clinical_panel",
      }),
      attachments,
    });

    setExtendedProfile(emptyExtendedProfile);
    setProfilePhoto(null);
  };

  const saveRecommendation = async () => {
    await createRecommendation.mutateAsync({
      patient_id: patientId,
      diagnosis: recomendacion.diagnosis || undefined,
      notes: recomendacion.notes,
    });
    setRecomendacion({ diagnosis: "", notes: "" });
  };

  const saveFormula = async () => {
    await createFormula.mutateAsync({
      patient_id: patientId,
      diagnosis: formula.diagnosis || undefined,
      treatment: formula.treatment || null,
      notes: formula.notes,
    });
    setFormula({ diagnosis: "", treatment: "", notes: "" });
  };

  const saveConsent = async () => {
    await createConsent.mutateAsync({
      patient_id: patientId,
      diagnosis: consentimiento.diagnosis || undefined,
      notes: consentimiento.notes,
      signed_by: consentimiento.signedBy || undefined,
    });
    setConsentimiento({ diagnosis: "", notes: "", signedBy: "" });
  };

  const saveClosure = async () => {
    await closeClinicalCase.mutateAsync({
      patient_id: patientId,
      diagnosis: cierre.diagnosis || undefined,
      treatment: cierre.treatment || undefined,
      notes: cierre.notes,
      archive_active: cierre.archiveActive,
    });
    setCierre({ diagnosis: "", treatment: "", notes: "", archiveActive: true });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Panel Clinico Rapido
            </CardTitle>
            <CardDescription>
              Acciones clinicas estructuradas para {patientName}
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{activeEntries.length} activos</Badge>
            <Badge variant="outline">{archivedEntries} archivados</Badge>
            {selectedTooth ? <Badge variant="outline">Pieza {selectedTooth}</Badge> : null}
            {activeRecommendations.length > 0 ? <Badge variant="outline">{activeRecommendations.length} recomendacion(es)</Badge> : null}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as QuickTab)}>
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5">
            <TabsTrigger value="perfil">Perfil</TabsTrigger>
            <TabsTrigger value="recomendacion">Recomendacion</TabsTrigger>
            <TabsTrigger value="formula">Formula</TabsTrigger>
            <TabsTrigger value="consentimiento">Consent.</TabsTrigger>
            <TabsTrigger value="cierre">Cierre</TabsTrigger>
          </TabsList>

          <TabsContent value="perfil" className="space-y-6 pt-4">
            <QuickPanelHeader icon={<ClipboardPlus className="h-4 w-4" />} title="Registro clinico rapido" />
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Diagnostico">
                <Input value={perfil.diagnosis} onChange={(e) => setPerfil((current) => ({ ...current, diagnosis: e.target.value }))} />
              </Field>
              <Field label="Tratamiento">
                <Input value={perfil.treatment} onChange={(e) => setPerfil((current) => ({ ...current, treatment: e.target.value }))} />
              </Field>
              <Field label="Pieza dental">
                <Input
                  value={perfil.toothNumber}
                  onChange={(e) => {
                    const tooth = e.target.value;
                    setPerfil((current) => ({ ...current, toothNumber: tooth }));
                    onSelectedToothChange?.(tooth);
                  }}
                  placeholder="Ej: 11"
                />
              </Field>
            </div>
            <Field label="Notas">
              <Textarea value={perfil.notes} onChange={(e) => setPerfil((current) => ({ ...current, notes: e.target.value }))} className="min-h-[120px]" />
            </Field>
            <SaveButton disabled={!perfil.diagnosis.trim() || isBusy} loading={isBusy} onClick={savePerfil} label="Guardar registro rapido" />

            <div className="border-t pt-6 space-y-4">
              <QuickPanelHeader icon={<UserRound className="h-4 w-4" />} title="Perfil extendido" />
              <InfoBox>
                Sustituye el antiguo guardado de PERFIL_EXTENDIDO del script externo, incluyendo foto y antecedentes principales.
              </InfoBox>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Responsable">
                  <Input value={extendedProfile.responsible} onChange={(e) => setExtendedProfile((current) => ({ ...current, responsible: e.target.value }))} />
                </Field>
                <Field label="Contacto responsable">
                  <Input value={extendedProfile.responsibleContact} onChange={(e) => setExtendedProfile((current) => ({ ...current, responsibleContact: e.target.value }))} />
                </Field>
                <Field label="Acompanantes">
                  <Input value={extendedProfile.companions} onChange={(e) => setExtendedProfile((current) => ({ ...current, companions: e.target.value }))} />
                </Field>
                <Field label="Doctor asignado">
                  <Input value={extendedProfile.assignedDoctor} onChange={(e) => setExtendedProfile((current) => ({ ...current, assignedDoctor: e.target.value }))} />
                </Field>
              </div>
              <Field label="Motivo de consulta">
                <Textarea value={extendedProfile.consultationReason} onChange={(e) => setExtendedProfile((current) => ({ ...current, consultationReason: e.target.value }))} className="min-h-[100px]" />
              </Field>
              <Field label="Antecedentes">
                <Textarea value={extendedProfile.background} onChange={(e) => setExtendedProfile((current) => ({ ...current, background: e.target.value }))} className="min-h-[100px]" />
              </Field>
              <Field label="Alergias">
                <Textarea value={extendedProfile.allergies} onChange={(e) => setExtendedProfile((current) => ({ ...current, allergies: e.target.value }))} className="min-h-[90px]" />
              </Field>
              <Field label="Otros elementos importantes">
                <Textarea value={extendedProfile.otherNotes} onChange={(e) => setExtendedProfile((current) => ({ ...current, otherNotes: e.target.value }))} className="min-h-[100px]" />
              </Field>
              <Field label="Foto clinica / movil">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <Input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={(e) => setProfilePhoto(e.target.files?.[0] || null)}
                  />
                  {profilePhoto ? <Badge variant="outline">{profilePhoto.name}</Badge> : null}
                </div>
              </Field>
              <SaveButton
                disabled={!extendedProfile.consultationReason.trim() && !extendedProfile.background.trim() && !profilePhoto}
                loading={isBusy}
                onClick={saveExtendedProfile}
                label="Guardar perfil extendido"
              />
            </div>
          </TabsContent>

          <TabsContent value="recomendacion" className="space-y-4 pt-4">
            <QuickPanelHeader icon={<ShieldCheck className="h-4 w-4" />} title="Recomendacion especial" />
            <InfoBox>
              Usa esta accion para dejar advertencias o instrucciones de seguimiento que deban quedar visibles en la historia clinica del paciente.
            </InfoBox>
            <Field label="Diagnostico o motivo">
              <Input value={recomendacion.diagnosis} onChange={(e) => setRecomendacion((current) => ({ ...current, diagnosis: e.target.value }))} placeholder="RECOMENDACION_ESPECIAL" />
            </Field>
            <Field label="Recomendaciones">
              <Textarea value={recomendacion.notes} onChange={(e) => setRecomendacion((current) => ({ ...current, notes: e.target.value }))} className="min-h-[140px]" />
            </Field>
            <SaveButton disabled={!recomendacion.notes.trim() || isBusy} loading={isBusy} onClick={saveRecommendation} />
          </TabsContent>

          <TabsContent value="formula" className="space-y-4 pt-4">
            <QuickPanelHeader icon={<Pill className="h-4 w-4" />} title="Formula y medicacion" />
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Diagnostico">
                <Input value={formula.diagnosis} onChange={(e) => setFormula((current) => ({ ...current, diagnosis: e.target.value }))} placeholder="FORMULA_MEDICA" />
              </Field>
              <Field label="Tratamiento o formula">
                <Input value={formula.treatment} onChange={(e) => setFormula((current) => ({ ...current, treatment: e.target.value }))} />
              </Field>
            </div>
            <Field label="Indicaciones">
              <Textarea value={formula.notes} onChange={(e) => setFormula((current) => ({ ...current, notes: e.target.value }))} className="min-h-[140px]" />
            </Field>
            <SaveButton disabled={!formula.notes.trim() || isBusy} loading={isBusy} onClick={saveFormula} />
          </TabsContent>

          <TabsContent value="consentimiento" className="space-y-4 pt-4">
            <QuickPanelHeader icon={<FileCheck2 className="h-4 w-4" />} title="Consentimiento informado" />
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Tipo de consentimiento">
                <Input value={consentimiento.diagnosis} onChange={(e) => setConsentimiento((current) => ({ ...current, diagnosis: e.target.value }))} placeholder="CONSENTIMIENTO_INFORMADO" />
              </Field>
              <Field label="Firmado por">
                <Input value={consentimiento.signedBy} onChange={(e) => setConsentimiento((current) => ({ ...current, signedBy: e.target.value }))} />
              </Field>
            </div>
            <Field label="Detalle">
              <Textarea value={consentimiento.notes} onChange={(e) => setConsentimiento((current) => ({ ...current, notes: e.target.value }))} className="min-h-[140px]" />
            </Field>
            <SaveButton disabled={!consentimiento.notes.trim() || isBusy} loading={isBusy} onClick={saveConsent} />
          </TabsContent>

          <TabsContent value="cierre" className="space-y-4 pt-4">
            <QuickPanelHeader icon={<Archive className="h-4 w-4" />} title="Cierre clinico" />
            <InfoBox tone="warning">
              Esta accion registra un cierre clinico y puede archivar de forma masiva todos los registros activos del paciente. Usala solo cuando corresponda cerrar el episodio actual.
            </InfoBox>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Diagnostico final">
                <Input value={cierre.diagnosis} onChange={(e) => setCierre((current) => ({ ...current, diagnosis: e.target.value }))} placeholder="CIERRE_CITA_MANUAL" />
              </Field>
              <Field label="Tratamiento final">
                <Input value={cierre.treatment} onChange={(e) => setCierre((current) => ({ ...current, treatment: e.target.value }))} placeholder="CIERRE_CLINICO" />
              </Field>
            </div>
            <Field label="Resumen de cierre">
              <Textarea value={cierre.notes} onChange={(e) => setCierre((current) => ({ ...current, notes: e.target.value }))} className="min-h-[140px]" />
            </Field>
            <label className="flex items-center gap-3 rounded-lg border p-3 text-sm">
              <input
                type="checkbox"
                checked={cierre.archiveActive}
                onChange={(e) => setCierre((current) => ({ ...current, archiveActive: e.target.checked }))}
              />
              Archivar todos los registros activos antes de guardar el cierre
            </label>
            {activeEntries.length > 0 ? (
              <p className="text-xs text-muted-foreground">
                Actualmente hay {activeEntries.length} registro(s) activos para este paciente.
              </p>
            ) : null}
            <SaveButton disabled={!cierre.notes.trim() || isBusy} loading={isBusy} onClick={saveClosure} label="Guardar cierre" />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function QuickPanelHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 text-sm font-medium text-foreground">
      <span className="text-primary">{icon}</span>
      <span>{title}</span>
    </div>
  );
}

function InfoBox({ children, tone = "default" }: { children: React.ReactNode; tone?: "default" | "warning" }) {
  const classes = tone === "warning"
    ? "border-amber-300/60 bg-amber-50 text-amber-950"
    : "border-border bg-muted/40 text-muted-foreground";

  return (
    <div className={`flex items-start gap-3 rounded-lg border p-3 text-sm ${classes}`}>
      <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
      <div>{children}</div>
    </div>
  );
}

function SaveButton({
  disabled,
  loading,
  onClick,
  label = "Guardar registro",
}: {
  disabled: boolean;
  loading: boolean;
  onClick: () => Promise<void>;
  label?: string;
}) {
  return (
    <div className="flex justify-end">
      <Button disabled={disabled} onClick={() => void onClick()}>
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        {label}
      </Button>
    </div>
  );
}
