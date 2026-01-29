import { useState, useRef, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Send,
  Sparkles,
  Bot,
  User,
  Lightbulb,
  FileText,
  Stethoscope,
  Pill,
  Settings,
  RotateCcw,
  Copy,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const suggestedQuestions = [
  {
    icon: Stethoscope,
    title: "Diagnóstico",
    question: "¿Cuál es el protocolo de diagnóstico para un paciente con dolor dental agudo?",
  },
  {
    icon: Pill,
    title: "Medicación",
    question: "¿Qué antibiótico recomiendas para una infección dental en adultos?",
  },
  {
    icon: FileText,
    title: "Tratamiento",
    question: "Genera un plan de tratamiento para caries de tercer grado",
  },
  {
    icon: Lightbulb,
    title: "Explicación",
    question: "¿Cómo explicarle a un paciente qué es una endodoncia?",
  },
];

const initialMessages: Message[] = [
  {
    id: "1",
    role: "assistant",
    content: "¡Hola! Soy tu asistente dental con inteligencia artificial. Estoy aquí para ayudarte con:\n\n• **Diagnósticos** y recomendaciones clínicas\n• **Planes de tratamiento** personalizados\n• **Información** sobre procedimientos y medicamentos\n• **Comunicación** con pacientes\n\n¿En qué puedo ayudarte hoy?",
    timestamp: new Date(),
  },
];

const AsistenteIA = () => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (text?: string) => {
    const messageText = text || inputValue;
    if (!messageText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: messageText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: generateMockResponse(messageText),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const generateMockResponse = (question: string): string => {
    if (question.toLowerCase().includes("antibiótico") || question.toLowerCase().includes("infección")) {
      return `Para una **infección dental en adultos**, las opciones más comunes son:\n\n### Primera línea:\n- **Amoxicilina** 500mg cada 8 horas por 7 días\n- En caso de alergia a penicilinas: **Clindamicina** 300mg cada 8 horas\n\n### Casos severos:\n- **Amoxicilina + Ácido Clavulánico** 875/125mg cada 12 horas\n\n### Consideraciones:\n1. Siempre evaluar alergias del paciente\n2. Considerar función renal y hepática\n3. En embarazadas, la amoxicilina es segura\n\n⚠️ *Recuerda: Esta es una guía general. El tratamiento debe individualizarse según el caso clínico.*`;
    }
    
    if (question.toLowerCase().includes("endodoncia")) {
      return `Para explicar una **endodoncia** a tu paciente de forma clara:\n\n### Explicación sencilla:\n*"Una endodoncia es un procedimiento que nos permite salvar tu diente cuando la parte interna (el nervio) está dañada o infectada. En lugar de extraerlo, limpiamos cuidadosamente el interior, lo desinfectamos y lo sellamos."*\n\n### Puntos clave a mencionar:\n1. ✓ Es un procedimiento para **salvar** el diente\n2. ✓ Se realiza con **anestesia local** (no duele)\n3. ✓ Dura entre 1-2 sesiones generalmente\n4. ✓ El diente queda funcional después\n\n### Analogía útil:\n*"Imagina que tu diente es como una botella. Si algo malo entra, tenemos que vaciarla, limpiarla muy bien, y luego sellarla para que nada malo vuelva a entrar."*`;
    }

    if (question.toLowerCase().includes("dolor") || question.toLowerCase().includes("agudo")) {
      return `### Protocolo de Diagnóstico - Dolor Dental Agudo\n\n**1. Anamnesis detallada:**\n- Localización y irradiación del dolor\n- Duración e intensidad (escala 1-10)\n- Factores desencadenantes (frío, calor, presión)\n- Historia dental previa\n\n**2. Examen clínico:**\n- Inspección visual\n- Percusión vertical y horizontal\n- Pruebas de vitalidad (frío/calor)\n- Palpación periapical\n- Sondeo periodontal\n\n**3. Radiografía:**\n- Periapical de la zona afectada\n- Bitewing si se sospecha caries interproximal\n\n**4. Diagnóstico diferencial:**\n- Pulpitis reversible vs irreversible\n- Periodontitis apical\n- Fractura dental\n- Síndrome de diente fisurado`;
    }

    return `Gracias por tu consulta. Basándome en la información proporcionada, aquí tienes mi análisis:\n\n### Recomendaciones:\n1. Es importante realizar una evaluación clínica completa\n2. Considerar estudios radiográficos complementarios\n3. Documentar hallazgos en la historia clínica\n\n### Próximos pasos:\n- Evaluar el caso individualmente\n- Considerar opciones de tratamiento\n- Explicar al paciente las alternativas\n\n¿Te gustaría que profundice en algún aspecto específico?`;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <MainLayout>
      <div className="p-6 lg:p-8 h-[calc(100vh-2rem)]">
        <div className="flex gap-6 h-full">
          {/* Chat Area */}
          <div className="flex-1 flex flex-col card-elevated overflow-hidden">
            {/* Header */}
            <div className="p-4 lg:p-6 border-b border-border flex items-center justify-between bg-gradient-to-r from-primary/5 to-accent/5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-xl font-display font-bold text-foreground">
                    Asistente Dental IA
                  </h1>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                    Conectado y listo para ayudar
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Nueva conversación
                </Button>
                <Button variant="outline" size="icon">
                  <Settings className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6 scrollbar-thin">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-3 animate-slide-up",
                    message.role === "user" && "justify-end"
                  )}
                >
                  {message.role === "assistant" && (
                    <Avatar className="w-8 h-8 shrink-0">
                      <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground">
                        <Bot className="w-4 h-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}

                  <div className={cn("max-w-[80%] space-y-2", message.role === "user" && "items-end")}>
                    <div
                      className={cn(
                        message.role === "assistant"
                          ? "chat-bubble-ai"
                          : "chat-bubble-user"
                      )}
                    >
                      <div 
                        className="prose prose-sm max-w-none dark:prose-invert"
                        dangerouslySetInnerHTML={{ 
                          __html: message.content
                            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                            .replace(/\*(.*?)\*/g, '<em>$1</em>')
                            .replace(/###\s(.*)/g, '<h4 class="font-semibold text-foreground mt-3 mb-2">$1</h4>')
                            .replace(/\n/g, '<br />')
                            .replace(/- (.*?)(<br \/>|$)/g, '<li class="ml-4">$1</li>')
                            .replace(/\d\.\s(.*?)(<br \/>|$)/g, '<li class="ml-4 list-decimal">$1</li>')
                        }}
                      />
                    </div>
                    <div className={cn(
                      "flex items-center gap-2 text-xs text-muted-foreground",
                      message.role === "user" && "justify-end"
                    )}>
                      <span>{formatTime(message.timestamp)}</span>
                      {message.role === "assistant" && (
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="w-6 h-6">
                            <Copy className="w-3 h-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="w-6 h-6">
                            <ThumbsUp className="w-3 h-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="w-6 h-6">
                            <ThumbsDown className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {message.role === "user" && (
                    <Avatar className="w-8 h-8 shrink-0">
                      <AvatarImage src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150" />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        <User className="w-4 h-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}

              {isTyping && (
                <div className="flex gap-3 animate-slide-up">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground">
                      <Bot className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="chat-bubble-ai flex items-center gap-2">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span className="text-sm text-muted-foreground">Escribiendo...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="p-4 lg:p-6 border-t border-border bg-muted/30">
              <div className="flex gap-3">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Escribe tu consulta médica..."
                  className="flex-1 bg-card"
                />
                <Button 
                  onClick={() => handleSend()}
                  disabled={!inputValue.trim() || isTyping}
                  className="bg-primary hover:bg-primary/90"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                IA entrenada con conocimientos dentales. Siempre verifica la información clínicamente.
              </p>
            </div>
          </div>

          {/* Sidebar - Suggestions */}
          <div className="hidden xl:flex w-80 flex-col gap-4">
            <div className="card-elevated p-4">
              <h3 className="font-display text-lg font-semibold text-foreground mb-4">
                Consultas Sugeridas
              </h3>
              <div className="space-y-2">
                {suggestedQuestions.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={index}
                      onClick={() => handleSend(item.question)}
                      className="w-full text-left p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                          <Icon className="w-4 h-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground">{item.title}</p>
                          <p className="text-xs text-muted-foreground truncate">{item.question}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="card-elevated p-4 flex-1">
              <h3 className="font-display text-lg font-semibold text-foreground mb-4">
                Capacidades IA
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-success/20 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-success text-xs">✓</span>
                  </div>
                  <p className="text-muted-foreground">Diagnósticos y recomendaciones clínicas</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-success/20 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-success text-xs">✓</span>
                  </div>
                  <p className="text-muted-foreground">Planes de tratamiento personalizados</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-success/20 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-success text-xs">✓</span>
                  </div>
                  <p className="text-muted-foreground">Información sobre medicamentos</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-success/20 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-success text-xs">✓</span>
                  </div>
                  <p className="text-muted-foreground">Explicaciones para pacientes</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-success/20 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-success text-xs">✓</span>
                  </div>
                  <p className="text-muted-foreground">Códigos CIE-10 y nomenclatura</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default AsistenteIA;
