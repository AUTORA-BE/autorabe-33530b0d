import { useState, useEffect } from "react";
import { Star, User, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { format } from "date-fns";
import { fr, nl, enUS } from "date-fns/locale";

interface Review {
  id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

interface ReviewsSectionProps {
  carListingId: string;
  sellerId?: string;
}

const ReviewsSection = ({ carListingId, sellerId }: ReviewsSectionProps) => {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userHasReviewed, setUserHasReviewed] = useState(false);

  const dateLocale = language === "fr" ? fr : language === "nl" ? nl : enUS;

  useEffect(() => {
    const fetchData = async () => {
      // Get current user
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setCurrentUserId(session.user.id);
      }

      // Fetch reviews
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("car_listing_id", carListingId)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setReviews(data);
        // Check if user already reviewed
        if (session) {
          setUserHasReviewed(data.some((r: Review) => r.user_id === session.user.id));
        }
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
      <div className="rounded-3xl bg-card/40 backdrop-blur-xl border border-border/10 p-6 sm:p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-secondary rounded w-1/3"></div>
          <div className="h-20 bg-secondary rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl bg-card/40 backdrop-blur-xl border border-border/10 p-6 sm:p-8">
      <div className="flex items-center justify-between mb-7">
        <h2 className="font-serif text-lg sm:text-xl font-light text-foreground tracking-tight">
          {t("reviews.title")}
        </h2>
        {reviews.length > 0 && (
          <div className="flex items-center gap-2">
            <StarRating value={Math.round(averageRating)} />
            <span className="text-muted-foreground/60 text-sm font-light">
              ({reviews.length} {reviews.length === 1 ? t("reviews.review") : t("reviews.reviews")})
            </span>
          </div>
        )}
      </div>

      {/* Submit review form */}
      {currentUserId && currentUserId !== sellerId && !userHasReviewed && (
        <div className="mb-8 p-5 rounded-2xl bg-secondary/20 border border-border/10 space-y-4">
          <h3 className="font-light text-foreground tracking-tight">{t("reviews.leaveReview")}</h3>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground/60 font-light">{t("reviews.yourRating")}:</span>
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
        <div className="mb-8 p-5 rounded-2xl bg-secondary/20 border border-border/10 text-center">
          <p className="text-muted-foreground/60 font-light">{t("reviews.loginToReview")}</p>
        </div>
      )}

      {/* Reviews list */}
      {reviews.length === 0 ? (
        <p className="text-muted-foreground/50 text-center py-10 font-light">
          {t("reviews.noReviews")}
        </p>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="p-5 rounded-2xl bg-secondary/15 border border-border/5"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-primary/8 flex items-center justify-center">
                    <User className="w-4 h-4 text-primary" strokeWidth={1.5} />
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
              {review.comment && (
                <p className="text-foreground mt-3 pl-13">
                  {review.comment}
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
