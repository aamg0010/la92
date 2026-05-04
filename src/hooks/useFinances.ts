import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/apiClient";

interface FinancialMetrics {
  totalRevenue: number;
  totalProcedures: number;
  patientsAttended: number;
  averageTicket: number;
  revenueChange: number;
  proceduresChange: number;
  patientsChange: number;
  ticketChange: number;
}

interface DoctorProductivity {
  doctorId: string;
  doctorName: string;
  procedures: number;
  revenue: number;
  efficiency: number;
}

interface ServiceBreakdown {
  category: string;
  revenue: number;
  percentage: number;
  count: number;
}

interface MonthlyRevenue {
  month: string;
  revenue: number;
  procedures: number;
}

interface Payment {
  amount: number;
  payment_date: string;
  invoice_id: string;
}

interface AppointmentBasic {
  id: string;
  patient_id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  doctor_id: string;
  status: string;
}

interface Profile {
  user_id: string;
  full_name: string;
}

interface Invoice {
  id: string;
  created_by: string;
  issue_date: string;
}

interface InvoiceItem {
  total: number;
  created_at: string;
  treatment?: { category: string } | null;
}

interface ClinicSettingsBasic {
  opening_time: string;
  closing_time: string;
  working_days: string[];
}

// ============ FINANCIAL METRICS ============

export function useFinancialMetrics(period: {
  startDate: string;
  endDate: string;
  previousStartDate?: string;
  previousEndDate?: string;
}) {
  return useQuery({
    queryKey: ["financial-metrics", period],
    queryFn: async (): Promise<FinancialMetrics> => {
      // Ingresos del periodo actual (pagos recibidos)
      const { data: currentPayments } = await api
        .from<Payment>("payments")
        .select("amount")
        .gte("payment_date", period.startDate)
        .lte("payment_date", period.endDate);

      // Procedimientos del periodo actual (citas completadas)
      const { data: currentAppointments } = await api
        .from<AppointmentBasic>("appointments")
        .select("id, patient_id")
        .gte("appointment_date", period.startDate)
        .lte("appointment_date", period.endDate)
        .eq("status", "completed");

      const totalRevenue = currentPayments?.reduce((acc, p) => acc + Number(p.amount), 0) || 0;
      const totalProcedures = currentAppointments?.length || 0;

      const uniquePatients = new Set(currentAppointments?.map((a) => a.patient_id));
      const patientsAttended = uniquePatients.size;

      const averageTicket = patientsAttended > 0 ? totalRevenue / patientsAttended : 0;

      // Calcular cambios vs periodo anterior
      let revenueChange = 0;
      let proceduresChange = 0;
      let patientsChange = 0;
      let ticketChange = 0;

      if (period.previousStartDate && period.previousEndDate) {
        const { data: previousPayments } = await api
          .from<Payment>("payments")
          .select("amount")
          .gte("payment_date", period.previousStartDate)
          .lte("payment_date", period.previousEndDate);

        const { data: previousAppointments } = await api
          .from<AppointmentBasic>("appointments")
          .select("id, patient_id")
          .gte("appointment_date", period.previousStartDate)
          .lte("appointment_date", period.previousEndDate)
          .eq("status", "completed");

        const prevRevenue = previousPayments?.reduce((acc, p) => acc + Number(p.amount), 0) || 0;
        const prevProcedures = previousAppointments?.length || 0;
        const prevPatients = new Set(previousAppointments?.map((a) => a.patient_id)).size;
        const prevTicket = prevPatients > 0 ? prevRevenue / prevPatients : 0;

        revenueChange = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0;
        proceduresChange = prevProcedures > 0 ? ((totalProcedures - prevProcedures) / prevProcedures) * 100 : 0;
        patientsChange = prevPatients > 0 ? ((patientsAttended - prevPatients) / prevPatients) * 100 : 0;
        ticketChange = prevTicket > 0 ? ((averageTicket - prevTicket) / prevTicket) * 100 : 0;
      }

      return {
        totalRevenue,
        totalProcedures,
        patientsAttended,
        averageTicket,
        revenueChange: Math.round(revenueChange),
        proceduresChange: Math.round(proceduresChange),
        patientsChange: Math.round(patientsChange),
        ticketChange: Math.round(ticketChange),
      };
    },
  });
}

// ============ DOCTOR PRODUCTIVITY ============

