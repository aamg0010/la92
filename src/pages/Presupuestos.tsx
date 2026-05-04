/**
 * Presupuestos.tsx
 * Listado de presupuestos con filtros, creacion y detalle.
 */

import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  FileText,
  Plus,
  Search,
  Loader2,
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  Receipt,
  ChevronsUpDown,
  Check,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useBudgets, BUDGET_STATUSES } from "@/hooks/useBudgets";
import { usePatients } from "@/hooks/usePatients";
import { useCurrency } from "@/hooks/useCurrency";
import { BudgetFormDialog } from "@/components/presupuestos/BudgetFormDialog";
import { BudgetDetailDialog } from "@/components/presupuestos/BudgetDetailDialog";

const STATUS_ICONS: Record<string, React.ElementType> = {
  draft: FileText,
  sent: Send,
  accepted: CheckCircle2,
  rejected: XCircle,
  expired: Clock,
  converted: Receipt,
};

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-primary/10 text-primary border border-primary/20",
  accepted: "bg-success/10 text-success border border-success/20",
  rejected: "bg-destructive/10 text-destructive border border-destructive/20",
  expired: "bg-warning/10 text-warning border border-warning/20",
  converted: "bg-accent/10 text-accent border border-accent/20",
};

const Presupuestos = () => {
  const { formatMoney } = useCurrency();

  // Filtros
  const [searchQuery, setSearchQuery] = useState("");
  const [patientFilter, setPatientFilter] = useState<string | null>(null);
  const [patientPickerOpen, setPatientPickerOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Dialog state
  const [formOpen, setFormOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedBudgetId, setSelectedBudgetId] = useState<string | null>(null);

  const { data: patients = [] } = usePatients();
  const { data: budgets = [], isLoading } = useBudgets({
    patientId: patientFilter ?? undefined,
    status: statusFilter === "all" ? undefined : statusFilter,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });

  const filteredBudgets = budgets.filter((b) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      b.budget_number.toLowerCase().includes(q) ||
      b.patient?.first_name?.toLowerCase().includes(q) ||
      b.patient?.last_name?.toLowerCase().includes(q) ||
      b.patient?.document_number?.toLowerCase().includes(q)
    );
  });

  const selectedPatient = patients.find((p) => p.id === patientFilter);

  const openDetail = (id: string) => {
    setSelectedBudgetId(id);
    setDetailOpen(true);
  };

  const clearFilters = () => {
    setPatientFilter(null);
    setStatusFilter("all");
    setStartDate("");
    setEndDate("");
  };

  return (
    <MainLayout>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl lg:text-4xl font-display font-bold text-foreground">
              Presupuestos
            </h1>
            <p className="text-muted-foreground mt-1">
              Planes de tratamiento con detalle y totales · Conversion a factura
            </p>
          </div>
          <Button
            className="bg-primary hover:bg-primary/90"
            onClick={() => setFormOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo presupuesto
          </Button>
        </div>

        {/* Filters */}
        <div className="card-elevated p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Search */}
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por numero, paciente o documento..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Patient */}
            <Popover open={patientPickerOpen} onOpenChange={setPatientPickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className={cn(
                    "justify-between",
                    !patientFilter && "text-muted-foreground",
                  )}
                >
                  {selectedPatient
                    ? `${selectedPatient.first_name} ${selectedPatient.last_name}`
                    : "Todos los pacientes"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[350px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Buscar paciente..." />
                  <CommandList>
                    <CommandEmpty>Sin resultados</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        value="__all__"
                        onSelect={() => {
                          setPatientFilter(null);
                          setPatientPickerOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            !patientFilter ? "opacity-100" : "opacity-0",
                          )}
                        />
                        Todos los pacientes
                      </CommandItem>
                      {patients.map((p) => (
                        <CommandItem
                          key={p.id}
                          value={`${p.first_name} ${p.last_name} ${p.document_number}`}
                          onSelect={() => {
                            setPatientFilter(p.id);
                            setPatientPickerOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              patientFilter === p.id ? "opacity-100" : "opacity-0",
                            )}
                          />
                          <div className="flex flex-col">
                            <span>
                              {p.first_name} {p.last_name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {p.document_number}
                            </span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            {/* Status */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                {BUDGET_STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Dates */}
            <div className="flex gap-2">
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                placeholder="Desde"
              />
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                placeholder="Hasta"
              />
            </div>
          </div>

          {(patientFilter || statusFilter !== "all" || startDate || endDate) && (
            <div className="flex justify-end">
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="w-4 h-4 mr-1" />
                Limpiar filtros
              </Button>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="card-elevated overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                      Numero
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                      Paciente
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                      Emitido
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                      Valido hasta
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                      Total
                    </th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">
                      Estado
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBudgets.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="text-center py-12 text-muted-foreground"
                      >
                        No hay presupuestos que coincidan con los filtros
                      </td>
                    </tr>
                  ) : (
                    filteredBudgets.map((b) => {
                      const StatusIcon = STATUS_ICONS[b.status] || FileText;
                      const statusInfo = BUDGET_STATUSES.find(
                        (s) => s.value === b.status,
                      );
                      return (
                        <tr
                          key={b.id}
                          className="border-b border-border/50 hover:bg-muted/30 transition-colors cursor-pointer"
                          onClick={() => openDetail(b.id)}
                        >
                          <td className="py-4 px-4">
                            <p className="font-mono font-medium text-foreground">
                              {b.budget_number}
                            </p>
                          </td>
                          <td className="py-4 px-4">
                            <p className="font-medium text-foreground">
                              {b.patient
                                ? `${b.patient.first_name} ${b.patient.last_name}`
                                : "-"}
                            </p>
                            {b.patient?.document_number && (
                              <p className="text-xs text-muted-foreground font-mono">
                                {b.patient.document_number}
                              </p>
                            )}
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-muted-foreground">
                              {format(new Date(b.issue_date), "dd/MM/yyyy", {
                                locale: es,
                              })}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-muted-foreground">
                              {b.valid_until
                                ? format(new Date(b.valid_until), "dd/MM/yyyy", {
                                    locale: es,
                                  })
                                : "-"}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <span className="font-semibold text-foreground">
                              {formatMoney(Number(b.total))}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <Badge
                              variant="outline"
                              className={cn(
                                "gap-1",
                                STATUS_STYLES[b.status] || STATUS_STYLES.draft,
                              )}
                            >
                              <StatusIcon className="w-3 h-3" />
                              {statusInfo?.label ?? b.status}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <BudgetFormDialog open={formOpen} onOpenChange={setFormOpen} />
      <BudgetDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        budgetId={selectedBudgetId}
      />
    </MainLayout>
  );
};

export default Presupuestos;
