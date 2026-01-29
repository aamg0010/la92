import { useState } from "react";
import { Sparkles, Send, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

const suggestions = [
  "¿Qué tratamiento recomiendas para sensibilidad dental?",
  "Genera un plan de tratamiento para caries profunda",
  "¿Cómo explicar un procedimiento de endodoncia al paciente?",
];

export function AIAssistantWidget() {
  const [message, setMessage] = useState("");

  return (
    <div className="relative overflow-hidden rounded-xl p-6 bg-gradient-to-br from-sidebar to-sidebar/90 border border-sidebar-border">
      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-primary/20 to-transparent rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-accent/20 to-transparent rounded-full blur-3xl" />
      
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-sidebar-primary-foreground" />
          </div>
          <div>
            <h3 className="font-display text-lg font-semibold text-sidebar-foreground">
              Asistente Dental IA
            </h3>
            <p className="text-sm text-sidebar-foreground/70">
              Tu copiloto inteligente para consultas
            </p>
          </div>
        </div>

        <div className="space-y-2 mb-4">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => setMessage(suggestion)}
              className="w-full text-left px-3 py-2 rounded-lg bg-sidebar-accent/50 hover:bg-sidebar-accent text-sm text-sidebar-foreground/90 hover:text-sidebar-foreground transition-colors truncate"
            >
              {suggestion}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Escribe tu consulta..."
            className="bg-sidebar-accent/50 border-sidebar-border text-sidebar-foreground placeholder:text-sidebar-foreground/50 focus:ring-primary"
          />
          <Button size="icon" className="bg-primary hover:bg-primary/90 shrink-0">
            <Send className="w-4 h-4" />
          </Button>
        </div>

        <Link 
          to="/asistente-ia"
          className="flex items-center justify-center gap-2 mt-4 text-sm text-primary hover:text-primary/80 transition-colors"
        >
          Abrir chat completo
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
