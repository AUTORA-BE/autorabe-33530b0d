import { useState, useEffect } from "react";
import { Star, User, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { format } from "date-fns";
import { fr, nl, enUS } from "date-fns/locale";
import AdminBadge from "@/components/AdminBadge";

interface Review {
  id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

interface ReviewerProfile {
  display_name: string | null;
  avatar_url: string | null;
  is_admin: boolean;
}

interface ReviewsSectionProps {
  carListingId: string;
  sellerId?: string;
}

const ReviewsSection = ({ carListingId, sellerId }: ReviewsSectionProps) => {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewers, setReviewers] = useState<Record<string, ReviewerProfile>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userHasReviewed, setUserHasReviewed] = useState(false);

  const dateLocale = language === "fr" ? fr : language === "nl" ? nl : enUS;

  const loadReviewerProfiles = async (userIds: string[]) => {
    if (userIds.length === 0) return;
    const { data } = await (supabase.rpc as any)("get_reviewers_profiles", { _user_ids: userIds });
    if (data) {
      const map: Record<string, ReviewerProfile> = {};
      for (const r of data as Array<{ user_id: string; display_name: string | null; avatar_url: string | null; is_admin: boolean }>) {
        map[r.user_id] = { display_name: r.display_name, avatar_url: r.avatar_url, is_admin: !!r.is_admin };
      }
      setReviewers(prev => ({ ...prev, ...map }));
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setCurrentUserId(session.user.id);
      }

      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("car_listing_id", carListingId)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setReviews(data);
        if (session) {
          setUserHasReviewed(data.some((r: Review) => r.user_id === session.user.id));
        }
        await loadReviewerProfiles([...new Set(data.map((r: Review) => r.user_id))]);
      }
      setIsLoading(false);
    };

    fetchData();
  }, [carListingId]);

  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  const handleSubmit = async () => {
    if (!currentUserId) {
      toast({
        title: t("reviews.loginRequired"),
        description: t("reviews.loginRequiredDesc"),
      });
      return;
    }

    if (rating === 0) {
      toast({
        title: t("reviews.ratingRequired"),
        variant: "destructive",
      });
      return;
    }

    // Can't review own listing
    if (currentUserId === sellerId) {
      toast({
        title: t("reviews.cannotReviewOwn"),
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    const { data, error } = await supabase
      .from("reviews")
      .insert({
        car_listing_id: carListingId,
        user_id: currentUserId,
        rating,
        comment: comment.trim() || null,
      })
      .select()
      .single();

    setIsSubmitting(false);

    if (error) {
      toast({
        title: t("reviews.error"),
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    if (data) {
      setReviews([data, ...reviews]);
      setUserHasReviewed(true);
      setRating(0);
      setComment("");
      toast({
        title: t("reviews.submitted"),
        description: t("reviews.submittedDesc"),
      });
    }
  };

  const handleDelete = async (reviewId: string) => {
    const { error } = await supabase
      .from("reviews")
      .delete()
      .eq("id", reviewId);

    if (error) {
      toast({
        title: t("reviews.error"),
        variant: "destructive",
      });
      return;
    }

    setReviews(reviews.filter(r => r.id !== reviewId));
    setUserHasReviewed(false);
    toast({
      title: t("reviews.deleted"),
    });
  };

  const StarRating = ({ value, interactive = false }: { value: number; interactive?: boolean }) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onClick={() => interactive && setRating(star)}
          onMouseEnter={() => interactive && setHoverRating(star)}
          onMouseLeave={() => interactive && setHoverRating(0)}
          className={interactive ? "cursor-pointer transition-transform hover:scale-110" : "cursor-default"}
        >
          <Star
            className={`w-5 h-5 ${
              star <= (interactive ? (hoverRating || value) : value)
                ? "fill-yellow-400 text-yellow-400"
                : "text-muted-foreground"
            }`}
          />
        </button>
      ))}
    </div>
  );

  if (isLoading) {
    return (
      <div className="glass-card p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-secondary rounded w-1/3"></div>
          <div className="h-20 bg-secondary rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-xl font-bold text-foreground">
          {t("reviews.title")}
        </h2>
        {reviews.length > 0 && (
          <div className="flex items-center gap-2">
            <StarRating value={Math.round(averageRating)} />
            <span className="text-muted-foreground">
              ({reviews.length} {reviews.length === 1 ? t("reviews.review") : t("reviews.reviews")})
            </span>
          </div>
        )}
      </div>

      {/* Submit review form */}
      {currentUserId && currentUserId !== sellerId && !userHasReviewed && (
        <div className="mb-8 p-4 rounded-xl bg-secondary space-y-4">
          <h3 className="font-semibold text-foreground">{t("reviews.leaveReview")}</h3>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">{t("reviews.yourRating")}:</span>
            <StarRating value={rating} interactive />
          </div>
          <Textarea
            placeholder={t("reviews.commentPlaceholder")}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="resize-none"
            rows={3}
          />
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || rating === 0}
            className="btn-primary-gradient"
          >
            {isSubmitting ? t("reviews.submitting") : t("reviews.submit")}
          </Button>
        </div>
      )}

      {/* Login prompt */}
      {!currentUserId && (
        <div className="mb-8 p-4 rounded-xl bg-secondary text-center">
          <p className="text-muted-foreground">{t("reviews.loginToReview")}</p>
        </div>
      )}

      {/* Reviews list */}
      {reviews.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">
          {t("reviews.noReviews")}
        </p>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="p-4 rounded-xl bg-secondary"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <StarRating value={review.rating} />
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(review.created_at), "dd MMMM yyyy", { locale: dateLocale })}
                    </p>
                  </div>
                </div>
                {currentUserId === review.user_id && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(review.id)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
              {review.comment ? (
                <p className="text-foreground mt-3 pl-13">
                  {review.comment}
                </p>
              ) : (
                <p className="text-muted-foreground/70 italic text-sm mt-3 pl-13">
                  {t("reviews.noComment")}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReviewsSection;
