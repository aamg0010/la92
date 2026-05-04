import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/apiClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export interface Invoice {
  id: string;
  invoice_number: string;
  patient_id: string;
  issue_date: string;
  due_date: string | null;
  subtotal: number;
  discount: number | null;
  tax_amount: number | null;
  total: number;
  status: string;
  notes: string | null;
  cufe: string | null;
  dian_status: string | null;
  dian_response: string | null;
  rips_data: unknown | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  patient?: {
    id: string;
    first_name: string;
    last_name: string;
    document_number: string;
    phone: string;
    email: string | null;
  } | null;
  items?: InvoiceItem[];
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  treatment_id: string | null;
  description: string;
  quantity: number;
  unit_price: number;
  discount: number | null;
  tax_rate: number | null;
  total: number;
  created_at: string;
  treatment?: { id: string; name: string; code: string } | null;
}

// ============ INVOICES ============

export function useInvoices(filters?: {
  status?: string;
  startDate?: string;
  endDate?: string;
  patientId?: string;
}) {
  return useQuery({
    queryKey: ["invoices", filters],
    queryFn: async () => {
      let query = api
        .from<Invoice>("invoices")
        .select("*,patient:patients(id,first_name,last_name,document_number,phone,email)")
        .order("issue_date", { ascending: false });

      if (filters?.status) {
        query = query.eq("status", filters.status);
      }
      if (filters?.startDate) {
        query = query.gte("issue_date", filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte("issue_date", filters.endDate);
      }
      if (filters?.patientId) {
        query = query.eq("patient_id", filters.patientId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Invoice[];
    },
  });
}

export function useInvoice(id: string | null) {
  return useQuery({
    queryKey: ["invoice", id],
    queryFn: async () => {
      if (!id) return null;

      const { data: invoice, error: invoiceError } = await api
        .from<Invoice>("invoices")
        .select("*,patient:patients(id,first_name,last_name,document_number,phone,email)")
        .eq("id", id)
        .single();

      if (invoiceError) throw invoiceError;

      const { data: items, error: itemsError } = await api
        .from<InvoiceItem>("invoice_items")
        .select("*,treatment:treatments(id,name,code)")
        .eq("invoice_id", id);

      if (itemsError) throw itemsError;

      return { ...invoice, items } as Invoice;
    },
    enabled: !!id,
  });
}

export function useCreateInvoice() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (invoice: Partial<Invoice>) => {
      // Generar número de factura
      const { data: lastInvoice } = await api
        .from<Invoice>("invoices")
        .select("invoice_number")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      const lastNumber = lastInvoice?.invoice_number
        ? parseInt(lastInvoice.invoice_number.replace(/\D/g, "")) || 0
        : 0;
      const invoiceNumber = `FEV-${String(lastNumber + 1).padStart(6, "0")}`;

      const { data, error } = await api
        .from("invoices")
        .insert({
          ...invoice,
          invoice_number: invoiceNumber,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast({
        title: "Factura creada",
        description: "La factura ha sido creada correctamente.",
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

export function useUpdateInvoice() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<Invoice>) => {
      const { data, error } = await api
        .from("invoices")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["invoice", variables.id] });
      toast({
        title: "Factura actualizada",
        description: "Los cambios han sido guardados.",
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

// ============ INVOICE ITEMS ============

export function useAddInvoiceItem() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (item: Partial<InvoiceItem>) => {
      const { data, error } = await api
        .from("invoice_items")
        .insert(item)
        .select()
        .single();

      if (error) throw error;

      // Actualizar totales de la factura
      if (item.invoice_id) {
        await recalculateInvoiceTotals(item.invoice_id);
      }

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["invoice", variables.invoice_id] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
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

export function useRemoveInvoiceItem() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, invoiceId }: { id: string; invoiceId: string }) => {
      const { error } = await api
        .from("invoice_items")
        .delete()
        .eq("id", id);

      if (error) throw error;

      // Actualizar totales de la factura
      await recalculateInvoiceTotals(invoiceId);

      return invoiceId;
    },
    onSuccess: (invoiceId) => {
      queryClient.invalidateQueries({ queryKey: ["invoice", invoiceId] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
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

async function recalculateInvoiceTotals(invoiceId: string) {
  const { data: items } = await api
    .from<InvoiceItem>("invoice_items")
    .select("quantity,unit_price,discount,tax_rate,total")
    .eq("invoice_id", invoiceId);

  if (!items) return;

  const itemList = items as InvoiceItem[];
  const subtotal = itemList.reduce((acc, item) => acc + Number(item.unit_price) * item.quantity, 0);
  const discount = itemList.reduce((acc, item) => acc + (Number(item.discount) || 0), 0);
  const taxAmount = itemList.reduce(
    (acc, item) => acc + (Number(item.unit_price) * item.quantity * (Number(item.tax_rate) || 0)) / 100,
    0
  );
  const total = subtotal - discount + taxAmount;

  await api
    .from("invoices")
    .update({ subtotal, discount, tax_amount: taxAmount, total })
    .eq("id", invoiceId);
}

// ============ STATS ============

export function useInvoiceStats(period?: { startDate: string; endDate: string }) {
  return useQuery({
    queryKey: ["invoice-stats", period],
    queryFn: async () => {
      let query = api.from<Invoice>("invoices").select("total,status,issue_date");

      if (period?.startDate) {
        query = query.gte("issue_date", period.startDate);
      }
      if (period?.endDate) {
        query = query.lte("issue_date", period.endDate);
      }

      const { data, error } = await query;
      if (error) throw error;

      const invoices = data as Invoice[];
      const totalInvoiced = invoices.reduce((acc, inv) => acc + Number(inv.total), 0);
      const validatedCount = invoices.filter((inv) => inv.status === "validated").length;
      const pendingCount = invoices.filter((inv) => inv.status === "pending" || inv.status === "draft").length;
      const rejectedCount = invoices.filter((inv) => inv.status === "rejected").length;

      return {
        totalInvoiced,
        totalCount: invoices.length,
        validatedCount,
        pendingCount,
        rejectedCount,
        validationRate: invoices.length > 0 ? Math.round((validatedCount / invoices.length) * 100) : 0,
      };
    },
  });
}

export const INVOICE_STATUSES = [
  { value: "draft", label: "Borrador" },
  { value: "pending", label: "Pendiente" },
  { value: "sent", label: "Enviada DIAN" },
  { value: "validated", label: "Validada" },
  { value: "rejected", label: "Rechazada" },
];

export const DIAN_STATUSES = [
  { value: "pending", label: "Pendiente" },
  { value: "sent", label: "Enviada" },
  { value: "accepted", label: "Aceptada" },
  { value: "rejected", label: "Rechazada" },
];
