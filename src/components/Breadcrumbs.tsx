/**
 * Premium breadcrumb navigation with glassmorphism and JSON-LD structured data
 * Optimized for mobile (compact, scrollable) and desktop (full display)
 * @module components
 */

import { Link } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import { breadcrumbSchema } from "@/lib/seoSchemas";

interface BreadcrumbItem {
  label: string;
  to?: string;
  /** Full URL for JSON-LD (defaults to https://autora.be + to) */
  url?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export default function Breadcrumbs({ items, className = "" }: BreadcrumbsProps) {
  const schemaItems = items.map((item) => ({
    name: item.label,
    url: item.url || `https://autora.be${item.to || ""}`,
  }));

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema(schemaItems)) }}
      />

      <nav
        aria-label="Breadcrumb"
        className={`
          inline-flex items-center gap-1.5 sm:gap-2
          px-3 py-1.5 sm:px-4 sm:py-2
          rounded-full
          bg-card/60 backdrop-blur-md
          border border-border/50
          shadow-sm
          text-xs sm:text-sm
          max-w-full overflow-x-auto scrollbar-hide
          ${className}
        `}
      >
        {items.map((item, i) => {
          const isLast = i === items.length - 1;

          return (
            <span key={i} className="inline-flex items-center gap-1 sm:gap-1.5 shrink-0">
              {i > 0 && (
                <ChevronRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-primary/40 shrink-0" />
              )}

              {i === 0 && item.to ? (
                <Link
                  to={item.to}
                  className="inline-flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors duration-200"
                  aria-label="Accueil"
                >
                  <Home className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              ) : isLast || !item.to ? (
                <span
                  className="text-foreground font-semibold truncate max-w-[140px] sm:max-w-[220px]"
                  aria-current="page"
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  to={item.to}
                  className="text-muted-foreground hover:text-primary transition-colors duration-200 truncate max-w-[100px] sm:max-w-[160px]"
                >
                  {item.label}
                </Link>
              )}
            </span>
          );
        })}
      </nav>
    </>
  );
}
