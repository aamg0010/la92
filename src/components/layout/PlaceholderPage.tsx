import { MainLayout } from "@/components/layout/MainLayout";
import { Construction } from "lucide-react";

interface PlaceholderPageProps {
  title: string;
}

export function PlaceholderPage({ title }: PlaceholderPageProps) {
  return (
    <MainLayout>
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] p-8">
        <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center mb-6">
          <Construction className="w-10 h-10 text-muted-foreground" />
        </div>
        <h1 className="text-3xl font-display font-bold text-foreground mb-2">
          {title}
        </h1>
        <p className="text-muted-foreground text-center max-w-md">
          Esta sección está en desarrollo. Próximamente tendrás acceso a todas las funcionalidades.
        </p>
      </div>
    </MainLayout>
  );
}
