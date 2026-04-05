/**
 * Visual breadcrumb navigation with JSON-LD structured data
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
      {/* JSON-LD (rendered via script tag) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema(schemaItems)) }}
      />

      <nav
        aria-label="Breadcrumb"
        className={`flex items-center gap-1 text-sm flex-wrap ${className}`}
      >
        {items.map((item, i) => {
          const isLast = i === items.length - 1;

          return (
            <span key={i} className="inline-flex items-center gap-1">
              {i === 0 && (
                <Home className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              )}
              {i > 0 && (
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />
              )}
              {isLast || !item.to ? (
                <span
                  className="text-foreground font-medium truncate max-w-[180px]"
                  aria-current="page"
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  to={item.to}
                  className="text-muted-foreground hover:text-foreground transition-colors truncate max-w-[140px]"
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
