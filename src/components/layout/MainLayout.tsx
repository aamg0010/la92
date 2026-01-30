import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { NotificationBell } from "@/components/notifications/NotificationBell";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      
      {/* Top bar with notifications */}
      <div className="fixed top-0 right-0 z-30 ml-20 lg:ml-64 h-16 flex items-center justify-end px-6 bg-background/80 backdrop-blur-sm border-b border-border">
        <NotificationBell />
      </div>
      
      <main className="transition-all duration-300 ml-20 lg:ml-64 min-h-screen pt-16">
        {children}
      </main>
    </div>
  );
}