export function useDoctorProductivity(period: { startDate: string; endDate: string }) {
  return useQuery({
    queryKey: ["doctor-productivity", period],
    queryFn: async (): Promise<DoctorProductivity[]> => {
      // Obtener citas completadas por doctor
      const { data: appointments } = await api
        .from<AppointmentBasic>("appointments")
        .select("doctor_id, id")
        .gte("appointment_date", period.startDate)
        .lte("appointment_date", period.endDate)
        .eq("status", "completed");

      // Obtener perfiles de doctores
      const { data: profiles } = await api
        .from<Profile>("profiles")
        .select("user_id, full_name");

      // Obtener pagos del periodo
      const { data: payments } = await api
        .from<Payment>("payments")
        .select("amount, invoice_id")
        .gte("payment_date", period.startDate)
        .lte("payment_date", period.endDate);

      // Obtener facturas para mapear con citas
      const { data: invoices } = await api
        .from<Invoice>("invoices")
        .select("id, created_by")
        .gte("issue_date", period.startDate)
        .lte("issue_date", period.endDate);

      const profileMap: Record<string, string> = {};
      profiles?.forEach((p) => {
        profileMap[p.user_id] = p.full_name;
      });

      // Ingresos por doctor (basado en quien creó la factura)
      const revenueByDoctor: Record<string, number> = {};
      const invoiceCreatorMap: Record<string, string> = {};

      invoices?.forEach((inv) => {
        if (inv.created_by) {
          invoiceCreatorMap[inv.id] = inv.created_by;
        }
      });

      payments?.forEach((p) => {
        const creator = invoiceCreatorMap[p.invoice_id];
        if (creator) {
          revenueByDoctor[creator] = (revenueByDoctor[creator] || 0) + Number(p.amount);
        }
      });

      // Procedimientos por doctor
      const proceduresByDoctor: Record<string, number> = {};
      appointments?.forEach((a) => {
        proceduresByDoctor[a.doctor_id] = (proceduresByDoctor[a.doctor_id] || 0) + 1;
      });

      // Calcular productividad
      const doctorIds = new Set([
        ...Object.keys(proceduresByDoctor),
        ...Object.keys(revenueByDoctor),
      ]);

      const productivity: DoctorProductivity[] = [];

      doctorIds.forEach((doctorId) => {
        const procedures = proceduresByDoctor[doctorId] || 0;
        const revenue = revenueByDoctor[doctorId] || 0;

        // Eficiencia basada en procedimientos vs promedio
        const avgProcedures = appointments?.length ? appointments.length / doctorIds.size : 0;
        const efficiency = avgProcedures > 0 ? Math.min(100, Math.round((procedures / avgProcedures) * 85)) : 0;

        productivity.push({
          doctorId,
          doctorName: profileMap[doctorId] || "Doctor Desconocido",
          procedures,
          revenue,
          efficiency,
        });
      });

      return productivity.sort((a, b) => b.revenue - a.revenue);
    },
  });
}

// ============ SERVICE BREAKDOWN ============

export function useServiceBreakdown(period: { startDate: string; endDate: string }) {
  return useQuery({
    queryKey: ["service-breakdown", period],
    queryFn: async (): Promise<ServiceBreakdown[]> => {
      // Obtener items de facturas con tratamientos
      const { data: items } = await api
        .from<InvoiceItem>("invoice_items")
        .select("total,treatment:treatments(category)")
        .gte("created_at", period.startDate)
        .lte("created_at", period.endDate);

      const byCategory: Record<string, { revenue: number; count: number }> = {};
      let total = 0;

      items?.forEach((item) => {
        const category = item.treatment?.category || "Otros";
        if (!byCategory[category]) {
          byCategory[category] = { revenue: 0, count: 0 };
        }
        byCategory[category].revenue += Number(item.total);
        byCategory[category].count += 1;
        total += Number(item.total);
      });

      const breakdown: ServiceBreakdown[] = Object.entries(byCategory)
        .map(([category, data]) => ({
          category,
          revenue: data.revenue,
          percentage: total > 0 ? Math.round((data.revenue / total) * 100) : 0,
          count: data.count,
        }))
        .sort((a, b) => b.revenue - a.revenue);

      return breakdown;
    },
  });
}

// ============ MONTHLY REVENUE TREND ============

