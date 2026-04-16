import { useParams, Link, Navigate } from "react-router-dom";
import { Calendar, Clock, ArrowLeft, Share2 } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import Header from "@/shared/components/Header";
import Footer from "@/shared/components/Footer";
import { getArticleBySlug } from "@/data/blogArticles";
import { articleSchema, breadcrumbSchema } from "@/lib/seoSchemas";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const BlogArticle = () => {
  const { slug } = useParams<{ slug: string }>();
  const article = slug ? getArticleBySlug(slug) : undefined;

  if (!article) return <Navigate to="/blog" replace />;

  const jsonLd = [
    breadcrumbSchema([
      { name: "Accueil", url: "https://autora.be" },
      { name: "Blog", url: "https://autora.be/blog" },
      { name: article.title, url: `https://autora.be/blog/${article.slug}` },
    ]),
    articleSchema({
      title: article.title,
      description: article.description,
      url: `https://autora.be/blog/${article.slug}`,
      datePublished: article.datePublished,
      dateModified: article.dateModified,
    }),
  ];

  const handleShare = async () => {
    const url = `https://autora.be/blog/${article.slug}`;
    if (navigator.share) {
      await navigator.share({ title: article.title, url });
    } else {
      await navigator.clipboard.writeText(url);
    }
  };

  return (
    <>
      <SEOHead
        title={article.title}
        description={article.description}
        image={article.image}
        url={`https://autora.be/blog/${article.slug}`}
        type="article"
        jsonLd={jsonLd}
      />
      <Header />
      <main className="min-h-screen bg-background pt-20 pb-24">
        <article className="max-w-3xl mx-auto px-4 sm:px-6">
          {/* Back link */}
          <Link
            to="/blog"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" /> Retour au blog
          </Link>

          {/* Hero image */}
          <div className="aspect-[2/1] rounded-xl overflow-hidden mb-8">
            <img
              src={article.image}
              alt={article.title}
              className="w-full h-full object-cover"
              fetchPriority="high"
            />
          </div>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <Badge variant="secondary">{article.category}</Badge>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="w-3.5 h-3.5" />
              {new Date(article.datePublished).toLocaleDateString("fr-BE", { day: "numeric", month: "long", year: "numeric" })}
            </span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3.5 h-3.5" />
              {article.readTime} min de lecture
            </span>
            <Button variant="ghost" size="sm" className="ml-auto" onClick={handleShare}>
              <Share2 className="w-4 h-4 mr-1" /> Partager
            </Button>
          </div>

          {/* Title */}
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold text-foreground leading-tight mb-8">
            {article.title}
          </h1>

          {/* Content — rendered as markdown-like HTML */}
          <div
            className="prose prose-sm sm:prose-base prose-invert max-w-none
              prose-headings:font-display prose-headings:text-foreground
              prose-p:text-muted-foreground prose-p:leading-relaxed
              prose-strong:text-foreground
              prose-li:text-muted-foreground
              prose-a:text-primary prose-a:no-underline hover:prose-a:underline"
            dangerouslySetInnerHTML={{ __html: markdownToHtml(article.content) }}
          />

          {/* CTA */}
          <div className="mt-12 p-6 rounded-xl border border-primary/20 bg-primary/5 text-center">
            <h2 className="text-lg font-display font-semibold text-foreground mb-2">
              Prêt à trouver votre voiture ?
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Parcourez des milliers de véhicules vérifiés sur AutoRa.
            </p>
            <Link to="/">
              <Button className="font-semibold">Rechercher un véhicule</Button>
            </Link>
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
};

/** Minimal markdown→HTML converter for static blog content */
function markdownToHtml(md: string): string {
  return md
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/^\- (.+)$/gm, '<li>$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li>$2</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, (m) => `<ul>${m}</ul>`)
    .replace(/^(?!<[hul])(.*\S.*)$/gm, '<p>$1</p>')
    .replace(/<p><\/p>/g, '');
}

export default BlogArticle;
