/**
 * usePatientConsents
 *
 * Hooks para consentimientos firmados por pacientes (RGPD, clinico general,
 * clinico por tratamiento). Se apoya en las RPCs definidas en la migracion 035:
 *   - record_patient_consent
 *   - get_patient_pending_consents
 *   - get_patient_consents_history
 *   - get_patient_consent_detail
 *   - create_signature_token
 *   - validate_signature_token   (PUBLIC - usado en /firma/:token)
 *   - submit_signature_via_token (PUBLIC - usado en /firma/:token)
 *   - revoke_patient_consent
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/apiClient";
import { useToast } from "@/hooks/use-toast";

export type PatientConsentDocumentType =
  | "rgpd_patient"
  | "clinical_general"
  | "clinical_treatment";

export interface PatientConsentTemplate {
  id: string;
  document_type: PatientConsentDocumentType;
  version: string;
  title: string;
  treatment_type: string | null;
  requires_signature: boolean;
  is_clinic_specific?: boolean;
}

export interface PatientConsentTemplateFull extends PatientConsentTemplate {
  content: string;
}

export interface PatientConsentRecord {
  id: string;
  template_id: string;
  template_document_type: string;
  template_version: string;
  template_title: string;
  treatment_id: string | null;
  treatment_type: string | null;
  signer_role: "patient" | "guardian" | "representative";
  signer_full_name: string;
  signer_document: string | null;
  signer_relationship: string | null;
  signature_hash: string;
  content_hash: string;
  collection_method: "in_clinic" | "remote_link" | "remote_qr";
  device_type: string | null;
  status: "active" | "revoked" | "superseded";
  revoked_at: string | null;
  revocation_reason: string | null;
  signed_at: string;
}

export interface PatientConsentDetail {
  id: string;
  patient_id: string;
  template_id: string;
  template_document_type: string;
  template_version: string;
  template_title: string;
  template_content_snapshot: string;
  template_content_hash: string;
  treatment_id: string | null;
  treatment_type: string | null;
  signer_role: string;
  signer_full_name: string;
  signer_document: string | null;
  signer_relationship: string | null;
  signature_data: string;
  signature_hash: string;
  collection_method: string;
  device_type: string | null;
  ip_address: string | null;
  user_agent: string | null;
  collected_by_user_id: string | null;
  status: string;
  revoked_at: string | null;
  revoked_by_user_id: string | null;
  revocation_reason: string | null;
  signed_at: string;
  created_at: string;
}

interface PendingConsentsResult {
  success: boolean;
  error?: string;
  patient_id?: string;
  treatment_id?: string | null;
  pending_consents?: PatientConsentTemplate[];
}

interface ConsentsHistoryResult {
  success: boolean;
  error?: string;
  patient_id?: string;
  consents?: PatientConsentRecord[];
}

interface ConsentDetailResult {
  success: boolean;
  error?: string;
  consent?: PatientConsentDetail;
}

interface RecordConsentInput {
  patientId: string;
  templateId: string;
  signatureData: string;
  signerFullName: string;
  signerRole?: "patient" | "guardian" | "representative";
  signerDocument?: string;
  signerRelationship?: string;
  treatmentId?: string;
  deviceType?: "tablet" | "mobile" | "desktop";
  collectionMethod?: "in_clinic" | "remote_link" | "remote_qr";
}

interface RecordConsentResult {
  success: boolean;
  error?: string;
  consent_id?: string;
  template_id?: string;
  template_title?: string;
  signature_hash?: string;
  content_hash?: string;
}

interface CreateTokenInput {
  patientId: string;
  templateIds: string[];
  treatmentId?: string;
  expiresHours?: number;
}

interface CreateTokenResult {
  success: boolean;
  error?: string;
  token?: string;
  expires_at?: string;
  expires_hours?: number;
}

interface RevokeConsentInput {
  consentId: string;
  reason: string;
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * Plantillas de consentimiento PENDIENTES de firmar para un paciente.
 */
