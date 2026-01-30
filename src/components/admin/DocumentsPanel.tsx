import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  FileText,
  Download,
  Trash2,
  Plus,
  Loader2,
  User,
  Scale,
  File,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import {
  useClinicDocuments,
  useDeleteClinicDocument,
  useDownloadClinicDocument,
  type ClinicDocument,
  type DocumentCategory,
} from "@/hooks/useClinicDocuments";
import { DocumentUploadDialog } from "./DocumentUploadDialog";

const CATEGORY_CONFIG: Record<DocumentCategory, { label: string; icon: typeof FileText; color: string }> = {
  legal: { label: "Legal", icon: Scale, color: "bg-primary/10 text-primary" },
  cv: { label: "Currículum", icon: User, color: "bg-accent/10 text-accent" },
  other: { label: "Otro", icon: File, color: "bg-muted text-muted-foreground" },
};

function formatFileSize(bytes: number | null): string {
  if (!bytes) return "—";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

interface DocumentTableProps {
  documents: ClinicDocument[];
  isLoading: boolean;
  onDownload: (doc: ClinicDocument) => void;
  onDelete: (doc: ClinicDocument) => void;
  downloading: string | null;
  category: DocumentCategory;
}

function DocumentTable({
  documents,
  isLoading,
  onDownload,
  onDelete,
  downloading,
  category,
}: DocumentTableProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (documents.length === 0) {
    const config = CATEGORY_CONFIG[category];
    const Icon = config.icon;
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Icon className="w-12 h-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">No hay documentos en esta categoría</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Documento</TableHead>
          {category === "cv" && <TableHead>Empleado</TableHead>}
          <TableHead>Tamaño</TableHead>
          <TableHead>Fecha</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {documents.map((doc) => (
          <TableRow key={doc.id}>
            <TableCell>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium">{doc.name}</p>
                  {doc.description && (
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {doc.description}
                    </p>
                  )}
                </div>
              </div>
            </TableCell>
            {category === "cv" && (
              <TableCell>
                <span className="text-sm">{doc.user_name || "—"}</span>
              </TableCell>
            )}
            <TableCell>
              <span className="text-sm text-muted-foreground">
                {formatFileSize(doc.file_size)}
              </span>
            </TableCell>
            <TableCell>
              <span className="text-sm text-muted-foreground">
                {format(parseISO(doc.created_at), "d MMM yyyy", { locale: es })}
              </span>
            </TableCell>
            <TableCell className="text-right">
              <div className="flex items-center justify-end gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => onDownload(doc)}
                  disabled={downloading === doc.id}
                >
                  {downloading === doc.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Eliminar documento?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acción eliminará permanentemente "{doc.name}" del sistema.
                        Esta acción no se puede deshacer.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => onDelete(doc)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Eliminar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function DocumentsPanel() {
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadCategory, setUploadCategory] = useState<DocumentCategory>("legal");
  const [downloading, setDownloading] = useState<string | null>(null);

  const { data: legalDocs, isLoading: loadingLegal } = useClinicDocuments("legal");
  const { data: cvDocs, isLoading: loadingCV } = useClinicDocuments("cv");
  const { data: otherDocs, isLoading: loadingOther } = useClinicDocuments("other");

  const deleteMutation = useDeleteClinicDocument();
  const downloadMutation = useDownloadClinicDocument();

  const handleDownload = async (doc: ClinicDocument) => {
    setDownloading(doc.id);
    try {
      await downloadMutation.mutateAsync(doc);
    } finally {
      setDownloading(null);
    }
  };

  const handleDelete = (doc: ClinicDocument) => {
    deleteMutation.mutate(doc);
  };

  const openUploadDialog = (category: DocumentCategory) => {
    setUploadCategory(category);
    setUploadDialogOpen(true);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="font-display">Documentación del Consultorio</CardTitle>
          <CardDescription>
            Gestiona documentos legales, currículos y otros archivos importantes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="legal" className="space-y-4">
            <div className="flex items-center justify-between">
              <TabsList>
                <TabsTrigger value="legal" className="gap-2">
                  <Scale className="w-4 h-4" />
                  Legales
                  {legalDocs && legalDocs.length > 0 && (
                    <Badge variant="secondary" className="ml-1">
                      {legalDocs.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="cv" className="gap-2">
                  <User className="w-4 h-4" />
                  Currículos
                  {cvDocs && cvDocs.length > 0 && (
                    <Badge variant="secondary" className="ml-1">
                      {cvDocs.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="other" className="gap-2">
                  <File className="w-4 h-4" />
                  Otros
                  {otherDocs && otherDocs.length > 0 && (
                    <Badge variant="secondary" className="ml-1">
                      {otherDocs.length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="legal" className="space-y-4">
              <div className="flex justify-end">
                <Button onClick={() => openUploadDialog("legal")}>
                  <Plus className="w-4 h-4 mr-2" />
                  Subir Documento Legal
                </Button>
              </div>
              <DocumentTable
                documents={legalDocs || []}
                isLoading={loadingLegal}
                onDownload={handleDownload}
                onDelete={handleDelete}
                downloading={downloading}
                category="legal"
              />
            </TabsContent>

            <TabsContent value="cv" className="space-y-4">
              <div className="flex justify-end">
                <Button onClick={() => openUploadDialog("cv")}>
                  <Plus className="w-4 h-4 mr-2" />
                  Subir Currículum
                </Button>
              </div>
              <DocumentTable
                documents={cvDocs || []}
                isLoading={loadingCV}
                onDownload={handleDownload}
                onDelete={handleDelete}
                downloading={downloading}
                category="cv"
              />
            </TabsContent>

            <TabsContent value="other" className="space-y-4">
              <div className="flex justify-end">
                <Button onClick={() => openUploadDialog("other")}>
                  <Plus className="w-4 h-4 mr-2" />
                  Subir Documento
                </Button>
              </div>
              <DocumentTable
                documents={otherDocs || []}
                isLoading={loadingOther}
                onDownload={handleDownload}
                onDelete={handleDelete}
                downloading={downloading}
                category="other"
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <DocumentUploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        defaultCategory={uploadCategory}
      />
    </>
  );
}
