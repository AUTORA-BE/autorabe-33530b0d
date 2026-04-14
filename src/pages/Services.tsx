/**
 * Services page — detailed expert services with pricing and quote form
 * @module pages
 */

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import {
  Camera,
  FileCheck,
  Truck,
  Check,
  Send,
  CheckCircle,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Header, Footer } from "@/shared/components";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import SEOHead from "@/components/SEOHead";

// ─── Animations ───────────────────────────────────────────────
const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.15 } },
};
const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] } },
};

// ─── Quote Form Schema ───────────────────────────────────────
const quoteSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(100),
  email: z
    .string()
    .trim()
    .email("Adresse email invalide")
    .max(255),
  phone: z
    .string()
    .trim()
    .max(20)
    .optional()
    .or(z.literal("")),
  service: z.string().min(1, "Veuillez choisir un service"),
  details: z
    .string()
    .trim()
    .min(10, "Décrivez votre demande (min. 10 caractères)")
    .max(2000),
});

type QuoteFormData = z.infer<typeof quoteSchema>;

// ─── Service Data ─────────────────────────────────────────────
interface ServiceDetail {
  id: string;
  icon: React.ElementType;
  title: string;
  tagline: string;
  description: string;
  features: string[];
  price: string;
  priceNote: string;
  accent: string;
  iconBg: string;
  popular?: boolean;
}

