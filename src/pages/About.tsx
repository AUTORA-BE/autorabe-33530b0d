import { Header, Footer, BackButton } from "@/shared/components";
import SEOHead from "@/components/SEOHead";
import { Users, Shield, Car, Award, MapPin, Heart } from "lucide-react";

const About = () => {
  const team = [
    {
      name: "Sophie Dupont",
      role: "CEO & Fondatrice",
      description: "Passionnée d'automobile depuis toujours, Sophie a fondé AutoRa pour révolutionner le marché belge."
    },
    {
      name: "Marc Van Bergen",
      role: "Directeur Technique",
      description: "Expert en technologie avec 15 ans d'expérience dans le développement de plateformes digitales."
    },
    {
      name: "Léa Martin",
      role: "Responsable Qualité",
      description: "Garante de la fiabilité de chaque véhicule listé sur notre plateforme grâce à Car-Pass."
    },
    {
      name: "Thomas Janssens",
      role: "Service Client",
      description: "À l'écoute de nos utilisateurs pour offrir une expérience d'achat exceptionnelle."
    }
  ];

  const values = [
    {
      icon: Shield,
      title: "Transparence",
      description: "Tous nos véhicules sont vérifiés avec Car-Pass pour une transparence totale sur l'historique."
    },
    {
      icon: Heart,
      title: "Confiance",
      description: "Nous bâtissons des relations durables avec nos acheteurs et vendeurs."
    },
    {
      icon: Award,
      title: "Qualité",
      description: "Seuls les véhicules répondant à nos critères stricts sont mis en avant."
    },
    {
      icon: MapPin,
      title: "Proximité",
      description: "Une plateforme 100% belge, adaptée aux spécificités du marché local et aux zones LEZ."
    }
  ];

  return (
    <div className="page-gradient">
      <SEOHead 
        title="À propos - AutoRa"
        description="Découvrez AutoRa, la marketplace automobile belge de confiance. Fondée en 2024, nous révolutionnons l'achat et la vente de véhicules en Belgique."
        url="https://autora.be/about"
      />
      <Header />
      
      <main className="pt-24">
        {/* Hero Section */}
        <section className="container mx-auto px-6 py-16 text-center">
          <div className="max-w-3xl mx-auto animate-fade-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Car className="w-4 h-4" />
              À propos d'AutoRa
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-6">
              La marketplace automobile <span className="gradient-text">de confiance</span> en Belgique
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Fondée en 2024, AutoRa est née d'une vision simple : rendre l'achat et la vente de véhicules 
              en Belgique plus transparent, plus sûr et plus agréable. Nous combinons technologie de pointe 
              et expertise locale pour vous offrir la meilleure expérience possible.
            </p>
          </div>
        </section>

        {/* Stats */}
        <section className="bg-card border-y border-border">
          <div className="container mx-auto px-6 py-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div className="animate-fade-up" style={{ animationDelay: "0.1s" }}>
                <div className="text-3xl md:text-4xl font-display font-bold text-primary mb-2">5000+</div>
                <div className="text-muted-foreground">Véhicules listés</div>
              </div>
              <div className="animate-fade-up" style={{ animationDelay: "0.2s" }}>
                <div className="text-3xl md:text-4xl font-display font-bold text-primary mb-2">15000+</div>
                <div className="text-muted-foreground">Utilisateurs actifs</div>
              </div>
              <div className="animate-fade-up" style={{ animationDelay: "0.3s" }}>
                <div className="text-3xl md:text-4xl font-display font-bold text-primary mb-2">98%</div>
                <div className="text-muted-foreground">Satisfaction client</div>
              </div>
              <div className="animate-fade-up" style={{ animationDelay: "0.4s" }}>
                <div className="text-3xl md:text-4xl font-display font-bold text-primary mb-2">100%</div>
                <div className="text-muted-foreground">Vérifiés Car-Pass</div>
              </div>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="container mx-auto px-6 py-16">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl font-bold text-foreground mb-4">Nos valeurs</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Ce qui nous guide au quotidien pour vous offrir le meilleur service.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <div 
                key={value.title}
                className="glass-card p-6 text-center animate-fade-up"
                style={{ animationDelay: `${0.1 * (index + 1)}s` }}
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <value.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-display font-bold text-foreground mb-2">{value.title}</h3>
                <p className="text-sm text-muted-foreground">{value.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Team */}
        <section className="bg-card border-y border-border">
          <div className="container mx-auto px-6 py-16">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                <Users className="w-4 h-4" />
                Notre équipe
              </div>
              <h2 className="font-display text-3xl font-bold text-foreground mb-4">
                Les visages derrière AutoRa
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Une équipe passionnée d'automobile et dédiée à votre satisfaction.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {team.map((member, index) => (
                <div 
                  key={member.name}
                  className="bg-background rounded-2xl p-6 text-center border border-border animate-fade-up"
                  style={{ animationDelay: `${0.1 * (index + 1)}s` }}
                >
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-display font-bold text-primary">
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <h3 className="font-display font-bold text-foreground mb-1">{member.name}</h3>
                  <p className="text-sm text-primary font-medium mb-3">{member.role}</p>
                  <p className="text-sm text-muted-foreground">{member.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
};

export default About;