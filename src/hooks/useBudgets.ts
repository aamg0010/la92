/**
 * useBudgets.ts
 * Hooks de React Query para la gestion de presupuestos (budgets + budget_items).
 * Sigue el patron establecido por usePayments / useInvoices.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/apiClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

// ============ TYPES ============

export interface BudgetItem {
  id: string;
  budget_id: string;
  treatment_id: string | null;
  description: string;
  tooth_number: string | null;
  quantity: number;
  unit_price: number;
  discount: number | null;
  tax_rate: number | null;
  total: number;
  created_at: string;
  treatment?: { id: string; name: string; code: string } | null;
}

export interface Budget {
  id: string;
  budget_number: string;
  patient_id: string;
  issue_date: string;
  valid_until: string | null;
  subtotal: number;
  discount: number | null;
  tax_amount: number | null;
  total: number;
  status: string;
  notes: string | null;
  converted_invoice_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  patient?: {
    id: string;
    first_name: string;
    last_name: string;
    document_number: string;
    phone: string | null;
    email: string | null;
  } | null;
}

export interface BudgetWithItems extends Budget {
  items: BudgetItem[];
}

/** Representacion de un item durante la edicion (puede no tener id aun). */
export interface BudgetItemDraft {
  id?: string;
  treatment_id?: string | null;
  description: string;
  tooth_number?: string | null;
  quantity: number;
  unit_price: number;
  discount?: number;
  tax_rate?: number;
  /** Calculado en el form. No se envia al backend sin recalcular. */
  total?: number;
}

// ============ CONSTANTS ============

export const BUDGET_STATUSES = [
  { value: "draft", label: "Borrador" },
  { value: "sent", label: "Enviado" },
  { value: "accepted", label: "Aceptado" },
  { value: "rejected", label: "Rechazado" },
  { value: "expired", label: "Vencido" },
  { value: "converted", label: "Convertido" },
] as const;

// ============ UTILS ============

/**
 * Calcula el total de un item aplicando descuento y tasa de impuesto.
 * Formula: base = unit_price * quantity
 *          neto = base - discount
 *          total = neto + (neto * tax_rate / 100)
 */
export function computeBudgetItemTotal(item: {
  quantity: number;
  unit_price: number;
  discount?: number;
  tax_rate?: number;
}): number {
  const base = Number(item.unit_price) * Number(item.quantity || 0);
  const discount = Number(item.discount || 0);
  const net = Math.max(0, base - discount);
  const taxRate = Number(item.tax_rate || 0);
  const total = net + (net * taxRate) / 100;
  return Math.round(total * 100) / 100;
}

/** Calcula los totales del presupuesto a partir de sus items + descuento global. */
export function computeBudgetTotals(
  items: BudgetItemDraft[],
  globalDiscount = 0,
): { subtotal: number; discount: number; tax_amount: number; total: number } {
  const subtotal = items.reduce(
    (acc, it) => acc + Number(it.unit_price) * Number(it.quantity || 0),
    0,
  );
  const itemsDiscount = items.reduce(
    (acc, it) => acc + Number(it.discount || 0),
    0,
  );
  const taxAmount = items.reduce((acc, it) => {
    const base = Number(it.unit_price) * Number(it.quantity || 0);
    const net = Math.max(0, base - Number(it.discount || 0));
    return acc + (net * Number(it.tax_rate || 0)) / 100;
  }, 0);
  const discount = itemsDiscount + Number(globalDiscount || 0);
  const total = subtotal - discount + taxAmount;
  return {
    subtotal: Math.round(subtotal * 100) / 100,
    discount: Math.round(discount * 100) / 100,
    tax_amount: Math.round(taxAmount * 100) / 100,
    total: Math.round(total * 100) / 100,
  };
}

/**
 * Genera el siguiente numero de presupuesto. Intenta usar la RPC
 * `generate_budget_number`; si no esta disponible (p.ej. migracion aun no
 * aplicada o permisos), calcula en JS a partir del ultimo numero conocido.
 */
async function nextBudgetNumber(): Promise<string> {
  const rpc = await api.rpc<string>("generate_budget_number");
  if (!rpc.error && typeof rpc.data === "string" && rpc.data.length > 0) {
    return rpc.data;
  }

  // Fallback: buscar el ultimo numero del anio actual y sumar 1.
  const year = new Date().getFullYear();
  const prefix = `PRE-${year}-`;
  const { data } = await api
    .from<Budget>("budgets")
    .select("budget_number")
    .ilike("budget_number", `${prefix}%`)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const last = (data as { budget_number?: string } | null)?.budget_number;
  const lastNum = last ? parseInt(last.replace(prefix, ""), 10) || 0 : 0;
  return `${prefix}${String(lastNum + 1).padStart(4, "0")}`;
}

