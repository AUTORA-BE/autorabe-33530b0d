/**
 * HeroImage — LCP-optimized image for the hero/banner slot of a car page.
 *
 * Best practices applied :
 *   - Explicit `width`/`height` → no Cumulative Layout Shift (CLS).
 *   - `loading="eager"` + `fetchpriority="high"` on the hero (LCP candidate).
 *   - `decoding="async"` to keep the main thread free.
 *   - `<picture>` with WebP/AVIF sources when a Cloudflare/Supabase image CDN
 *      transform is reachable (auto-detected from URL).
 *   - Dynamic `srcSet` for 1x/2x/3x density and a typed `sizes` attribute.
 *   - Dynamic `alt` built from the vehicle headline (a11y + SEO).
 *
 * Use for the FIRST visible image of a car detail page. For gallery thumbnails,
 * keep using the existing CarImage component (lazy + blur placeholder).
 *
 * @module components/seo
 */

import { memo } from "react";

interface HeroImageProps {
  /** Original/source URL of the car photo. */
  src: string;
  /** Dynamic, descriptive alt: `${year} ${brand} ${model}` etc. */
  alt: string;
  /** Intrinsic width in CSS pixels (used for CLS reservation). Default 1600. */
  width?: number;
  /** Intrinsic height (16:9 default → 900). */
  height?: number;
  /** `sizes` attribute — defaults to a sensible responsive value. */
  sizes?: string;
  /** Extra classes for the <img>. */
  className?: string;
  /** Object-fit class override. Default `object-cover object-center`. */
  fit?: string;
  /** When true (default), preloads + eager + high priority — only the LCP image. */
  isLcp?: boolean;
}

/**
 * Try to derive WebP / AVIF variants from a Supabase or Cloudflare Image URL.
 * Returns null when the URL is unrecognized (no transform applied — original served).
 */
function deriveOptimizedUrl(src: string, format: "webp" | "avif", width: number): string | null {
  // Supabase Storage Render-Transform pattern :
  //   https://<proj>.supabase.co/storage/v1/render/image/public/<bucket>/<path>?width=…&format=webp
  if (/supabase\.co\/storage\/v1\/(render\/image|object)\/public\//.test(src)) {
    const rendered = src.replace(
      /\/storage\/v1\/object\/public\//,
      "/storage/v1/render/image/public/",
    );
    const sep = rendered.includes("?") ? "&" : "?";
    return `${rendered}${sep}width=${width}&format=${format}&quality=80`;
  }

  // Cloudflare Images / Cloudflare R2 with /cdn-cgi/image transform :
  //   /cdn-cgi/image/format=webp,width=1600,quality=80/<origin-url>
  if (/^https?:\/\/[^/]+\/cdn-cgi\/image\//.test(src)) {
    return src.replace(
      /\/cdn-cgi\/image\/[^/]+\//,
      `/cdn-cgi/image/format=${format},width=${width},quality=80/`,
    );
  }

  // Unsplash / Cloudinary-style query params
  if (/images\.unsplash\.com/.test(src)) {
    const sep = src.includes("?") ? "&" : "?";
    return `${src}${sep}fm=${format}&w=${width}&q=80&auto=format`;
  }

  return null;
}

function buildSrcSet(src: string, format: "webp" | "avif" | "original"): string | undefined {
  const widths = [640, 960, 1280, 1600, 1920];
  const entries = widths
    .map((w) => {
      if (format === "original") return `${src} ${w}w`;
      const url = deriveOptimizedUrl(src, format, w);
      return url ? `${url} ${w}w` : null;
    })
    .filter(Boolean);
  return entries.length ? entries.join(", ") : undefined;
}

export const HeroImage = memo(function HeroImage({
  src,
  alt,
  width = 1600,
  height = 900,
  sizes = "(min-width: 1024px) 60vw, 100vw",
  className = "",
  fit = "object-cover object-center",
  isLcp = true,
}: HeroImageProps) {
  const webpSrcSet = buildSrcSet(src, "webp");
  const avifSrcSet = buildSrcSet(src, "avif");
  const fallbackSrcSet = buildSrcSet(src, "original");

  return (
    <picture>
      {avifSrcSet && (
        <source type="image/avif" srcSet={avifSrcSet} sizes={sizes} />
      )}
      {webpSrcSet && (
        <source type="image/webp" srcSet={webpSrcSet} sizes={sizes} />
      )}
      <img
        src={src}
        srcSet={fallbackSrcSet}
        sizes={sizes}
        alt={alt}
        width={width}
        height={height}
        loading={isLcp ? "eager" : "lazy"}
        decoding={isLcp ? "sync" : "async"}
        // fetchpriority is valid HTML but not yet typed on React's HTMLImageElement
        {...({ fetchpriority: isLcp ? "high" : "auto" } as { fetchpriority: "high" | "auto" })}
        className={`w-full h-full ${fit} ${className}`}
        draggable={false}
      />
    </picture>
  );
});

export default HeroImage;
