import { useEffect, useMemo, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { sanitizeMultilineInput } from "@/lib/security";

interface RichDescriptionProps {
  /** Raw description text from DB. May contain newlines. */
  description: string | null | undefined;
  /** Smaller variant for mobile tab */
  compact?: boolean;
}

/** Threshold below which a description is flagged as "short" (vendor hint) */
const SHORT_DESCRIPTION_THRESHOLD = 80;
/** Max collapsed visible height in px */
const MAX_COLLAPSED_HEIGHT = 200;

const RichDescription = ({ description, compact = false }: RichDescriptionProps) => {
  const { t } = useLanguage();
  const contentRef = useRef<HTMLParagraphElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [expanded, setExpanded] = useState(false);

  // Strip HTML/scripts before rendering — protects against legacy DB rows
  // that might contain `<script>` or inline handlers from before server-side
  // sanitization was wired in create-listing / sync-vehicle-content.
  const text = useMemo(() => sanitizeMultilineInput(description ?? "", 5000), [description]);
  const isShort = text.length > 0 && text.length < SHORT_DESCRIPTION_THRESHOLD;

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    // Compare the element's natural scrollHeight to the cap
    setIsOverflowing(el.scrollHeight > MAX_COLLAPSED_HEIGHT + 4);
  }, [text]);

  return (
    <div className={`glass-card ${compact ? "p-5" : "p-6 sm:p-7"}`}>
      <div className="flex items-center justify-between gap-3 mb-3 sm:mb-4 flex-wrap">
        <div className="flex items-center gap-2">
          <h2 className={`font-display font-bold text-foreground ${compact ? "text-lg" : "text-xl"}`}>
            {t("carDetail.description.title")}
          </h2>
          {isShort && (
            <Badge
              variant="outline"
              className="border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] uppercase tracking-wider font-medium"
            >
              {t("carDetail.description.shortBadge")}
            </Badge>
          )}
        </div>
      </div>

      {text.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">
          {t("carDetail.description.empty")}
        </p>
      ) : (
        <>
          <p
            ref={contentRef}
            className={`text-muted-foreground leading-relaxed whitespace-pre-line ${
              compact ? "text-sm" : "text-sm sm:text-base"
            } overflow-hidden transition-[max-height] duration-300 ease-out`}
            style={{ maxHeight: expanded ? `${contentRef.current?.scrollHeight ?? 9999}px` : `${MAX_COLLAPSED_HEIGHT}px` }}
          >
            {text}
          </p>

          {isOverflowing && (
            <div className="mt-3 flex">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setExpanded((v) => !v)}
                className="text-primary hover:text-primary hover:bg-primary/10 -ml-2 h-8"
              >
                {expanded ? (
                  <>
                    <ChevronUp className="w-4 h-4 mr-1.5" />
                    {t("carDetail.description.readLess")}
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4 mr-1.5" />
                    {t("carDetail.description.readMore")}
                  </>
                )}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default RichDescription;