// ============ QUERIES ============

export function useBudgets(filters?: {
  patientId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}) {
  return useQuery({
    queryKey: ["budgets", filters],
    queryFn: async () => {
      let query = api
        .from<Budget>("budgets")
        .select(
          "*,patient:patients(id,first_name,last_name,document_number,phone,email)",
        )
        .order("issue_date", { ascending: false });

      if (filters?.patientId) query = query.eq("patient_id", filters.patientId);
      if (filters?.status) query = query.eq("status", filters.status);
      if (filters?.startDate) query = query.gte("issue_date", filters.startDate);
      if (filters?.endDate) query = query.lte("issue_date", filters.endDate);

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as Budget[];
    },
  });
}

export function useBudget(id: string | null) {
  return useQuery({
    queryKey: ["budget", id],
    queryFn: async () => {
      if (!id) return null;

      const { data: budget, error: budgetError } = await api
        .from<Budget>("budgets")
        .select(
          "*,patient:patients(id,first_name,last_name,document_number,phone,email)",
        )
        .eq("id", id)
        .single();

      if (budgetError) throw budgetError;

      const { data: items, error: itemsError } = await api
        .from<BudgetItem>("budget_items")
        .select("*,treatment:treatments(id,name,code)")
        .eq("budget_id", id);

      if (itemsError) throw itemsError;

      return { ...(budget as Budget), items: (items ?? []) as BudgetItem[] } as BudgetWithItems;
    },
    enabled: !!id,
  });
}

// ============ MUTATIONS ============

interface CreateBudgetPayload {
  patient_id: string;
  issue_date: string;
  valid_until?: string | null;
  notes?: string | null;
  discount?: number;
  status?: string;
  items: BudgetItemDraft[];
}

export function useCreateBudget() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (payload: CreateBudgetPayload) => {
      const budgetNumber = await nextBudgetNumber();
      const totals = computeBudgetTotals(payload.items, payload.discount ?? 0);

      // 1. Insert budget
      const { data: budget, error: budgetError } = await api
        .from<Budget>("budgets")
        .insert({
          budget_number: budgetNumber,
          patient_id: payload.patient_id,
          issue_date: payload.issue_date,
          valid_until: payload.valid_until ?? null,
          notes: payload.notes ?? null,
          subtotal: totals.subtotal,
          discount: totals.discount,
          tax_amount: totals.tax_amount,
          total: totals.total,
          status: payload.status ?? "draft",
          created_by: user?.id ?? null,
        })
        .select()
        .single();

      if (budgetError) throw budgetError;
      if (!budget) throw new Error("No se pudo crear el presupuesto");

      const budgetRow = budget as Budget;

      // 2. Bulk insert items
      if (payload.items.length > 0) {
        const itemsToInsert = payload.items.map((it) => ({
          budget_id: budgetRow.id,
          treatment_id: it.treatment_id ?? null,
          description: it.description,
          tooth_number: it.tooth_number ?? null,
          quantity: it.quantity,
          unit_price: it.unit_price,
          discount: it.discount ?? 0,
          tax_rate: it.tax_rate ?? 0,
          total: computeBudgetItemTotal(it),
        }));

        const { error: itemsError } = await api
          .from("budget_items")
          .insert(itemsToInsert);

        if (itemsError) throw itemsError;
      }

      return budgetRow;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      toast({
        title: "Presupuesto creado",
        description: "El presupuesto se ha registrado correctamente.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: (error as Error).message,
        variant: "destructive",
      });
    },
  });
}

interface UpdateBudgetPayload extends CreateBudgetPayload {
  id: string;
}

export function useUpdateBudget() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (payload: UpdateBudgetPayload) => {
      const totals = computeBudgetTotals(payload.items, payload.discount ?? 0);

      // 1. Update budget
      const { data: updated, error: updError } = await api
        .from<Budget>("budgets")
        .update({
          patient_id: payload.patient_id,
          issue_date: payload.issue_date,
          valid_until: payload.valid_until ?? null,
          notes: payload.notes ?? null,
          subtotal: totals.subtotal,
          discount: totals.discount,
          tax_amount: totals.tax_amount,
          total: totals.total,
          status: payload.status ?? "draft",
        })
        .eq("id", payload.id)
        .select()
        .single();

      if (updError) throw updError;

      // 2. Reemplazar items: delete + insert (simple y consistente).
      const { error: delError } = await api
        .from("budget_items")
        .delete()
        .eq("budget_id", payload.id);
      if (delError) throw delError;

      if (payload.items.length > 0) {
        const itemsToInsert = payload.items.map((it) => ({
          budget_id: payload.id,
          treatment_id: it.treatment_id ?? null,
          description: it.description,
          tooth_number: it.tooth_number ?? null,
          quantity: it.quantity,
          unit_price: it.unit_price,
          discount: it.discount ?? 0,
          tax_rate: it.tax_rate ?? 0,
          total: computeBudgetItemTotal(it),
        }));
        const { error: insError } = await api
          .from("budget_items")
          .insert(itemsToInsert);
        if (insError) throw insError;
      }

      return updated as Budget;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      queryClient.invalidateQueries({ queryKey: ["budget", variables.id] });
      toast({
        title: "Presupuesto actualizado",
        description: "Los cambios se han guardado.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: (error as Error).message,
        variant: "destructive",
      });
    },
  });
}

