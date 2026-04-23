import { Link } from "react-router-dom";
import { Calendar, Clock, ArrowRight } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import Header from "@/shared/components/Header";
import Footer from "@/shared/components/Footer";
import { blogArticles } from "@/data/blogArticles";
import { articleSchema, breadcrumbSchema } from "@/lib/seoSchemas";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLocalizedHref } from "@/lib/useLocalizedHref";

const Blog = () => {
  const localized = useLocalizedHref();
  const jsonLd = [
    breadcrumbSchema([
      { name: "Accueil", url: "https://autora.be" },
      { name: "Blog", url: "https://autora.be/blog" },
    ]),
    ...blogArticles.map((a) =>
      articleSchema({
        title: a.title,
        description: a.description,
        url: `https://autora.be/blog/${a.slug}`,
        datePublished: a.datePublished,
        dateModified: a.dateModified,
      })
    ),
  ];

  return (
    <>
      <SEOHead
        title="Blog — Conseils automobile Belgique"
        description="Guides, actualités et conseils pour acheter ou vendre une voiture d'occasion en Belgique. Car-Pass, LEZ, taxes, voitures électriques."
        url="https://autora.be/blog"
        jsonLd={jsonLd}
      />
      <Header />
      <main className="min-h-screen bg-background pt-20 pb-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          {/* Hero */}
          <section className="text-center mb-12">
            <h1 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-3">
              Blog <span className="text-primary">AutoRa</span>
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Guides pratiques, réglementations et conseils pour naviguer le marché automobile belge en toute confiance.
            </p>
          </section>

          {/* Article grid */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {blogArticles.map((article) => (
              <Link key={article.slug} to={localized(`/blog/${article.slug}`)} className="group">
                <Card className="h-full overflow-hidden border-border/40 bg-card/60 backdrop-blur-sm transition-all duration-300 group-hover:border-primary/40 group-hover:shadow-lg group-hover:shadow-primary/5">
                  <div className="aspect-[16/9] overflow-hidden">
                    <img
                      src={article.image}
                      alt={article.title}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <CardContent className="p-4 flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs font-medium">
                        {article.category}
                      </Badge>
                    </div>
                    <h2 className="font-display font-semibold text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                      {article.title}
                    </h2>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {article.description}
                    </p>
                    <div className="flex items-center justify-between mt-auto pt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(article.datePublished).toLocaleDateString("fr-BE", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {article.readTime} min
                      </span>
                    </div>
                    <span className="inline-flex items-center gap-1 text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                      Lire l'article <ArrowRight className="w-4 h-4" />
                    </span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default Blog;
