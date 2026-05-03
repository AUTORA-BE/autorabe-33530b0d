/**
 * Global React Error Boundary — production grade
 * - Structured JSON logging (consistent shape with edge functions)
 * - Captures unhandled promise rejections (window-level)
 * - Plausible "Error" custom event for at-a-glance observability
 * - Elite Green fallback UI: retry / reload / home
 * - i18n: reads localStorage/URL to pick the right locale (no Router/Context dependency)
 *
 * NOTE: This boundary sits ABOVE the Router and LanguageProvider in main.tsx,
 * so it cannot use React hooks/contexts. We resolve translations manually.
 *
 * @module components/ErrorBoundary
 */

import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import frTranslations from "@/i18n/fr.json";

type Language = "fr" | "nl" | "de" | "en";
const SUPPORTED: Language[] = ["fr", "nl", "de", "en"];

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Custom fallback to render instead of the default UI. */
  fallback?: ReactNode;
  /** Callback fired when an error is caught (after logging). */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorId: string | null;
  translations: Record<string, string>;
}

/** Pick the active language without depending on the Router or LanguageContext. */
const detectLanguage = (): Language => {
  if (typeof window === "undefined") return "fr";
  const urlMatch = window.location.pathname.match(/^\/([a-z]{2})(?:\/|$)/);
  if (urlMatch && SUPPORTED.includes(urlMatch[1] as Language)) {
    return urlMatch[1] as Language;
  }
  const saved = localStorage.getItem("language");
  if (saved && SUPPORTED.includes(saved as Language)) {
    return saved as Language;
  }
  const browserLang = navigator.language.split("-")[0];
  if (SUPPORTED.includes(browserLang as Language)) return browserLang as Language;
  return "fr";
};

/** Structured logger — same JSON shape as edge functions. Returns the generated error_id. */
const logError = (
  step: string,
  error: Error,
  extra?: Record<string, unknown>,
): string => {
  const errorId = `err_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  const payload = {
    level: "error",
    fn: "react-error-boundary",
    step,
    ts: new Date().toISOString(),
    error_id: errorId,
    message: error.message,
    name: error.name,
    stack: error.stack?.split("\n").slice(0, 8).join("\n"),
    url: typeof window !== "undefined" ? window.location.pathname : undefined,
    ua: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
    ...extra,
  };
  // eslint-disable-next-line no-console
  console.error(JSON.stringify(payload));

  // Plausible custom event (no-op if not loaded)
  if (typeof window !== "undefined" && typeof window.plausible === "function") {
    try {
      window.plausible("Error", {
        props: {
          step,
          name: error.name,
          message: error.message.slice(0, 100),
        },
      });
    } catch {
      /* ignore — never let observability break the app */
    }
  }

  return errorId;
};

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private rejectionHandler?: (event: PromiseRejectionEvent) => void;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorId: null,
      translations: frTranslations as Record<string, string>,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error, errorId: null };
  }

  componentDidMount(): void {
    // Async-load the active locale (FR is bundled, others lazy-loaded)
    const lang = detectLanguage();
    if (lang !== "fr") {
      import(`@/i18n/${lang}.json`)
        .then((mod) => {
          this.setState({ translations: mod.default as Record<string, string> });
        })
        .catch(() => {
          /* keep FR fallback silently */
        });
    }

    // React doesn't catch unhandled promise rejections — wire a window listener.
    // We only LOG these (no fallback UI) because they're often transient (network).
    this.rejectionHandler = (event: PromiseRejectionEvent) => {
      const err =
        event.reason instanceof Error
          ? event.reason
          : new Error(
              typeof event.reason === "string"
                ? event.reason
                : "Unhandled promise rejection",
            );
      logError("unhandled_rejection", err);
    };
    window.addEventListener("unhandledrejection", this.rejectionHandler);
  }

  componentWillUnmount(): void {
    if (this.rejectionHandler) {
      window.removeEventListener("unhandledrejection", this.rejectionHandler);
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const errorId = logError("render_error", error, {
      component_stack: errorInfo.componentStack
        ?.split("\n")
        .slice(0, 5)
        .join("\n"),
    });
    this.setState({ errorId });
    this.props.onError?.(error, errorInfo);
  }

  private t = (key: string, fallback: string): string => {
    return this.state.translations[key] ?? fallback;
  };

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null, errorId: null });
  };

  handleReload = (): void => {
    window.location.reload();
  };

  handleHome = (): void => {
    window.location.href = "/";
  };

  render(): ReactNode {
    if (!this.state.hasError) return this.props.children;
    if (this.props.fallback) return this.props.fallback;

    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <div className="max-w-lg w-full text-center">
          <div className="w-20 h-20 rounded-2xl bg-destructive/10 flex items-center justify-center mb-6 mx-auto">
            <AlertTriangle
              className="w-10 h-10 text-destructive"
              strokeWidth={1.5}
            />
          </div>

          <h1 className="font-serif text-3xl font-semibold text-foreground mb-3">
            {this.t("errorBoundary.title", "Oups, quelque chose s'est mal passé")}
          </h1>

          <p className="text-muted-foreground mb-6">
            {this.t(
              "errorBoundary.description",
              "Une erreur inattendue est survenue. Vous pouvez réessayer ou recharger la page.",
            )}
          </p>

          {this.state.error && (
            <details className="text-left bg-muted rounded-lg p-4 mb-6 text-xs">
              <summary className="cursor-pointer text-muted-foreground font-medium">
                {this.t("errorBoundary.details", "Détails techniques")}
              </summary>
              <pre className="text-muted-foreground overflow-auto whitespace-pre-wrap break-words mt-2">
                {this.state.error.message}
              </pre>
              {this.state.errorId && (
                <p className="text-muted-foreground mt-2 font-mono">
                  ID: {this.state.errorId}
                </p>
              )}
            </details>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={this.handleRetry}
              variant="outline"
              className="min-h-[44px]"
            >
              <RefreshCw className="w-4 h-4 mr-2" strokeWidth={1.5} />
              {this.t("errorBoundary.retry", "Réessayer")}
            </Button>
            <Button
              onClick={this.handleReload}
              variant="outline"
              className="min-h-[44px]"
            >
              <RotateCw className="w-4 h-4 mr-2" strokeWidth={1.5} />
              {this.t("errorBoundary.reload", "Recharger la page")}
            </Button>
            <Button onClick={this.handleHome} className="min-h-[44px]">
              <Home className="w-4 h-4 mr-2" strokeWidth={1.5} />
              {this.t("errorBoundary.home", "Retour à l'accueil")}
            </Button>
          </div>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
