/**
 * Home reviews section — real data only.
 * Reads the `reviews` table (rating >= 4, 6 most recent) and shows an
 * honest empty state when there is nothing yet. Never renders fake reviews.
 */

import { useEffect, useState } from "react";
import { Star, ShieldCheck, MessageSquareQuote } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";

interface HomeReview {
  id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

const initialOf = (name?: string | null) => {
  const trimmed = (name ?? "").trim();
  return trimmed ? trimmed[0].toUpperCase() : "?";
};

const HomeReviewsSection = () => {
  const { t, language } = useLanguage();
  const [reviews, setReviews] = useState<HomeReview[]>([]);
  const [initials, setInitials] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const load = async () => {
      const { data } = await supabase
        .from("reviews")
        .select("id, user_id, rating, comment, created_at")
        .gte("rating", 4)
        .order("created_at", { ascending: false })
        .limit(6);

      if (!active) return;
      const rows = (data ?? []) as HomeReview[];
      setReviews(rows);
      setIsLoading(false);

      if (rows.length > 0) {
        const ids = [...new Set(rows.map((r) => r.user_id))];
        const { data: profiles } = await (supabase.rpc as any)("get_reviewers_profiles", {
          _user_ids: ids,
        });
        if (!active || !profiles) return;
        const map: Record<string, string> = {};
        for (const p of profiles as Array<{ user_id: string; display_name: string | null }>) {
          map[p.user_id] = initialOf(p.display_name);
        }
        setInitials(map);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, []);

  if (isLoading) return null;

  return (
    <section className="py-12 sm:py-20">
      <div className="container mx-auto px-5 sm:px-8">
        <div className="max-w-2xl mb-8 sm:mb-12 space-y-3">
          <p className="text-[10.5px] font-medium uppercase tracking-[0.22em] text-primary/85">
            {t("homeReviews.eyebrow")}
          </p>
          <h2 className="text-2xl sm:text-4xl font-light tracking-tight text-foreground">
            {t("homeReviews.title")}
          </h2>
          <p className="text-[13.5px] sm:text-base font-light leading-relaxed text-muted-foreground">
            {t("homeReviews.subtitle")}
          </p>
        </div>

        {reviews.length === 0 ? (
          <div className="rounded-3xl border border-border/40 bg-card/30 p-8 sm:p-12 text-center max-w-2xl mx-auto">
            <div className="mx-auto mb-5 w-12 h-12 rounded-2xl bg-primary/10 border border-primary/15 flex items-center justify-center">
              <MessageSquareQuote className="w-5 h-5 text-primary" strokeWidth={1.5} />
            </div>
            <h3 className="font-display text-xl text-foreground">{t("homeReviews.emptyTitle")}</h3>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              {t("homeReviews.emptyText")}
            </p>
            <p className="mt-4 inline-flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="w-3.5 h-3.5 text-primary" strokeWidth={1.5} />
              {t("homeReviews.emptyVerified")}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {reviews.map((review) => (
              <article
                key={review.id}
                className="rounded-3xl border border-border/40 bg-card/30 p-6 flex flex-col gap-4"
              >
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${
                        star <= review.rating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-muted-foreground/40"
                      }`}
                      strokeWidth={1.5}
                    />
                  ))}
                </div>
                {review.comment && (
                  <p className="text-sm text-foreground/90 leading-relaxed">{review.comment}</p>
                )}
                <div className="mt-auto flex items-center gap-3 pt-2">
                  <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/15 flex items-center justify-center text-sm font-medium text-primary">
                    {initials[review.user_id] ?? "?"}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(review.created_at).toLocaleDateString(
                      language === "fr" ? "fr-BE" : language === "nl" ? "nl-BE" : language === "de" ? "de-BE" : "en-GB",
                      { day: "2-digit", month: "long", year: "numeric" },
                    )}
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default HomeReviewsSection;
