import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "./ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

interface ErrorStateProps {
  error?: string;
  onRetry?: () => void;
}

const ErrorState = ({ error, onRetry }: ErrorStateProps) => {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col items-center justify-center py-16 sm:py-20 text-center">
      <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-6 rounded-full bg-destructive/10 flex items-center justify-center">
        <AlertCircle className="w-8 h-8 sm:w-10 sm:h-10 text-destructive" />
      </div>
      <h3 className="font-display text-lg sm:text-xl font-bold text-foreground mb-2">
        {t("error.loadingFailed")}
      </h3>
      <p className="text-muted-foreground max-w-md mx-auto text-sm sm:text-base px-4 mb-6">
        {error || t("error.tryAgain")}
      </p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline" className="gap-2">
          <RefreshCw className="w-4 h-4" />
          {t("error.retry")}
        </Button>
      )}
    </div>
  );
};

export default ErrorState;
