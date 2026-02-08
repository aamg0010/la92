import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  Star, 
  Sparkles, 
  Heart, 
  Shield, 
  Award,
  ChevronRight,
  Instagram,
  Send,
  CheckCircle2,
  MessageCircle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { Logo } from "@/components/Logo";
import logoImage from "@/assets/logo-la92.png";

const services = [
  {
    title: "Diseño de Sonrisa",
    description: "Transformación integral de tu sonrisa con carillas y técnicas de última generación.",
    icon: Sparkles,
  },
  {
    title: "Microdiseño",
    description: "Ajustes estéticos precisos para perfeccionar los detalles de tu sonrisa.",
    icon: Star,
  },
  {
    title: "Blanqueamiento",
    description: "Aclara el tono de tus dientes de forma segura y profesional.",
    icon: Award,
  },
  {
    title: "Ortodoncia",
    description: "Brackets y alineadores para corregir la posición de tus dientes.",
    icon: Sparkles,
  },
  {
    title: "Endodoncia",
    description: "Tratamiento de conductos para salvar dientes dañados o infectados.",
    icon: Heart,
  },
  {
    title: "Periodoncia",
    description: "Cuidado especializado de encías y tejidos de soporte dental.",
    icon: Shield,
  },
  {
    title: "Cirugía Oral",
    description: "Extracciones, implantes y procedimientos quirúrgicos bucales.",
    icon: Shield,
  },
  {
    title: "Prótesis Dentales",
    description: "Prótesis fijas y removibles para restaurar tu función y estética.",
    icon: Star,
  },
  {
    title: "Coronas",
    description: "Coronas en porcelana y zirconio para proteger y embellecer tus dientes.",
    icon: Award,
  },
  {
    title: "Aparatología",
    description: "Dispositivos ortopédicos y funcionales para niños y adultos.",
    icon: Sparkles,
  },
  {
    title: "Limpieza Dental",
    description: "Profilaxis profesional para mantener tu salud bucal al día.",
    icon: Heart,
  },
];

const team = [
  {
    name: "Dra. Ana María Rios Grajales",
    specialty: "Odontóloga General - Directora",
    image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=400&fit=crop&crop=face",
    experience: "15+ años de experiencia"
  },
  {
    name: "Dr. Carlos Andrés Mejía",
    specialty: "Especialista en Implantología",
    image: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=400&fit=crop&crop=face",
    experience: "12+ años de experiencia"
  },
  {
    name: "Dra. Valentina Ochoa",
    specialty: "Ortodoncista",
    image: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=400&h=400&fit=crop&crop=face",
    experience: "8+ años de experiencia"
  }
];

