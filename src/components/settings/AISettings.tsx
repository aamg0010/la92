import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Brain, Save, Sparkles, Stethoscope, ClipboardList, Zap } from "lucide-react";
import { useAISettings, useUpdateAISettings } from "@/hooks/useSettings";
import { useUserRole } from "@/hooks/useUserRole";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";

const AI_MODELS = [
  { id: "google/gemini-2.5-flash", name: "Gemini 2.5 Flash", description: "Rápido y eficiente" },
  { id: "google/gemini-2.5-pro", name: "Gemini 2.5 Pro", description: "Mayor precisión" },
  { id: "openai/gpt-5-mini", name: "GPT-5 Mini", description: "Equilibrio costo/rendimiento" },
  { id: "openai/gpt-5", name: "GPT-5", description: "Máxima capacidad" },
];

export function AISettings() {
  const { data: settings, isLoading } = useAISettings();
  const { data: role } = useUserRole();
  const updateSettings = useUpdateAISettings();
  const isAdmin = role === "admin";

  const [formData, setFormData] = useState({
    ai_enabled: true,
    default_model: "google/gemini-2.5-flash",
    auto_suggestions: true,
    diagnosis_assistance: true,
    treatment_recommendations: true,
    max_tokens: 2000,
    temperature: 0.7,
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        ai_enabled: settings.ai_enabled ?? true,
        default_model: settings.default_model || "google/gemini-2.5-flash",
        auto_suggestions: settings.auto_suggestions ?? true,
        diagnosis_assistance: settings.diagnosis_assistance ?? true,
        treatment_recommendations: settings.treatment_recommendations ?? true,
        max_tokens: settings.max_tokens || 2000,
        temperature: Number(settings.temperature) || 0.7,
      });
    }
  }, [settings]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings.mutate(formData);
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
            <Brain className="w-5 h-5" />
            Inteligencia Artificial
            {formData.ai_enabled && (
              <Badge variant="default" className="ml-2">
                <Zap className="w-3 h-3 mr-1" />
                Activa
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Configura el asistente de IA para obtener sugerencias clínicas inteligentes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div className="space-y-0.5">
                <Label className="text-base">Habilitar Asistente IA</Label>
                <p className="text-sm text-muted-foreground">
                  Activa las funcionalidades de inteligencia artificial en el sistema
                </p>
              </div>
              <Switch
                checked={formData.ai_enabled}
                onCheckedChange={(checked) => setFormData({ ...formData, ai_enabled: checked })}
                disabled={!isAdmin}
              />
            </div>

            {formData.ai_enabled && (
              <>
                <div className="space-y-3">
                  <Label>Modelo de IA</Label>
                  <Select
                    value={formData.default_model}
                    onValueChange={(value) => setFormData({ ...formData, default_model: value })}
                    disabled={!isAdmin}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AI_MODELS.map((model) => (
                        <SelectItem key={model.id} value={model.id}>
                          <div className="flex flex-col">
                            <span>{model.name}</span>
                            <span className="text-xs text-muted-foreground">{model.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  <Label>Funcionalidades</Label>
                  
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Sparkles className="w-5 h-5 text-primary" />
                      <div>
                        <Label className="font-normal">Sugerencias automáticas</Label>
                        <p className="text-xs text-muted-foreground">
                          Muestra sugerencias mientras trabajas
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={formData.auto_suggestions}
                      onCheckedChange={(checked) => setFormData({ ...formData, auto_suggestions: checked })}
                      disabled={!isAdmin}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Stethoscope className="w-5 h-5 text-primary" />
                      <div>
                        <Label className="font-normal">Asistencia en diagnóstico</Label>
                        <p className="text-xs text-muted-foreground">
                          Sugerencias basadas en síntomas del paciente
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={formData.diagnosis_assistance}
                      onCheckedChange={(checked) => setFormData({ ...formData, diagnosis_assistance: checked })}
                      disabled={!isAdmin}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <ClipboardList className="w-5 h-5 text-primary" />
                      <div>
                        <Label className="font-normal">Recomendaciones de tratamiento</Label>
                        <p className="text-xs text-muted-foreground">
                          Protocolos y planes de tratamiento sugeridos
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={formData.treatment_recommendations}
                      onCheckedChange={(checked) => setFormData({ ...formData, treatment_recommendations: checked })}
                      disabled={!isAdmin}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <Label>Creatividad (Temperature)</Label>
                    <span className="text-sm text-muted-foreground">{formData.temperature.toFixed(1)}</span>
                  </div>
                  <Slider
                    value={[formData.temperature]}
                    onValueChange={([value]) => setFormData({ ...formData, temperature: value })}
                    min={0}
                    max={1}
                    step={0.1}
                    disabled={!isAdmin}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    Valores bajos = respuestas más precisas. Valores altos = respuestas más creativas.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <Label>Longitud máxima de respuesta</Label>
                    <span className="text-sm text-muted-foreground">{formData.max_tokens} tokens</span>
                  </div>
                  <Slider
                    value={[formData.max_tokens]}
                    onValueChange={([value]) => setFormData({ ...formData, max_tokens: value })}
                    min={500}
                    max={4000}
                    step={100}
                    disabled={!isAdmin}
                    className="w-full"
                  />
                </div>
              </>
            )}

            {isAdmin && (
              <div className="flex justify-end">
                <Button type="submit" disabled={updateSettings.isPending}>
                  {updateSettings.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Guardar cambios
                </Button>
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      {!isAdmin && (
        <p className="text-sm text-muted-foreground text-center">
          Solo los administradores pueden modificar la configuración de IA.
        </p>
      )}
    </div>
  );
}
