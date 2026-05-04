import { ReactNode, useState } from "react";
import { Sidebar } from "./Sidebar";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { ChatWidget } from "@/components/chat/ChatWidget";
import { InstallPWAButton } from "@/components/ui/install-pwa-button";
import { TermsAcceptanceDialog } from "@/components/legal/TermsAcceptanceDialog";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "lg:block",
        isMobileMenuOpen ? "block" : "hidden"
      )}>
        <Sidebar onClose={() => setIsMobileMenuOpen(false)} />
      </div>

      {/* Top bar with notifications */}
      <div className="fixed top-0 left-0 right-0 z-20 lg:left-20 xl:left-64 h-16 flex items-center justify-between px-4 lg:px-6 bg-background/80 backdrop-blur-sm border-b border-border">
        {/* Hamburger menu for mobile */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={() => setIsMobileMenuOpen(true)}
        >
          <Menu className="w-5 h-5" />
        </Button>
        <div className="flex-1" />
        <NotificationBell />
      </div>

      <main className="transition-all duration-300 ml-0 lg:ml-20 xl:ml-64 min-h-screen pt-16">
        {children}
      </main>

      {/* Chat Widget */}
      <ChatWidget />

      {/* PWA Install Banner (mobile only) */}
      <InstallPWAButton variant="banner" />

      {/* Terms Acceptance Dialog */}
      <TermsAcceptanceDialog />
    </div>
  );
}