const services: ServiceDetail[] = [
  {
    id: "mise-en-vente",
    icon: Camera,
    title: "Service Mise en Vente",
    tagline: "Votre annonce, notre expertise",
    description:
      "Nous nous déplaçons chez vous pour réaliser un reportage photo professionnel de votre véhicule (intérieur, extérieur, détails) et rédiger une annonce complète, optimisée pour attirer les acheteurs sérieux.",
    features: [
      "Déplacement à domicile partout en Belgique",
      "Reportage photo professionnel (15-25 photos HD)",
      "Rédaction d'annonce optimisée SEO",
      "Mise en ligne et gestion de l'annonce",
      "Conseils personnalisés pour la vente",
      "Retouches photos incluses",
    ],
    price: "À partir de 89 €",
    priceNote: "Forfait unique, sans commission sur la vente",
    accent: "border-primary/30 hover:border-primary",
    iconBg: "bg-primary/10 text-primary",
  },
  {
    id: "car-pass",
    icon: FileCheck,
    title: "Pack Car-Pass",
    tagline: "Transparence et confiance",
    description:
      "Le Car-Pass est obligatoire en Belgique pour toute vente de véhicule d'occasion. Nous simplifions l'intégralité du processus : demande, vérification et intégration directe dans votre annonce AutoRa.",
    features: [
      "Demande Car-Pass officielle auprès des services agréés",
      "Vérification de l'historique kilométrique",
      "Intégration automatique dans votre annonce",
      "Badge « Car-Pass vérifié » visible par les acheteurs",
      "Accompagnement en cas d'anomalie détectée",
      "Validité conforme à la législation belge",
    ],
    price: "À partir de 29 €",
    priceNote: "Inclus dans le Pack Mise en Vente sur demande",
    accent: "border-blue-500/30 hover:border-blue-500",
    iconBg: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    popular: true,
  },
  {
    id: "logistique",
    icon: Truck,
    title: "Logistique Autora",
    tagline: "Livraison et dépannage partout en Belgique",
    description:
      "Service de transport et de dépannage professionnel pour vos véhicules. Que vous achetiez à distance ou que vous ayez besoin d'un dépannage, nous livrons votre véhicule en toute sécurité, partout en Belgique.",
    features: [
      "Transport sur plateau professionnel",
      "Livraison à domicile dans toute la Belgique",
      "Dépannage 7j/7 (zone Belgique)",
      "Assurance transport incluse",
      "Suivi en temps réel de la livraison",
      "Tarifs transparents, pas de frais cachés",
    ],
    price: "À partir de 149 €",
    priceNote: "Tarif variable selon la distance — devis gratuit",
    accent: "border-amber-500/30 hover:border-amber-500",
    iconBg: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
];

const RATE_LIMIT_MS = 60_000;

// ─── Page Component ───────────────────────────────────────────
const Services = () => {
  const { t } = useLanguage();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [lastSubmitTime, setLastSubmitTime] = useState(0);

  const form = useForm<QuoteFormData>({
    resolver: zodResolver(quoteSchema),
    defaultValues: { name: "", email: "", phone: "", service: "", details: "" },
  });

  const onSubmit = async (data: QuoteFormData) => {
    const now = Date.now();
    if (now - lastSubmitTime < RATE_LIMIT_MS) {
      toast.error("Veuillez attendre 60 secondes entre chaque envoi.");
      return;
    }
    setIsSubmitting(true);
    setLastSubmitTime(now);

    try {
      const selectedService = services.find((s) => s.id === data.service);

      await supabase.functions.invoke("send-contact-email", {
        body: {
          name: data.name,
          email: data.email,
          subject: `Demande de devis — ${selectedService?.title || data.service}`,
          message: `Téléphone : ${data.phone || "Non renseigné"}\nService : ${selectedService?.title || data.service}\n\n${data.details}`,
        },
      });

      // Confirmation email to the user
      const quoteId = crypto.randomUUID();
      await supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "contact-confirmation",
          recipientEmail: data.email,
          idempotencyKey: `quote-confirm-${quoteId}`,
          templateData: {
            name: data.name,
            subject: `Demande de devis — ${selectedService?.title}`,
          },
        },
      });

      setIsSuccess(true);
      form.reset();
      toast.success("Demande de devis envoyée avec succès !");
    } catch {
      toast.error("Erreur lors de l'envoi. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-gradient">
      <SEOHead
        title="Services Experts — AutoRa"
        description="Découvrez les services experts AutoRa : mise en vente professionnelle, certification Car-Pass et logistique automobile en Belgique."
        url="https://autora.be/services"
      />
      <Header />

      <main className="pt-24 pb-16">
        {/* ── Hero ─────────────────────────────────────────── */}
        <section className="container mx-auto px-6 sm:px-8 py-16 sm:py-24 text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-xs font-semibold tracking-wider uppercase mb-6">
              <Sparkles className="w-4 h-4" />
              Services Experts
            </span>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground tracking-tight leading-[1.1] mb-6">
              Des experts à votre{" "}
              <span className="gradient-text">service</span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              De la photo professionnelle à la livraison, AutoRa vous accompagne à chaque étape de la vente ou de l'achat de votre véhicule.
            </p>
          </motion.div>
        </section>

        {/* ── Service Cards ────────────────────────────────── */}
        <section className="container mx-auto px-6 sm:px-8 pb-20 sm:pb-32">
          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
            className="space-y-10 lg:space-y-14 max-w-5xl mx-auto"
          >
            {services.map((service, idx) => (
              <motion.div key={service.id} variants={item}>
                <Card
                  className={`relative overflow-hidden border-2 transition-all duration-300 ${service.accent}`}
                >
                  {service.popular && (
                    <div className="absolute top-4 right-4 z-10">
                      <Badge className="bg-primary text-primary-foreground text-xs font-semibold shadow-sm">
                        Populaire
                      </Badge>
                    </div>
                  )}
                  <CardContent className="p-8 sm:p-10 lg:p-12">
                    <div className="grid lg:grid-cols-5 gap-8 lg:gap-12">
                      {/* Left — description */}
                      <div className="lg:col-span-3 space-y-5">
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-14 h-14 rounded-2xl flex items-center justify-center ${service.iconBg}`}
                          >
                            <service.icon className="w-7 h-7" strokeWidth={1.5} />
                          </div>
                          <div>
                            <h2 className="font-display text-2xl font-bold text-foreground tracking-tight">
                              {service.title}
                            </h2>
                            <p className="text-sm text-muted-foreground">
                              {service.tagline}
                            </p>
                          </div>
                        </div>

                        <p className="text-muted-foreground leading-relaxed">
                          {service.description}
                        </p>

                        {/* Features list */}
                        <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-2.5">
                          {service.features.map((feat) => (
                            <li
                              key={feat}
                              className="flex items-start gap-2 text-sm text-foreground"
                            >
                              <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                              {feat}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Right — pricing + CTA */}
                      <div className="lg:col-span-2 flex flex-col justify-center lg:items-end">
                        <div className="bg-secondary/50 rounded-2xl p-6 sm:p-8 w-full lg:max-w-[280px] text-center">
                          <p className="text-sm text-muted-foreground mb-1">
                            Tarif indicatif
                          </p>
                          <p className="font-display text-3xl font-bold text-foreground mb-1">
                            {service.price}
                          </p>
                          <p className="text-xs text-muted-foreground mb-6">
                            {service.priceNote}
                          </p>
                          <Button
                            className="w-full gap-2 rounded-xl"
                            onClick={() => {
                              form.setValue("service", service.id);
                              document
                                .getElementById("quote-form")
                                ?.scrollIntoView({ behavior: "smooth" });
                            }}
                          >
                            Demander un devis
                            <ArrowRight className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* ── Quote Form ───────────────────────────────────── */}
        <section
          id="quote-form"
          className="bg-card border-y border-border py-20 sm:py-28"
        >
          <div className="container mx-auto px-6 sm:px-8">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="max-w-2xl mx-auto"
            >
              {isSuccess ? (
                <div className="text-center animate-fade-up">
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-10 h-10 text-primary" />
                  </div>
                  <h2 className="font-display text-3xl font-bold text-foreground mb-4">
                    Demande envoyée !
                  </h2>
                  <p className="text-muted-foreground mb-8">
                    Merci pour votre intérêt. Notre équipe vous recontactera sous 24 heures avec un devis personnalisé.
                  </p>
                  <Button onClick={() => setIsSuccess(false)}>
                    Envoyer une autre demande
                  </Button>
                </div>
              ) : (
                <>
                  <div className="text-center mb-12">
                    <span className="inline-block text-xs font-semibold tracking-[0.2em] uppercase text-primary mb-4">
                      Devis gratuit
                    </span>
                    <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground tracking-tight mb-4">
                      Demandez votre devis
                    </h2>
                    <p className="text-muted-foreground max-w-lg mx-auto">
                      Décrivez votre besoin et recevez un devis personnalisé sous 24 heures — sans engagement.
                    </p>
                  </div>

                  <Card className="border-border">
                    <CardContent className="p-6 sm:p-8">
                      <Form {...form}>
                        <form
                          onSubmit={form.handleSubmit(onSubmit)}
                          className="space-y-5"
                        >
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

                          <div className="grid sm:grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="phone"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Téléphone (optionnel)</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="tel"
                                      placeholder="+32 4XX XX XX XX"
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
                              name="service"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Service souhaité</FormLabel>
                                  <Select
                                    onValueChange={field.onChange}
                                    value={field.value}
                                    disabled={isSubmitting}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Choisir un service" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {services.map((s) => (
                                        <SelectItem key={s.id} value={s.id}>
                                          {s.title}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <FormField
                            control={form.control}
                            name="details"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Décrivez votre besoin</FormLabel>
                                <FormControl>
                                  <Textarea
                                    placeholder="Ex : Je souhaite mettre en vente ma Golf VII de 2019, située à Bruxelles…"
                                    className="min-h-[140px] resize-none"
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
                            className="w-full sm:w-auto gap-2"
                            disabled={isSubmitting}
                          >
                            {isSubmitting ? (
                              <>
                                <span className="animate-spin">⏳</span>
                                Envoi en cours…
                              </>
                            ) : (
                              <>
                                <Send className="w-4 h-4" />
                                Envoyer ma demande de devis
                              </>
                            )}
                          </Button>
                        </form>
                      </Form>
                    </CardContent>
                  </Card>
                </>
              )}
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Services;
