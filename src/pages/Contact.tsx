import { useRef, useState } from "react";
import { Honeypot, isHoneypotTriggered } from "@/components/Honeypot";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Header, Footer, BackButton } from "@/shared/components";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Mail, Send, Clock, CheckCircle, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import SEOHead from "@/components/SEOHead";

const contactSchema = z.object({
  name: z.string()
    .trim()
    .min(2, { message: "Le nom doit contenir au moins 2 caractères" })
    .max(100, { message: "Le nom doit contenir moins de 100 caractères" }),
  email: z.string()
    .trim()
    .email({ message: "Adresse email invalide" })
    .max(255, { message: "L'email doit contenir moins de 255 caractères" }),
  subject: z.string()
    .trim()
    .min(5, { message: "Le sujet doit contenir au moins 5 caractères" })
    .max(200, { message: "Le sujet doit contenir moins de 200 caractères" }),
  message: z.string()
    .trim()
    .min(10, { message: "Le message doit contenir au moins 10 caractères" })
    .max(2000, { message: "Le message doit contenir moins de 2000 caractères" }),
});

type ContactFormData = z.infer<typeof contactSchema>;

const RATE_LIMIT_MS = 60_000;

const Contact = () => {
  const {  } = useLanguage();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [lastSubmitTime, setLastSubmitTime] = useState(0);
  const honeypotRef = useRef<HTMLInputElement>(null);

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
      subject: "",
      message: "",
    },
  });

  const onSubmit = async (data: ContactFormData) => {
    // Honeypot: silently "succeed" for bots without hitting the backend
    if (isHoneypotTriggered(honeypotRef.current)) {
      setIsSuccess(true);
      form.reset();
      return;
    }

    const now = Date.now();
    if (now - lastSubmitTime < RATE_LIMIT_MS) {
      toast.error("Veuillez attendre 60 secondes entre chaque envoi.");
      return;
    }

    setIsSubmitting(true);
    setLastSubmitTime(now);
    try {
      // Send notification to AutoRA team (existing edge function)
      const { error } = await supabase.functions.invoke("send-contact-email", {
        body: data,
      });
      if (error) throw error;

      // Send confirmation email to the user via transactional email system
      const contactId = crypto.randomUUID();
      await supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "contact-confirmation",
          recipientEmail: data.email,
          idempotencyKey: `contact-confirm-${contactId}`,
          templateData: { name: data.name, subject: data.subject },
        },
      });

      setIsSuccess(true);
      form.reset();
      toast.success("Message envoyé avec succès !");
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Erreur lors de l'envoi du message. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactInfo = [
    {
      icon: Mail,
      title: "Email",
      value: "autoracontact@gmail.com",
      href: "mailto:autoracontact@gmail.com",
    },
    {
      icon: Clock,
      title: "Horaires",
      value: "Lun-Ven: 9h-18h",
      href: null,
    },
  ];

  if (isSuccess) {
    return (
      <div className="page-gradient">
        <Header />
        <main className="pt-24 pb-16">
          <div className="container mx-auto px-6">
            <div className="max-w-2xl mx-auto text-center animate-fade-up">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-primary" />
              </div>
              <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
                Message envoyé !
              </h1>
              <p className="text-lg text-muted-foreground mb-8">
                Merci de nous avoir contacté. Notre équipe vous répondra dans les plus brefs délais.
              </p>
              <Button onClick={() => setIsSuccess(false)}>
                Envoyer un autre message
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="page-gradient">
      <SEOHead title="Contactez AutoRA — Support & Questions" description="Contactez l'équipe AutoRA pour toute question sur l'achat ou la vente de votre véhicule d'occasion en Belgique. Réponse sous 24h." url="https://autora.be/contact" />
      <Header />
      
      <main className="pt-24">
        <div className="container mx-auto px-6 pt-4">
          <BackButton to="/" className="mb-2" />
        </div>
        {/* Hero Section */}
        <section className="container mx-auto px-6 py-16 text-center">
          <div className="max-w-3xl mx-auto animate-fade-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <MessageSquare className="w-4 h-4" />
              Contactez-nous
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-6">
              Une question ? <span className="gradient-text">Parlons-en</span>
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Notre équipe est à votre disposition pour répondre à toutes vos questions 
              concernant l'achat ou la vente de votre véhicule.
            </p>
          </div>
        </section>

        {/* Contact Form & Info */}
        <section className="container mx-auto px-6 pb-16">
          <div className="max-w-6xl mx-auto grid lg:grid-cols-3 gap-8">
            {/* Contact Info */}
            <div className="lg:col-span-1 space-y-6">
              <Card className="glass-card animate-fade-up">
                <CardHeader>
                  <CardTitle className="font-display text-xl">Informations de contact</CardTitle>
                  <CardDescription>
                    Plusieurs moyens de nous joindre
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {contactInfo.map((item) => (
                    <div key={item.title} className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <item.icon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{item.title}</p>
                        {item.href ? (
                          <a 
                            href={item.href}
                            className="text-sm text-muted-foreground hover:text-primary transition-colors"
                          >
                            {item.value}
                          </a>
                        ) : (
                          <p className="text-sm text-muted-foreground">{item.value}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Response Time */}
              <Card className="glass-card animate-fade-up" style={{ animationDelay: "0.1s" }}>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
                    <span className="text-sm font-medium text-foreground">Réponse rapide</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Nous répondons généralement sous 24 heures ouvrées.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <Card className="glass-card animate-fade-up" style={{ animationDelay: "0.2s" }}>
                <CardHeader>
                  <CardTitle className="font-display text-xl">Envoyez-nous un message</CardTitle>
                  <CardDescription>
                    Remplissez le formulaire ci-dessous et nous vous répondrons rapidement
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nom complet</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Jean Dupont" 
                                  {...field} 
                                  disabled={isSubmitting}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input 
                                  type="email" 
                                  placeholder="jean@exemple.be" 
                                  {...field} 
                                  disabled={isSubmitting}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={form.control}
                        name="subject"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Sujet</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Comment pouvons-nous vous aider ?" 
                                {...field} 
                                disabled={isSubmitting}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="message"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Message</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Décrivez votre demande en détail..." 
                                className="min-h-[150px] resize-none"
                                {...field} 
                                disabled={isSubmitting}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button 
                        type="submit" 
                        className="w-full sm:w-auto"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <span className="animate-spin mr-2">⏳</span>
                            Envoi en cours...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4 mr-2" />
                            Envoyer le message
                          </>
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* FAQ Link */}
        <section className="bg-card border-y border-border">
          <div className="container mx-auto px-6 py-12">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="font-display text-2xl font-bold text-foreground mb-4">
                Questions fréquentes
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Vous trouverez peut-être la réponse à votre question dans notre FAQ.
              </p>
              <Button variant="outline" asChild>
                <a href="/faq">Consulter la FAQ</a>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Contact;
