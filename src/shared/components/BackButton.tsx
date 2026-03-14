/**
 * Reusable back button with multilingual support
 * @module shared/components
 */

import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

interface BackButtonProps {
  /** Override default back behavior with specific path */
  to?: string;
  /** Custom label (overrides translation) */
  label?: string;
  className?: string;
}

/**
 * Back navigation button — uses browser history or explicit path
 */
export default function BackButton({ to, label, className = "" }: BackButtonProps) {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleClick = () => {
    if (to) {
      navigate(to);
    } else {
      navigate(-1);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
      className={`gap-1.5 text-muted-foreground hover:text-foreground rounded-lg ${className}`}
    >
      <ArrowLeft className="w-4 h-4" />
      {label || t("common.back")}
    </Button>
  );
}
