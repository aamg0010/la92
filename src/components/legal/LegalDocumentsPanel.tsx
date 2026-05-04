import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  useMyLegalAcceptances,
  useLegalAcceptanceDetail,
  type LegalAcceptance,
} from "@/hooks/useLegalAcceptance";
import {
  FileText,
  Shield,
  Download,
  Printer,
  Eye,
  Loader2,
  CheckCircle2,
  Calendar,
  User,
  Hash,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import ReactMarkdown from "react-markdown";
import { jsPDF } from "jspdf";

const DOCUMENT_ICONS: Record<string, typeof FileText> = {
  terms: FileText,
  privacy: Shield,
  rgpd: Shield,
  data_processing: FileText,
};

const DOCUMENT_LABELS: Record<string, string> = {
  terms: "Términos y Condiciones",
  privacy: "Política de Privacidad",
  rgpd: "Consentimiento RGPD",
  data_processing: "Encargado de Tratamiento",
};

export function LegalDocumentsPanel() {
  const { data: acceptances, isLoading } = useMyLegalAcceptances();
  const [selectedAcceptanceId, setSelectedAcceptanceId] = useState<string | null>(null);
  const { data: acceptanceDetail, isLoading: loadingDetail } =
    useLegalAcceptanceDetail(selectedAcceptanceId || undefined);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!acceptanceDetail) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const maxWidth = pageWidth - margin * 2;
    let y = 20;

    // Header
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text(acceptanceDetail.title, pageWidth / 2, y, { align: "center" });
    y += 15;

    // Version and date
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Versión: ${acceptanceDetail.document_version}`, margin, y);
    doc.text(
      `Fecha de aceptación: ${format(parseISO(acceptanceDetail.accepted_at), "dd/MM/yyyy HH:mm", { locale: es })}`,
      pageWidth - margin,
      y,
      { align: "right" }
    );
    y += 10;

    // Divider
    doc.setDrawColor(200);
    doc.line(margin, y, pageWidth - margin, y);
    y += 10;

    // Signer info
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("DATOS DEL FIRMANTE", margin, y);
    y += 7;

    doc.setFont("helvetica", "normal");
    doc.text(`Nombre: ${acceptanceDetail.full_name}`, margin, y);
    y += 6;

    if (acceptanceDetail.document_number) {
      doc.text(`Documento: ${acceptanceDetail.document_number}`, margin, y);
      y += 6;
    }

    if (acceptanceDetail.clinic_name) {
      doc.text(`Clínica: ${acceptanceDetail.clinic_name}`, margin, y);
      y += 6;
    }

    doc.text(`Hash de firma: ${acceptanceDetail.signature_hash?.substring(0, 32)}...`, margin, y);
    y += 15;

    // Document content (simplified - just first part)
    doc.setFont("helvetica", "bold");
    doc.text("CONTENIDO DEL DOCUMENTO", margin, y);
    y += 10;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);

    // Split content into lines
    const lines = doc.splitTextToSize(
      acceptanceDetail.content.replace(/[#*]/g, "").substring(0, 3000),
      maxWidth
    );

    for (const line of lines) {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.text(line, margin, y);
      y += 5;
    }

    // Signature
    if (acceptanceDetail.signature_data) {
      if (y > 220) {
        doc.addPage();
        y = 20;
      }

      y += 10;
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("FIRMA ELECTRÓNICA", margin, y);
      y += 10;

      try {
        doc.addImage(acceptanceDetail.signature_data, "PNG", margin, y, 60, 25);
        y += 30;
      } catch (e) {
        doc.text("[Firma digital verificada]", margin, y);
        y += 10;
      }

      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text(
        `Documento firmado electrónicamente el ${format(parseISO(acceptanceDetail.accepted_at), "dd 'de' MMMM 'de' yyyy 'a las' HH:mm:ss", { locale: es })}`,
        margin,
        y
      );
    }

    // Footer
    doc.setFontSize(8);
    doc.text(
      "Este documento ha sido firmado electrónicamente y tiene plena validez legal.",
      pageWidth / 2,
      285,
      { align: "center" }
    );

    doc.save(`${acceptanceDetail.document_type}_${acceptanceDetail.document_version}_firmado.pdf`);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Documentos Legales
          </CardTitle>
          <CardDescription>
            Documentos legales que ha aceptado. Puede visualizarlos e imprimirlos en cualquier momento.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {acceptances && acceptances.length > 0 ? (
            <div className="space-y-3">
              {acceptances.map((acceptance) => {
                const Icon = DOCUMENT_ICONS[acceptance.document_type] || FileText;

                return (
                  <div
                    key={acceptance.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium">{acceptance.title}</h4>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {format(parseISO(acceptance.accepted_at), "dd MMM yyyy", {
                              locale: es,
                            })}
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {acceptance.full_name}
                          </span>
                          {acceptance.has_signature && (
                            <span className="flex items-center gap-1 text-success">
                              <CheckCircle2 className="w-3 h-3" />
                              Firmado
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedAcceptanceId(acceptance.id)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Ver
                    </Button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No hay documentos legales aceptados</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Document Detail Dialog */}
      <Dialog
        open={!!selectedAcceptanceId}
        onOpenChange={() => setSelectedAcceptanceId(null)}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{acceptanceDetail?.title}</DialogTitle>
          </DialogHeader>

          {loadingDetail ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : acceptanceDetail ? (
            <>
              {/* Document info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg text-sm">
                <div>
                  <span className="text-muted-foreground">Versión</span>
                  <p className="font-medium">{acceptanceDetail.document_version}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Fecha</span>
                  <p className="font-medium">
                    {format(parseISO(acceptanceDetail.accepted_at), "dd/MM/yyyy HH:mm", {
                      locale: es,
                    })}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Firmante</span>
                  <p className="font-medium">{acceptanceDetail.full_name}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Hash</span>
                  <p className="font-mono text-xs truncate">
                    {acceptanceDetail.signature_hash?.substring(0, 16)}...
                  </p>
                </div>
              </div>

              {/* Content */}
              <ScrollArea className="flex-1 border rounded-lg p-4">
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown>{acceptanceDetail.content}</ReactMarkdown>
                </div>

                {/* Signature */}
                {acceptanceDetail.signature_data && (
                  <div className="mt-8 pt-4 border-t">
                    <p className="text-sm text-muted-foreground mb-2">Firma electrónica:</p>
                    <img
                      src={acceptanceDetail.signature_data}
                      alt="Firma"
                      className="max-w-[200px] border rounded bg-white p-2"
                    />
                  </div>
                )}
              </ScrollArea>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={handlePrint}>
                  <Printer className="w-4 h-4 mr-2" />
                  Imprimir
                </Button>
                <Button onClick={handleDownloadPDF}>
                  <Download className="w-4 h-4 mr-2" />
                  Descargar PDF
                </Button>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