export function useUpdateBudgetStatus() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data, error } = await api
        .from<Budget>("budgets")
        .update({ status })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as Budget;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      queryClient.invalidateQueries({ queryKey: ["budget", variables.id] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: (error as Error).message,
        variant: "destructive",
      });
    },
  });
}

export function useDeleteBudget() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await api.from("budgets").delete().eq("id", id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      toast({
        title: "Presupuesto eliminado",
        description: "El presupuesto se ha eliminado correctamente.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: (error as Error).message,
        variant: "destructive",
      });
    },
  });
}

/**
 * Convierte un presupuesto en factura: crea invoice + invoice_items espejo,
 * setea budgets.status='converted' y guarda converted_invoice_id.
 */
export function useConvertBudgetToInvoice() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (budgetId: string) => {
      // 1. Cargar budget + items
      const { data: budget, error: bErr } = await api
        .from<Budget>("budgets")
        .select("*")
        .eq("id", budgetId)
        .single();
      if (bErr) throw bErr;
      if (!budget) throw new Error("Presupuesto no encontrado");

      const budgetRow = budget as Budget;

      if (budgetRow.status === "converted" && budgetRow.converted_invoice_id) {
        throw new Error("Este presupuesto ya ha sido convertido en factura");
      }

      const { data: items, error: iErr } = await api
        .from<BudgetItem>("budget_items")
        .select("*")
        .eq("budget_id", budgetId);
      if (iErr) throw iErr;

      const budgetItems = (items ?? []) as BudgetItem[];

      // 2. Generar numero de factura (siguiendo patron de useCreateInvoice).
      const { data: lastInvoice } = await api
        .from<{ invoice_number: string }>("invoices")
        .select("invoice_number")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const lastNum = (lastInvoice as { invoice_number?: string } | null)?.invoice_number
        ? parseInt(
            (lastInvoice as { invoice_number: string }).invoice_number.replace(/\D/g, ""),
            10,
          ) || 0
        : 0;
      const invoiceNumber = `FEV-${String(lastNum + 1).padStart(6, "0")}`;

      // 3. Crear invoice
      const { data: invoice, error: invErr } = await api
        .from<{ id: string }>("invoices")
        .insert({
          invoice_number: invoiceNumber,
          patient_id: budgetRow.patient_id,
          issue_date: new Date().toISOString().split("T")[0],
          subtotal: budgetRow.subtotal,
          discount: budgetRow.discount,
          tax_amount: budgetRow.tax_amount,
          total: budgetRow.total,
          status: "pending",
          notes: budgetRow.notes,
          created_by: user?.id ?? null,
        })
        .select()
        .single();

      if (invErr) throw invErr;
      if (!invoice) throw new Error("No se pudo crear la factura");

      const invoiceId = (invoice as { id: string }).id;

      // 4. Crear invoice_items espejo
      if (budgetItems.length > 0) {
        const { error: iiErr } = await api.from("invoice_items").insert(
          budgetItems.map((it) => ({
            invoice_id: invoiceId,
            treatment_id: it.treatment_id,
            description: it.description,
            tooth_number: it.tooth_number,
            quantity: it.quantity,
            unit_price: it.unit_price,
            discount: it.discount,
            tax_rate: it.tax_rate,
            total: it.total,
          })),
        );
        if (iiErr) throw iiErr;
      }

      // 5. Marcar budget como converted
      const { error: updErr } = await api
        .from("budgets")
        .update({
          status: "converted",
          converted_invoice_id: invoiceId,
        })
        .eq("id", budgetId);
      if (updErr) throw updErr;

      return { budgetId, invoiceId, invoiceNumber };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      queryClient.invalidateQueries({ queryKey: ["budget", result.budgetId] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast({
        title: "Presupuesto convertido",
        description: `Factura ${result.invoiceNumber} creada correctamente.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: (error as Error).message,
        variant: "destructive",
      });
    },
  });
}
