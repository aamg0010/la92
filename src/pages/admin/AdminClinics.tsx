import { ClinicsPanel } from "@/components/admin/ClinicsPanel";

export default function AdminClinics() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Gestion de Clinicas</h1>
        <p className="text-slate-400">Administra las clinicas registradas en la plataforma</p>
      </div>

      {/* Clinics Panel - already has full functionality */}
      <div className="[&_.card]:bg-slate-800 [&_.card]:border-slate-700 [&_table]:text-slate-300 [&_th]:text-slate-400 [&_td]:text-slate-300">
        <ClinicsPanel />
      </div>
    </div>
  );
}
