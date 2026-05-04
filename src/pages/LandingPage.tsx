/**
 * LandingPage.tsx
 * Landing page para dentry! - SaaS de gestión de clínicas dentales
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import dentryLogo from "@/assets/dentry/logo-dentry-dark.png";
import heroImage from "@/assets/dentry/hero.jpg";
import dashboardMockup from "@/assets/dentry/dashboard-mockup.jpg";
import featureHistorial from "@/assets/dentry/feature-historial.jpg";
import lifestyleBg from "@/assets/dentry/lifestyle-bg.jpg";
import contactBg from "@/assets/dentry/contact-bg.jpg";
import tryLogo from "@/assets/dentry/logo-try.png";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Phone,
  Mail,
  CheckCircle2,
  Calendar,
  Users,
  FileText,
  CreditCard,
  BarChart3,
  Shield,
  Zap,
  Globe,
  Headphones,
  ArrowRight,
  Star,
  Building2,
  Stethoscope,
  Send,
  Instagram,
} from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api/apiClient";
import { useToast } from "@/hooks/use-toast";

// WhatsApp de contacto dentry!
const WHATSAPP_NUMBER = "+34633455646";
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER.replace(/\+/g, "")}?text=Hola%2C%20me%20interesa%20dentry!%20para%20mi%20cl%C3%ADnica`;
const CONTACT_EMAIL = "info@trycompany.eu";
const INSTAGRAM_URL = "https://instagram.com/trycompany.eu";
const INSTAGRAM_HANDLE = "@trycompany.eu";

// Funcionalidades principales
const features = [
  {
    icon: Calendar,
    title: "Agenda Inteligente",
    description: "Gestiona citas con recordatorios automáticos por WhatsApp y email.",
  },
  {
    icon: Users,
    title: "Ficha de Pacientes",
    description: "Historial clínico completo, odontograma digital y documentos.",
  },
  {
    icon: CreditCard,
    title: "Facturación",
    description: "Facturas electrónicas, planes de pago y control de cartera.",
  },
  {
    icon: FileText,
    title: "RIPS Automático",
    description: "Genera reportes RIPS en JSON y formato plano para Colombia.",
  },
  {
    icon: BarChart3,
    title: "Finanzas",
    description: "Dashboard de ingresos, egresos y liquidaciones de doctores.",
  },
  {
    icon: Stethoscope,
    title: "Inventario",
    description: "Control de insumos, alertas de stock y órdenes de compra.",
  },
];

// Beneficios
const benefits = [
  {
    icon: Zap,
    title: "Fácil de Usar",
    description: "Interfaz intuitiva que tu equipo dominará en minutos.",
  },
  {
    icon: Globe,
    title: "100% en la Nube",
    description: "Accede desde cualquier dispositivo, sin instalaciones.",
  },
  {
    icon: Shield,
    title: "Datos Seguros",
    description: "Encriptación y backups automáticos de tu información.",
  },
  {
    icon: Headphones,
    title: "Soporte Incluido",
    description: "Acompañamiento en la implementación y soporte continuo.",
  },
];

// Planes de precios
const plans = [
  {
    name: "Básico",
    price: "49",
    currency: "€",
    period: "/mes",
    description: "Ideal para consultorios pequeños",
    features: [
      "Hasta 2 usuarios",
      "Agenda y citas",
      "Ficha de pacientes",
      "Facturación básica",
      "Soporte por email",
    ],
    highlighted: false,
  },
  {
    name: "Profesional",
    price: "99",
    currency: "€",
    period: "/mes",
    description: "Para clínicas en crecimiento",
    features: [
      "Hasta 5 usuarios",
      "Todo del plan Básico",
      "RIPS automático",
      "Planes de pago",
      "Liquidaciones",
      "Soporte prioritario",
    ],
    highlighted: true,
  },
  {
    name: "Clínica",
    price: "199",
    currency: "€",
    period: "/mes",
    description: "Clínicas con múltiples sedes",
    features: [
      "Usuarios ilimitados",
      "Todo del plan Profesional",
      "Multi-sede",
      "API personalizada",
      "Onboarding dedicado",
      "Soporte 24/7",
    ],
    highlighted: false,
  },
];

function LandingPage() {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    clinicName: "",
    contactName: "",
    email: "",
    phone: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await api.from("contact_messages").insert({
        name: formData.contactName,
        email: formData.email,
        phone: formData.phone,
        message: `Clínica: ${formData.clinicName}\n\n${formData.message}`,
        source: "landing_dentry",
      });

      setSubmitted(true);
      toast({
        title: "Mensaje enviado",
        description: "Nos pondremos en contacto contigo pronto.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No pudimos enviar tu mensaje. Intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={dentryLogo} alt="dentry!" className="h-8 w-auto" />
          </div>
          <div className="flex items-center gap-4">
            <a href="#contacto" className="hidden sm:inline text-muted-foreground hover:text-foreground transition-colors">
              Contacto
            </a>
            <a href="#precios" className="hidden sm:inline text-muted-foreground hover:text-foreground transition-colors">
              Precios
            </a>
            <Link to="/auth">
              <Button variant="outline" size="sm">
                Iniciar Sesión
              </Button>
            </Link>
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
              <Button size="sm" className="bg-[#25D366] hover:bg-[#128C7E] text-white">
                <Phone className="w-4 h-4 mr-2" />
                Demo
              </Button>
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 lg:py-24 bg-gradient-to-br from-primary/5 via-background to-accent/5 overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <Badge className="mb-6" variant="secondary">
                Software de Gestión Dental
              </Badge>
              <h1 className="text-4xl lg:text-5xl xl:text-6xl font-display font-bold text-foreground mb-6">
                Tu clínica dental,{" "}
                <span className="text-primary">un paso adelante</span>
              </h1>
              <p className="text-xl text-muted-foreground mb-8 max-w-xl">
                dentry! es el software todo-en-uno para gestionar tu consultorio odontológico:
                agenda, pacientes, facturación, inventario y mucho más.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
                  <Button size="lg" className="w-full sm:w-auto bg-primary hover:bg-primary/90">
                    Solicitar Demo Gratis
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </a>
                <a href="#funcionalidades">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto">
                    Ver Funcionalidades
                  </Button>
                </a>
              </div>
              <p className="mt-6 text-sm text-muted-foreground">
                Sin compromiso. Configuración en 24 horas.
              </p>
            </div>
            <div className="relative lg:pl-8">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src={heroImage}
                  alt="dentry! - Software de gestión dental"
                  className="w-full h-auto"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              </div>
              {/* Floating stats */}
              <div className="absolute -bottom-6 -left-6 bg-background rounded-xl shadow-lg p-4 border hidden lg:block">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Star className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground">+500</p>
                    <p className="text-xs text-muted-foreground">Clínicas activas</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="funcionalidades" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-display font-bold text-foreground mb-4">
              Todo lo que necesitas
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              dentry! integra todas las herramientas para gestionar tu clínica dental de forma profesional.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="border-none shadow-sm hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Dashboard Preview Section */}
      <section className="py-20 overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <div className="relative">
                <img
                  src={dashboardMockup}
                  alt="Dashboard dentry!"
                  className="rounded-2xl shadow-2xl w-full"
                />
                <div className="absolute -bottom-4 -right-4 bg-primary text-primary-foreground rounded-xl p-4 shadow-lg hidden md:block">
                  <p className="font-bold">Interfaz intuitiva</p>
                  <p className="text-sm opacity-90">Aprende en minutos</p>
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <Badge className="mb-4" variant="outline">Vista previa</Badge>
              <h2 className="text-3xl lg:text-4xl font-display font-bold text-foreground mb-6">
                Un dashboard que lo tiene todo
              </h2>
              <p className="text-lg text-muted-foreground mb-6">
                Visualiza el estado de tu clínica en un solo lugar: citas del día,
                ingresos, pacientes pendientes y mucho más.
              </p>
              <ul className="space-y-3">
                {[
                  "Resumen de citas y agenda del día",
                  "Métricas de ingresos en tiempo real",
                  "Alertas de inventario bajo",
                  "Pacientes con pagos pendientes",
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                    <span className="text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-display font-bold text-foreground mb-4">
              ¿Por qué dentry!?
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <benefit.icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{benefit.title}</h3>
                <p className="text-muted-foreground text-sm">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Historial Feature Section */}
      <section
        className="py-20 relative overflow-hidden"
        style={{
          backgroundImage: `url(${lifestyleBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-background/70" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center max-w-5xl mx-auto">
            <div>
              <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">Historial clínico</Badge>
              <h2 className="text-3xl lg:text-4xl font-display font-bold text-foreground mb-6">
                Cada paciente, una historia completa
              </h2>
              <p className="text-lg text-muted-foreground mb-6">
                Accede al historial completo de cada paciente: tratamientos anteriores,
                odontograma, imágenes, documentos y notas clínicas.
              </p>
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
                <Button size="lg">
                  Conoce más
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </a>
            </div>
            <div>
              <img
                src={featureHistorial}
                alt="Historial de pacientes dentry!"
                className="rounded-2xl shadow-xl w-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="precios" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-display font-bold text-foreground mb-4">
              Planes y Precios
            </h2>
            <p className="text-lg text-muted-foreground">
              Elige el plan que mejor se adapte a tu clínica
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map((plan, index) => (
              <Card
                key={index}
                className={`relative ${
                  plan.highlighted
                    ? "border-primary shadow-lg scale-105"
                    : "border-border"
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground">
                      Más Popular
                    </Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-foreground">
                      {plan.currency}{plan.price}
                    </span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                  <ul className="space-y-3 text-left mb-6">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
                    <Button
                      className={`w-full ${
                        plan.highlighted
                          ? "bg-primary hover:bg-primary/90"
                          : ""
                      }`}
                      variant={plan.highlighted ? "default" : "outline"}
                    >
                      Empezar Ahora
                    </Button>
                  </a>
                </CardContent>
              </Card>
            ))}
          </div>
          <p className="text-center text-sm text-muted-foreground mt-8">
            Todos los precios son sin IVA. Facturación mensual o anual (2 meses gratis).
          </p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl lg:text-4xl font-display font-bold mb-4">
            ¿Listo para digitalizar tu clínica?
          </h2>
          <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
            Únete a las clínicas que ya confían en dentry! para gestionar su día a día.
          </p>
          <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
            <Button size="lg" variant="secondary">
              Solicitar Demo Gratis
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </a>
        </div>
      </section>

      {/* Contact Section */}
      <section
        id="contacto"
        className="py-20 relative overflow-hidden"
        style={{
          backgroundImage: `url(${contactBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-background/70" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 max-w-5xl mx-auto">
            <div>
              <h2 className="text-3xl font-display font-bold text-foreground mb-4">
                Contáctanos
              </h2>
              <p className="text-muted-foreground mb-8">
                ¿Tienes preguntas? Escríbenos y te responderemos lo antes posible.
              </p>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <a href={`mailto:${CONTACT_EMAIL}`} className="font-medium text-foreground hover:text-primary">
                      {CONTACT_EMAIL}
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#25D366]/10 flex items-center justify-center">
                    <Phone className="w-5 h-5 text-[#25D366]" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">WhatsApp</p>
                    <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="font-medium text-foreground hover:text-primary">
                      {WHATSAPP_NUMBER}
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center overflow-hidden">
                    <img src={tryLogo} alt="try! company" className="w-8 h-8 object-contain" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Empresa</p>
                    <p className="font-medium text-foreground">try! company</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-pink-500/10 flex items-center justify-center">
                    <Instagram className="w-5 h-5 text-pink-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Instagram</p>
                    <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="font-medium text-foreground hover:text-primary">
                      {INSTAGRAM_HANDLE}
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Solicita información</CardTitle>
                <CardDescription>
                  Completa el formulario y te contactaremos
                </CardDescription>
              </CardHeader>
              <CardContent>
                {submitted ? (
                  <div className="text-center py-8">
                    <CheckCircle2 className="w-16 h-16 text-primary mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">¡Gracias!</h3>
                    <p className="text-muted-foreground">
                      Hemos recibido tu mensaje. Te contactaremos pronto.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="clinicName">Nombre de la Clínica</Label>
                        <Input
                          id="clinicName"
                          value={formData.clinicName}
                          onChange={(e) => setFormData({ ...formData, clinicName: e.target.value })}
                          placeholder="Mi Clínica Dental"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="contactName">Tu Nombre</Label>
                        <Input
                          id="contactName"
                          value={formData.contactName}
                          onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                          placeholder="Juan Pérez"
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="correo@ejemplo.com"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Teléfono</Label>
                        <Input
                          id="phone"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="+34 600 000 000"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="message">Mensaje (opcional)</Label>
                      <Textarea
                        id="message"
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        placeholder="Cuéntanos sobre tu clínica..."
                        rows={3}
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                      {isSubmitting ? (
                        "Enviando..."
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Enviar Mensaje
                        </>
                      )}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-muted/50 border-t">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img src={dentryLogo} alt="dentry!" className="h-6 w-auto" />
              <span className="text-muted-foreground">by</span>
              <img src={tryLogo} alt="try! company" className="h-6 w-auto" />
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-foreground">
                {CONTACT_EMAIL}
              </a>
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="hover:text-foreground">
                {WHATSAPP_NUMBER}
              </a>
              <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="hover:text-foreground flex items-center gap-1">
                <Instagram className="w-4 h-4" />
                {INSTAGRAM_HANDLE}
              </a>
              <Link to="/admin/login" className="hover:text-primary transition-colors">
                Administración
              </Link>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} try! company. Todos los derechos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
