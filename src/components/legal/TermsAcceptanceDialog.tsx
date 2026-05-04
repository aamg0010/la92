import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  useCheckTermsAcceptance,
  useLegalDocument,
  useAcceptLegalDocument,
} from "@/hooks/useLegalAcceptance";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, Shield, CheckCircle2, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";

const MAX_SKIP_COUNT = 2;
const SKIP_STORAGE_KEY = "clinident_terms_skip_count";

const DOCUMENT_LABELS: Record<string, string> = {
  terms: "Términos",
  privacy: "Privacidad",
  rgpd: "RGPD",
  data_processing: "Tratamiento",
};

export function TermsAcceptanceDialog() {
  const { user } = useAuth();
  const { data: termsCheck, isLoading } = useCheckTermsAcceptance(user?.id);
  const [currentDocIndex, setCurrentDocIndex] = useState(0);
  const [acceptedDocs, setAcceptedDocs] = useState<Set<string>>(new Set());
  const [fullName, setFullName] = useState("");
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [acceptCheckbox, setAcceptCheckbox] = useState(false);
  const [isSkipped, setIsSkipped] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Skip count
  const getSkipCount = () => {
    try {
      return parseInt(localStorage.getItem(SKIP_STORAGE_KEY) || "0", 10);
    } catch {
      return 0;
    }
  };

  const [skipCount] = useState(getSkipCount);
  const canSkip = skipCount < MAX_SKIP_COUNT;
  const remainingSkips = MAX_SKIP_COUNT - skipCount;

  const pendingDocs = termsCheck?.pending_documents || [];
  const currentDoc = pendingDocs[currentDocIndex];
  const { data: documentContent, isLoading: loadingContent } = useLegalDocument(currentDoc?.id);
  const acceptMutation = useAcceptLegalDocument();

  const needsAcceptance = termsCheck?.needs_acceptance && pendingDocs.length > 0;
  const isOpen = needsAcceptance && !isSkipped;
  const isLastDoc = currentDocIndex === pendingDocs.length - 1;

  // Reset when changing documents
  useEffect(() => {
    setHasScrolledToBottom(false);
    setAcceptCheckbox(false);
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [currentDocIndex]);

  // Scroll handler
  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const isAtBottom = el.scrollHeight - el.scrollTop <= el.clientHeight + 50;
    if (isAtBottom) {
      setHasScrolledToBottom(true);
    }
  };

  // Scroll to bottom button
  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  };

  // Skip
  const handleSkip = () => {
    const newCount = skipCount + 1;
    localStorage.setItem(SKIP_STORAGE_KEY, String(newCount));
    setIsSkipped(true);
  };

  // Accept
  const handleAcceptDocument = async () => {
    if (!currentDoc || !fullName.trim() || !acceptCheckbox) return;

    try {
      await acceptMutation.mutateAsync({
        documentId: currentDoc.id,
        fullName: fullName.trim(),
      });

      setAcceptedDocs((prev) => new Set([...prev, currentDoc.id]));

      if (!isLastDoc) {
        setCurrentDocIndex((prev) => prev + 1);
        setAcceptCheckbox(false);
      }
    } catch (error) {
      console.error("Error accepting document:", error);
    }
  };

  // Validation - simplified
  const canAccept = hasScrolledToBottom && acceptCheckbox && fullName.trim().length > 2;

  if (isLoading || !isOpen) return null;

  return (
    <Dialog open={true}>
      <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] flex flex-col p-4 sm:p-6" hideCloseButton>
        <DialogHeader className="flex-shrink-0 pb-2">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Shield className="w-5 h-5 text-primary" />
            Documentos Legales
          </DialogTitle>
          <DialogDescription className="text-sm">
            Lea y acepte los documentos para continuar
          </DialogDescription>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex gap-1 flex-shrink-0 overflow-x-auto pb-2">
          {pendingDocs.map((doc, index) => {
            const isAccepted = acceptedDocs.has(doc.id);
            const isCurrent = index === currentDocIndex;
            return (
              <button
                key={doc.id}
                type="button"
                onClick={() => index <= currentDocIndex && setCurrentDocIndex(index)}
                disabled={index > currentDocIndex && !isAccepted}
                className={cn(
                  "flex items-center gap-1 px-3 py-1.5 rounded text-sm whitespace-nowrap transition-colors",
                  isCurrent && "bg-primary text-primary-foreground",
                  isAccepted && !isCurrent && "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400",
                  !isCurrent && !isAccepted && "bg-muted text-muted-foreground"
                )}
              >
                {isAccepted && <CheckCircle2 className="w-3 h-3" />}
                {DOCUMENT_LABELS[doc.document_type] || `Doc ${index + 1}`}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 flex flex-col gap-3">
          {loadingContent ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : documentContent ? (
            <>
              {/* Document scroll area */}
              <div className="relative flex-1 min-h-0">
                <div
                  ref={scrollRef}
                  onScroll={handleScroll}
                  className="h-full overflow-y-auto border rounded-lg p-3 bg-muted/20"
                  style={{ maxHeight: "280px" }}
                >
                  <h4 className="font-semibold mb-2">{documentContent.title}</h4>
                  <div className="prose prose-sm dark:prose-invert max-w-none text-sm">
                    <ReactMarkdown>{documentContent.content}</ReactMarkdown>
                  </div>
                </div>

                {/* Scroll indicator */}
                {!hasScrolledToBottom && (
                  <button
                    type="button"
                    onClick={scrollToBottom}
                    className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 px-3 py-1 bg-primary text-primary-foreground rounded-full text-xs shadow-lg animate-bounce"
                  >
                    <ChevronDown className="w-3 h-3" />
                    Desplazar abajo
                  </button>
                )}
              </div>

              {/* Acceptance form */}
              <div className="space-y-3 flex-shrink-0 border-t pt-3">
                <div>
                  <Label htmlFor="acceptFullName" className="text-sm">
                    Su nombre completo *
                  </Label>
                  <Input
                    id="acceptFullName"
                    name="acceptFullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Escriba su nombre"
                    className="mt-1"
                    autoComplete="name"
                  />
                </div>

                <div className="flex items-start gap-2">
                  <Checkbox
                    id="acceptTermsCheckbox"
                    name="acceptTermsCheckbox"
                    checked={acceptCheckbox}
                    onCheckedChange={(checked) => setAcceptCheckbox(checked === true)}
                    disabled={!hasScrolledToBottom}
                  />
                  <Label
                    htmlFor="acceptTermsCheckbox"
                    className={cn(
                      "text-sm cursor-pointer leading-tight",
                      !hasScrolledToBottom && "text-muted-foreground"
                    )}
                  >
                    He leído y acepto este documento
                  </Label>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Error cargando documento
            </div>
          )}
        </div>

        <DialogFooter className="flex-shrink-0 border-t pt-3 mt-2">
          <div className="flex items-center justify-between w-full gap-2">
            <span className="text-xs text-muted-foreground">
              {currentDocIndex + 1} de {pendingDocs.length}
            </span>
            <div className="flex gap-2">
              {canSkip && (
                <Button type="button" variant="ghost" size="sm" onClick={handleSkip}>
                  Más tarde ({remainingSkips})
                </Button>
              )}
              <Button
                type="button"
                size="sm"
                onClick={handleAcceptDocument}
                disabled={!canAccept || acceptMutation.isPending}
              >
                {acceptMutation.isPending && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                {isLastDoc ? "Aceptar y Entrar" : "Siguiente"}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
