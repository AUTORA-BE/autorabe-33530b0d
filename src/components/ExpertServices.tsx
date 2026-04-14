/**
 * "Nos Services Experts" — premium services showcase section
 * @module components
 */

import { memo } from "react";
import { Camera, FileCheck, Truck, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.2 } },
};

const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.25, 0.1, 0.25, 1] } },
};

interface ServiceCard {
  icon: React.ElementType;
  title: string;
  description: string;
  accent: string;
  iconBg: string;
}

const ExpertServices = memo(() => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isNl = language === "nl";
  const isEn = language === "en";

  const t = (fr: string, nl: string, en: string) =>
    isNl ? nl : isEn ? en : fr;

  const services: ServiceCard[] = [
    {
      icon: Camera,
      title: t(
        "Service Mise en Vente",
        "Verkoopservice",
        "Listing Service"
      ),
      description: t(
        "Nous nous déplaçons chez vous pour réaliser des photos de qualité professionnelle et rédiger une annonce percutante qui met votre véhicule en valeur.",
        "Wij komen bij u langs om professionele foto's te maken en een krachtige advertentie te schrijven die uw voertuig in de kijker zet.",
        "We come to you to take professional-quality photos and write a compelling listing that showcases your vehicle."
      ),
      accent: "border-primary/20 hover:border-primary/50",
      iconBg: "bg-primary/10 text-primary",
    },
    {
      icon: FileCheck,
      title: t(
        "Pack Car-Pass",
        "Car-Pass Pakket",
        "Car-Pass Pack"
      ),
      description: t(
        "Intégration simplifiée et certification Car-Pass officielle pour garantir la transparence kilométrique et rassurer vos acheteurs potentiels.",
        "Vereenvoudigde integratie en officiële Car-Pass certificering om de kilometertransparantie te garanderen en potentiële kopers gerust te stellen.",
        "Simplified integration and official Car-Pass certification to guarantee mileage transparency and reassure potential buyers."
      ),
      accent: "border-blue-500/20 hover:border-blue-500/50",
      iconBg: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    },
    {
      icon: Truck,
      title: t(
        "Logistique Autora",
        "Autora Logistiek",
        "Autora Logistics"
      ),
      description: t(
        "Service de dépannage professionnel et livraison de véhicules partout en Belgique. Votre voiture livrée en toute sécurité, où que vous soyez.",
        "Professionele takel- en bezorgservice voor voertuigen in heel België. Uw auto veilig geleverd, waar u ook bent.",
        "Professional towing and vehicle delivery service across Belgium. Your car delivered safely, wherever you are."
      ),
      accent: "border-amber-500/20 hover:border-amber-500/50",
      iconBg: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    },
  ];

  return (
    <section className="py-20 sm:py-32">
      <div className="container mx-auto px-6 sm:px-8">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14 sm:mb-20"
        >
          <span className="inline-block text-xs font-semibold tracking-[0.2em] uppercase text-primary mb-4">
            {t("Services", "Diensten", "Services")}
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground tracking-tight">
            {t("Nos Services Experts", "Onze Expertdiensten", "Our Expert Services")}
          </h2>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto text-base sm:text-lg leading-relaxed">
            {t(
              "Des solutions clé en main pour vendre, certifier et transporter votre véhicule en toute sérénité.",
              "Kant-en-klare oplossingen om uw voertuig te verkopen, te certificeren en te transporteren met een gerust hart.",
              "Turnkey solutions to sell, certify and transport your vehicle with total peace of mind."
            )}
          </p>
        </motion.div>

        {/* Service cards */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8"
        >
          {services.map((service) => (
            <motion.div
              key={service.title}
              variants={item}
              className={`group relative rounded-2xl border-2 bg-card p-8 sm:p-10 transition-all duration-300 hover:shadow-lg ${service.accent}`}
            >
              {/* Icon */}
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform duration-300 group-hover:scale-110 ${service.iconBg}`}>
                <service.icon className="w-7 h-7" strokeWidth={1.5} />
              </div>

              {/* Content */}
              <h3 className="font-display text-xl font-bold text-foreground mb-3 tracking-tight">
                {service.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed mb-8">
                {service.description}
              </p>

              {/* CTA */}
              <Button
                variant="ghost"
                size="sm"
                className="group/btn gap-2 px-0 text-primary hover:text-primary hover:bg-transparent font-semibold"
                onClick={() => navigate("/services")}
              >
                {t("En savoir plus", "Meer info", "Learn more")}
                <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
              </Button>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
});

ExpertServices.displayName = "ExpertServices";

export default ExpertServices;