export default function LandingPage() {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      toast({
        title: "Campos requeridos",
        description: "Por favor complete nombre, email y mensaje.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from("contact_messages").insert({
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || null,
        subject: formData.subject.trim() || null,
        message: formData.message.trim()
      });

      if (error) throw error;

      setSubmitted(true);
      setFormData({ name: "", email: "", phone: "", subject: "", message: "" });
      toast({
        title: "¡Mensaje enviado!",
        description: "Nos pondremos en contacto contigo pronto."
      });
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "No se pudo enviar el mensaje. Intenta de nuevo.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo size="md" />
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <a href="#servicios" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Servicios</a>
            <a href="#equipo" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Equipo</a>
            <a href="#contacto" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Contacto</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/agenda">
              <Button variant="outline" size="sm" className="hidden sm:flex">
                Portal Clínico
              </Button>
            </Link>
            <a href="tel:+576045927828">
              <Button size="sm" className="gap-2">
                <Phone className="w-4 h-4" />
                <span className="hidden sm:inline">Llamar ahora</span>
              </Button>
            </a>
          </div>
        </div>
      </header>

       {/* Hero Section */}
      <section className="relative py-24 lg:py-36 overflow-hidden bg-sidebar-background text-sidebar-foreground">
        <div className="absolute inset-0 bg-gradient-to-br from-sidebar-background via-sidebar-accent to-sidebar-background opacity-80" />
        <div className="container mx-auto px-4 relative">
          <div className="max-w-3xl mx-auto text-center">
            <img 
              src={logoImage} 
              alt="Consultorio Odontológico La 92" 
              className="w-32 h-32 md:w-40 md:h-40 mx-auto mb-8 rounded-2xl object-contain"
            />
            <Badge className="mb-6 bg-primary/20 text-primary border-primary/30 hover:bg-primary/25">
              <Star className="w-3 h-3 mr-1" />
              Más que un consultorio, tu aliado en salud bucal
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Odontología Integral & Estética ✨
            </h1>
            <p className="text-lg md:text-xl text-sidebar-foreground/80 mb-8 max-w-2xl mx-auto">
              Agenda tu cita y transforma tu sonrisa con nuestro equipo especializado en Medellín.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="#contacto">
                <Button size="lg" className="gap-2 w-full sm:w-auto">
                  Agendar Cita
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </a>
              <a href="https://wa.me/573206433524" target="_blank" rel="noopener noreferrer">
                <Button size="lg" variant="outline" className="gap-2 w-full sm:w-auto border-sidebar-foreground/30 text-white hover:bg-sidebar-accent hover:text-white">
                  <MessageCircle className="w-4 h-4" />
                  WhatsApp
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="servicios" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Nuestros Servicios</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Ofrecemos una amplia gama de tratamientos odontológicos con los más altos estándares de calidad.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, index) => (
              <Card key={index} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <CardHeader>
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <service.icon className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{service.title}</CardTitle>
                  <CardDescription>{service.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <a href="#contacto">
                    <Button variant="link" className="px-0 gap-1">
                      Agendar cita <ChevronRight className="w-3 h-3" />
                    </Button>
                  </a>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section id="equipo" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Nuestro Equipo</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Profesionales altamente calificados comprometidos con tu salud bucal.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {team.map((member, index) => (
              <Card key={index} className="text-center overflow-hidden group">
                <div className="aspect-square overflow-hidden">
                  <img 
                    src={member.image} 
                    alt={member.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <CardHeader>
                  <CardTitle className="text-lg">{member.name}</CardTitle>
                  <CardDescription>{member.specialty}</CardDescription>
                  <Badge variant="secondary" className="w-fit mx-auto mt-2">
                    {member.experience}
                  </Badge>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contacto" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
            {/* Contact Info */}
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">Contáctanos</h2>
              <p className="text-muted-foreground mb-8">
                Estamos aquí para ayudarte. Agenda tu cita o envíanos tus preguntas.
              </p>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Ubicación</h3>
                    <p className="text-muted-foreground">Carrera 51 # 92-00, Aranjuez<br />Medellín, Antioquia 050004</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Phone className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Teléfono</h3>
                    <p className="text-muted-foreground">
                      <a href="tel:+576045927828" className="hover:text-primary transition-colors">604 592 78 28</a>
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <MessageCircle className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">WhatsApp</h3>
                    <p className="text-muted-foreground">
                      <a href="https://wa.me/573206433524" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                        320 643 35 24
                      </a>
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Horario</h3>
                    <p className="text-muted-foreground">Lunes a Viernes: 8:00 AM - 6:00 PM<br />Sábados: 8:00 AM - 2:00 PM</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 mt-8">
                <a href="https://instagram.com/consultoriola92" target="_blank" rel="noopener noreferrer" 
                   className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors">
                  <Instagram className="w-5 h-5 text-primary" />
                </a>
                <a href="https://wa.me/573206433524" target="_blank" rel="noopener noreferrer"
                   className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors">
                  <MessageCircle className="w-5 h-5 text-primary" />
                </a>
              </div>
            </div>

            {/* Contact Form */}
            <Card>
              <CardHeader>
                <CardTitle>Envíanos un mensaje</CardTitle>
                <CardDescription>Responderemos a la brevedad posible.</CardDescription>
              </CardHeader>
              <CardContent>
                {submitted ? (
                  <div className="text-center py-8">
                    <CheckCircle2 className="w-16 h-16 text-success mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-foreground mb-2">¡Mensaje enviado!</h3>
                    <p className="text-muted-foreground mb-4">
                      Gracias por contactarnos. Te responderemos pronto.
                    </p>
                    <Button onClick={() => setSubmitted(false)} variant="outline">
                      Enviar otro mensaje
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nombre completo *</Label>
                        <Input 
                          id="name" 
                          name="name" 
                          value={formData.name}
                          onChange={handleInputChange}
                          placeholder="Tu nombre"
                          required 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Teléfono</Label>
                        <Input 
                          id="phone" 
                          name="phone" 
                          type="tel"
                          value={formData.phone}
                          onChange={handleInputChange}
                          placeholder="+57 300 000 0000" 
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Correo electrónico *</Label>
                      <Input 
                        id="email" 
                        name="email" 
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="tu@email.com"
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="subject">Asunto</Label>
                      <Input 
                        id="subject" 
                        name="subject"
                        value={formData.subject}
                        onChange={handleInputChange}
                        placeholder="¿En qué podemos ayudarte?" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="message">Mensaje *</Label>
                      <Textarea 
                        id="message" 
                        name="message"
                        value={formData.message}
                        onChange={handleInputChange}
                        placeholder="Cuéntanos sobre tu consulta..."
                        rows={4}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full gap-2" disabled={isSubmitting}>
                      {isSubmitting ? (
                        "Enviando..."
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Enviar mensaje
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
       <footer className="bg-sidebar-background text-sidebar-foreground py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <img src={logoImage} alt="La 92" className="w-10 h-10 rounded-xl object-contain" />
              <div>
                <h3 className="font-semibold">Consultorio Odontológico La 92</h3>
                <p className="text-sm text-sidebar-foreground/70">Más que un consultorio, tu aliado en salud bucal</p>
              </div>
            </div>
            <div className="flex flex-col md:flex-row items-center gap-4 text-sm text-sidebar-foreground/70">
              <span>Carrera 51 # 92-00, Aranjuez - Medellín</span>
              <span className="hidden md:inline">•</span>
              <span>Tel: 604 592 78 28</span>
              <span className="hidden md:inline">•</span>
                <a href="https://instagram.com/consultoriola92" target="_blank" rel="noopener noreferrer" className="hover:text-sidebar-foreground transition-colors">
                @consultoriola92
              </a>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-sidebar-border text-center text-sm text-sidebar-foreground/50">
            © {new Date().getFullYear()} Consultorio La 92. Todos los derechos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
}