export function usePendingPatientConsents(
  patientId: string | null | undefined,
  options?: { treatmentId?: string; treatmentType?: string }
) {
  return useQuery({
    queryKey: ["patient-pending-consents", patientId, options?.treatmentId, options?.treatmentType],
    queryFn: async () => {
      if (!patientId) return [] as PatientConsentTemplate[];
      const { data, error } = await api.rpc<PendingConsentsResult>("get_patient_pending_consents", {
        p_patient_id: patientId,
        p_treatment_id: options?.treatmentId ?? null,
        p_treatment_type: options?.treatmentType ?? null,
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Error al obtener consentimientos pendientes");
      return data.pending_consents ?? [];
    },
    enabled: !!patientId,
  });
}

/**
 * Historial completo de consentimientos del paciente (firmados + revocados).
 */
export function usePatientConsentsHistory(patientId: string | null | undefined) {
  return useQuery({
    queryKey: ["patient-consents-history", patientId],
    queryFn: async () => {
      if (!patientId) return [] as PatientConsentRecord[];
      const { data, error } = await api.rpc<ConsentsHistoryResult>("get_patient_consents_history", {
        p_patient_id: patientId,
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Error al obtener historial");
      return data.consents ?? [];
    },
    enabled: !!patientId,
  });
}

/**
 * Detalle de un consentimiento concreto (para visualizar / generar PDF).
 */
export function usePatientConsentDetail(consentId: string | null | undefined) {
  return useQuery({
    queryKey: ["patient-consent-detail", consentId],
    queryFn: async () => {
      if (!consentId) return null;
      const { data, error } = await api.rpc<ConsentDetailResult>("get_patient_consent_detail", {
        p_consent_id: consentId,
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Error al cargar consentimiento");
      return data.consent ?? null;
    },
    enabled: !!consentId,
  });
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/**
 * Registra un consentimiento firmado en sitio (in-clinic).
 */
export function useRecordPatientConsent() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: RecordConsentInput) => {
      const { data, error } = await api.rpc<RecordConsentResult>("record_patient_consent", {
        p_patient_id: input.patientId,
        p_template_id: input.templateId,
        p_signature_data: input.signatureData,
        p_signer_role: input.signerRole ?? "patient",
        p_signer_full_name: input.signerFullName,
        p_signer_document: input.signerDocument ?? null,
        p_signer_relationship: input.signerRelationship ?? null,
        p_treatment_id: input.treatmentId ?? null,
        p_device_type: input.deviceType ?? "desktop",
        p_collection_method: input.collectionMethod ?? "in_clinic",
        p_user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "No se pudo registrar el consentimiento");
      return data;
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ["patient-pending-consents", vars.patientId] });
      queryClient.invalidateQueries({ queryKey: ["patient-consents-history", vars.patientId] });
      toast({
        title: "Consentimiento registrado",
        description: "La firma ha sido registrada correctamente.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

/**
 * Crea un token UUID para que el paciente firme desde su movil.
 */
export function useCreateSignatureToken() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: CreateTokenInput) => {
      const { data, error } = await api.rpc<CreateTokenResult>("create_signature_token", {
        p_patient_id: input.patientId,
        p_template_ids: input.templateIds,
        p_treatment_id: input.treatmentId ?? null,
        p_expires_hours: input.expiresHours ?? 48,
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "No se pudo crear el enlace");
      return data;
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

/**
 * Revoca un consentimiento.
 */
export function useRevokePatientConsent(patientId?: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: RevokeConsentInput) => {
      const { data, error } = await api.rpc<{ success: boolean; error?: string }>(
        "revoke_patient_consent",
        {
          p_consent_id: input.consentId,
          p_reason: input.reason,
        }
      );
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "No se pudo revocar");
      return data;
    },
    onSuccess: () => {
      if (patientId) {
        queryClient.invalidateQueries({ queryKey: ["patient-pending-consents", patientId] });
        queryClient.invalidateQueries({ queryKey: ["patient-consents-history", patientId] });
      }
      toast({
        title: "Consentimiento revocado",
        description: "El consentimiento ha sido marcado como revocado.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// ---------------------------------------------------------------------------
// PUBLIC (firma remota): usado por la pagina /firma/:token, sin sesion.
// Estos hooks NO requieren auth y no envian X-Session-Token (el apiClient
// solo lo agrega si existe en localStorage; en navegacion publica no existe).
// ---------------------------------------------------------------------------

export interface RemoteSignatureValidation {
  success: boolean;
  error?: string;
  state?: "valid" | "invalid" | "used" | "expired" | "cancelled";
  clinic_name?: string;
  patient_name?: string;
  expires_at?: string;
  templates?: PatientConsentTemplateFull[];
}

export function useValidateSignatureToken(token: string | undefined) {
  return useQuery({
    queryKey: ["validate-signature-token", token],
    queryFn: async () => {
      if (!token) {
        return { success: false, state: "invalid", error: "Token vacio" } as RemoteSignatureValidation;
      }
      const { data, error } = await api.rpc<RemoteSignatureValidation>("validate_signature_token", {
        p_token: token,
      });
      if (error) {
        return { success: false, state: "invalid", error: error.message } as RemoteSignatureValidation;
      }
      return data ?? { success: false, state: "invalid", error: "Sin respuesta" };
    },
    enabled: !!token,
    retry: false,
    staleTime: 30 * 1000,
  });
}

export interface RemoteSignaturePayload {
  template_id: string;
  signature_data: string;
  signer_full_name: string;
  signer_document?: string;
  signer_role?: "patient" | "guardian" | "representative";
  signer_relationship?: string;
}

export function useSubmitSignatureViaToken() {
  return useMutation({
    mutationFn: async (input: { token: string; signatures: RemoteSignaturePayload[] }) => {
      const { data, error } = await api.rpc<{
        success: boolean;
        error?: string;
        consents_created?: number;
        consent_ids?: string[];
      }>("submit_signature_via_token", {
        p_token: input.token,
        p_signatures: input.signatures,
        p_user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "No se pudo enviar la firma");
      return data;
    },
  });
}