export function useMonthlyRevenue(year: number) {
  return useQuery({
    queryKey: ["monthly-revenue", year],
    queryFn: async (): Promise<MonthlyRevenue[]> => {
      const startDate = `${year}-01-01`;
      const endDate = `${year}-12-31`;

      const { data: payments } = await api
        .from<Payment>("payments")
        .select("amount, payment_date")
        .gte("payment_date", startDate)
        .lte("payment_date", endDate);

      const { data: appointments } = await api
        .from<AppointmentBasic>("appointments")
        .select("id, appointment_date")
        .gte("appointment_date", startDate)
        .lte("appointment_date", endDate)
        .eq("status", "completed");

      const monthlyData: Record<string, { revenue: number; procedures: number }> = {};

      // Inicializar todos los meses
      const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
      months.forEach((_, i) => {
        monthlyData[String(i + 1).padStart(2, "0")] = { revenue: 0, procedures: 0 };
      });

      payments?.forEach((p) => {
        const month = p.payment_date.substring(5, 7);
        if (monthlyData[month]) {
          monthlyData[month].revenue += Number(p.amount);
        }
      });

      appointments?.forEach((a) => {
        const month = a.appointment_date.substring(5, 7);
        if (monthlyData[month]) {
          monthlyData[month].procedures += 1;
        }
      });

      return Object.entries(monthlyData).map(([_, data], index) => ({
        month: months[index],
        revenue: data.revenue,
        procedures: data.procedures,
      }));
    },
  });
}

// ============ QUICK STATS ============

export function useQuickStats(period: { startDate: string; endDate: string }) {
  return useQuery({
    queryKey: ["quick-stats", period],
    queryFn: async () => {
      // Tiempo promedio por cita
      const { data: appointments } = await api
        .from<AppointmentBasic>("appointments")
        .select("start_time, end_time")
        .gte("appointment_date", period.startDate)
        .lte("appointment_date", period.endDate)
        .eq("status", "completed");

      let totalMinutes = 0;
      appointments?.forEach((a) => {
        const start = new Date(`1970-01-01T${a.start_time}`);
        const end = new Date(`1970-01-01T${a.end_time}`);
        totalMinutes += (end.getTime() - start.getTime()) / 60000;
      });
      const avgAppointmentMinutes = appointments?.length ? Math.round(totalMinutes / appointments.length) : 0;

      // Tasa de ocupación (citas completadas / slots disponibles)
      const { data: clinicSettings } = await api
        .from<ClinicSettingsBasic>("clinic_settings")
        .select("opening_time, closing_time, working_days")
        .single();

      const workingDays = clinicSettings?.working_days?.length || 5;
      const daysInPeriod = Math.ceil(
        (new Date(period.endDate).getTime() - new Date(period.startDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      const workingDaysInPeriod = Math.ceil((daysInPeriod * workingDays) / 7);
      const totalSlots = workingDaysInPeriod * 16; // 16 slots de 30 min por día
      const occupancyRate = totalSlots > 0 ? Math.min(100, Math.round(((appointments?.length || 0) / totalSlots) * 100)) : 0;

      // Pacientes recurrentes
      const { data: allPatientAppointments } = await api
        .from<AppointmentBasic>("appointments")
        .select("patient_id")
        .eq("status", "completed");

      const patientCounts: Record<string, number> = {};
      allPatientAppointments?.forEach((a) => {
        patientCounts[a.patient_id] = (patientCounts[a.patient_id] || 0) + 1;
      });

      const totalPatients = Object.keys(patientCounts).length;
      const recurringPatients = Object.values(patientCounts).filter((c) => c > 1).length;
      const recurringRate = totalPatients > 0 ? Math.round((recurringPatients / totalPatients) * 100) : 0;

      return {
        avgAppointmentMinutes,
        occupancyRate,
        recurringRate,
      };
    },
  });
}

// ============ HELPER: GET PERIOD DATES ============

export function getPeriodDates(period: "today" | "week" | "month" | "year" | "custom") {
  const now = new Date();
  const today = now.toISOString().split("T")[0];

  switch (period) {
    case "today":
      return { startDate: today, endDate: today };
    case "week":
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay());
      return {
        startDate: weekStart.toISOString().split("T")[0],
        endDate: today,
      };
    case "month":
      return {
        startDate: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`,
        endDate: today,
      };
    case "year":
      return {
        startDate: `${now.getFullYear()}-01-01`,
        endDate: today,
      };
    default:
      return { startDate: today, endDate: today };
  }
}

export function getPreviousPeriodDates(startDate: string, endDate: string) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diff = end.getTime() - start.getTime();

  const prevEnd = new Date(start.getTime() - 1);
  const prevStart = new Date(prevEnd.getTime() - diff);

  return {
    previousStartDate: prevStart.toISOString().split("T")[0],
    previousEndDate: prevEnd.toISOString().split("T")[0],
  };
}
