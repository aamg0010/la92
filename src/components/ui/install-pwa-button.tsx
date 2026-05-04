import { useState, useEffect } from "react";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface InstallPWAButtonProps {
  variant?: "default" | "banner" | "sidebar";
}

export function InstallPWAButton({ variant = "default" }: InstallPWAButtonProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem("pwa-install-dismissed");
    if (dismissed) {
      setDismissed(true);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstallable(false);
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setIsInstallable(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    localStorage.setItem("pwa-install-dismissed", "true");
    setDismissed(true);
  };

  if (!isInstallable || dismissed) return null;

  if (variant === "banner") {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-primary text-primary-foreground lg:hidden">
        <div className="flex items-center justify-between gap-4 max-w-lg mx-auto">
          <div className="flex items-center gap-3">
            <Download className="w-5 h-5 flex-shrink-0" />
            <div>
              <p className="font-medium text-sm">Instalar Clinident</p>
              <p className="text-xs opacity-80">Acceso rápido desde tu pantalla</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={handleInstall}
            >
              Instalar
            </Button>
            <button
              onClick={handleDismiss}
              className="p-1 hover:bg-primary-foreground/10 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (variant === "sidebar") {
    return (
      <button
        onClick={handleInstall}
        className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-sidebar-accent transition-colors text-sidebar-foreground"
      >
        <Download className="w-5 h-5" />
        <span className="text-sm">Instalar App</span>
      </button>
    );
  }

  return (
    <Button onClick={handleInstall} variant="outline" size="sm">
      <Download className="w-4 h-4 mr-2" />
      Instalar App
    </Button>
  );
}
