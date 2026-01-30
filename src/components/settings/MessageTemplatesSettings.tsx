import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, MessageSquare, Save, Mail, Phone, MessageCircle } from "lucide-react";
import { useMessageTemplates, useUpdateMessageTemplate } from "@/hooks/useSettings";
import { useUserRole } from "@/hooks/useUserRole";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const TYPE_LABELS: Record<string, string> = {
  appointment_reminder: "Recordatorio de cita",
  appointment_confirmation: "Confirmación de cita",
  post_treatment: "Seguimiento post-tratamiento",
  payment_reminder: "Recordatorio de pago",
  birthday: "Cumpleaños",
  custom: "Personalizado",
};

const CHANNEL_ICONS: Record<string, React.ReactNode> = {
  whatsapp: <MessageCircle className="w-4 h-4 text-primary" />,
  email: <Mail className="w-4 h-4 text-primary" />,
  sms: <Phone className="w-4 h-4 text-primary" />,
};

export function MessageTemplatesSettings() {
  const { data: templates, isLoading } = useMessageTemplates();
  const { data: role } = useUserRole();
  const updateTemplate = useUpdateMessageTemplate();
  const canEdit = role === "admin" || role === "doctor";

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    subject: "",
    content: "",
    is_active: true,
  });

  const handleEdit = (template: typeof templates extends (infer T)[] ? T : never) => {
    setEditingId(template.id);
    setEditForm({
      name: template.name,
      subject: template.subject || "",
      content: template.content,
      is_active: template.is_active ?? true,
    });
  };

  const handleSave = () => {
    if (!editingId) return;
    updateTemplate.mutate({
      id: editingId,
      name: editForm.name,
      subject: editForm.subject || null,
      content: editForm.content,
      is_active: editForm.is_active,
    });
    setEditingId(null);
  };

  const handleCancel = () => {
    setEditingId(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Plantillas de Mensajes
          </CardTitle>
          <CardDescription>
            Personaliza los mensajes automáticos que se envían a los pacientes por WhatsApp, Email y SMS
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 p-4 bg-muted/50 rounded-lg">
            <h4 className="text-sm font-medium mb-2">Variables disponibles:</h4>
            <div className="flex flex-wrap gap-2">
              {["patient_name", "appointment_date", "appointment_time", "doctor_name", "clinic_name", "treatment_name"].map((v) => (
                <Badge key={v} variant="outline" className="font-mono text-xs">
                  {`{{${v}}}`}
                </Badge>
              ))}
            </div>
          </div>

          <Accordion type="single" collapsible className="space-y-2">
            {templates?.map((template) => (
              <AccordionItem key={template.id} value={template.id} className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3 text-left">
                    {CHANNEL_ICONS[template.channel]}
                    <div>
                      <div className="font-medium">{template.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {TYPE_LABELS[template.type]} • {template.channel.toUpperCase()}
                      </div>
                    </div>
                    {!template.is_active && (
                      <Badge variant="secondary" className="ml-2">Inactivo</Badge>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-4">
                  {editingId === template.id ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Nombre</Label>
                        <Input
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        />
                      </div>

                      {template.channel === "email" && (
                        <div className="space-y-2">
                          <Label>Asunto</Label>
                          <Input
                            value={editForm.subject}
                            onChange={(e) => setEditForm({ ...editForm, subject: e.target.value })}
                            placeholder="Asunto del correo"
                          />
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label>Contenido</Label>
                        <Textarea
                          value={editForm.content}
                          onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                          rows={6}
                          className="font-mono text-sm"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={editForm.is_active}
                            onCheckedChange={(checked) => setEditForm({ ...editForm, is_active: checked })}
                          />
                          <Label>Activo</Label>
                        </div>

                        <div className="flex gap-2">
                          <Button variant="outline" onClick={handleCancel}>
                            Cancelar
                          </Button>
                          <Button onClick={handleSave} disabled={updateTemplate.isPending}>
                            {updateTemplate.isPending ? (
                              <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            ) : (
                              <Save className="w-4 h-4 mr-2" />
                            )}
                            Guardar
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {template.subject && (
                        <div>
                          <Label className="text-xs text-muted-foreground">Asunto</Label>
                          <p className="text-sm">{template.subject}</p>
                        </div>
                      )}
                      <div>
                        <Label className="text-xs text-muted-foreground">Contenido</Label>
                        <pre className="text-sm whitespace-pre-wrap bg-muted/50 p-3 rounded-md mt-1">
                          {template.content}
                        </pre>
                      </div>
                      {template.variables && template.variables.length > 0 && (
                        <div>
                          <Label className="text-xs text-muted-foreground">Variables utilizadas</Label>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {template.variables.map((v) => (
                              <Badge key={v} variant="outline" className="font-mono text-xs">
                                {`{{${v}}}`}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {canEdit && (
                        <Button variant="outline" size="sm" onClick={() => handleEdit(template)}>
                          Editar plantilla
                        </Button>
                      )}
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      {!canEdit && (
        <p className="text-sm text-muted-foreground text-center">
          Solo los administradores y doctores pueden editar las plantillas de mensajes.
        </p>
      )}
    </div>
  );
}
