import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/apiClient";
import { useToast } from "@/hooks/use-toast";

export interface PendingDocument {
  id: string;
  document_type: "terms" | "privacy" | "rgpd" | "data_processing";
  version: string;
  title: string;
  requires_signature: boolean;
}

export interface LegalDocument {
  id: string;
  document_type: string;
  version: string;
  title: string;
  content: string;
  is_active: boolean;
  requires_signature: boolean;
}

export interface LegalAcceptance {
  id: string;
  document_type: string;
  document_version: string;
  title: string;
  accepted_at: string;
  full_name: string;
  has_signature: boolean;
  signature_hash: string;
}

export interface AcceptanceDetail {
  id: string;
  document_type: string;
  document_version: string;
  title: string;
  content: string;
  accepted_at: string;
  full_name: string;
  document_number: string;
  signature_data: string;
  signature_hash: string;
  ip_address: string;
  clinic_name: string;
}

interface TermsCheckResult {
  needs_acceptance: boolean;
  pending_documents: PendingDocument[];
}

export function useCheckTermsAcceptance(userId: string | undefined) {
  return useQuery({
    queryKey: ["terms-check", userId],
    queryFn: async () => {
      if (!userId) return { needs_acceptance: false, pending_documents: [] };

      const { data, error } = await api.rpc<TermsCheckResult>("check_terms_acceptance", {
        p_user_id: userId,
      });

      if (error) throw error;
      return data;
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useLegalDocuments() {
  return useQuery({
    queryKey: ["legal-documents"],
    queryFn: async () => {
      const { data, error } = await api
        .from<LegalDocument>("legal_documents")
        .select("*")
        .eq("is_active", true)
        .order("document_type");

      if (error) throw error;
      return data || [];
    },
  });
}

export function useLegalDocument(documentId: string | undefined) {
  return useQuery({
    queryKey: ["legal-document", documentId],
    queryFn: async () => {
      if (!documentId) return null;

      const { data, error } = await api
        .from<LegalDocument>("legal_documents")
        .select("*")
        .eq("id", documentId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!documentId,
  });
}

export function useMyLegalAcceptances() {
  return useQuery({
    queryKey: ["my-legal-acceptances"],
    queryFn: async () => {
      const { data, error } = await api.rpc<LegalAcceptance[]>("get_my_legal_acceptances");
      if (error) throw error;
      return data || [];
    },
  });
}

export function useLegalAcceptanceDetail(acceptanceId: string | undefined) {
  return useQuery({
    queryKey: ["legal-acceptance-detail", acceptanceId],
    queryFn: async () => {
      if (!acceptanceId) return null;

      const { data, error } = await api.rpc<AcceptanceDetail>("get_legal_acceptance_detail", {
        p_acceptance_id: acceptanceId,
      });

      if (error) throw error;
      return data;
    },
    enabled: !!acceptanceId,
  });
}

export function useAcceptLegalDocument() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      documentId,
      fullName,
      documentNumber,
      signatureData,
    }: {
      documentId: string;
      fullName: string;
      documentNumber?: string;
      signatureData?: string;
    }) => {
      const { data, error } = await api.rpc("accept_legal_document", {
        p_document_id: documentId,
        p_full_name: fullName,
        p_document_number: documentNumber || null,
        p_signature_data: signatureData || null,
        p_ip_address: null, // Could be obtained from a service
        p_user_agent: navigator.userAgent,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["terms-check"] });
      queryClient.invalidateQueries({ queryKey: ["my-legal-acceptances"] });
      toast({
        title: "Documento aceptado",
        description: "El documento ha sido firmado y aceptado correctamente.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
