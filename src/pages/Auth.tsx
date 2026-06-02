/**
 * Authentication Page — simplified single-flow signup with "Je suis un professionnel"
 * checkbox. Pro signups are queued for manual admin validation.
 * @module pages/Auth
 */

import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import SEOHead from "@/components/SEOHead";
import { supabase } from "@/integrations/supabase/client";
import {
  Mail, Lock, User, Eye, EyeOff, ArrowLeft, CheckCircle, Phone, Building2, MapPin,
  ShieldCheck, BadgeCheck, MapPinned, FileBadge,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth, usePasswordValidation } from "@/features/auth";
import { z } from "zod";
import { trackEvent, EVENTS } from "@/lib/analytics";

const Auth = () => {
  const initialTab = typeof window !== "undefined"
    ? new URLSearchParams(window.location.search).get("tab")
    : null;
  const [isLogin, setIsLogin] = useState(initialTab !== "signup");
  const [isForgotPassword, setIsForgotPassword] = useState(false);

  // Single signup form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [isPro, setIsPro] = useState(false);
  const [garageName, setGarageName] = useState("");
  const [bceNumber, setBceNumber] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [verificationEmailSent, setVerificationEmailSent] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [errors, setErrors] = useState<{
    email?: string; password?: string; name?: string; phone?: string; garage?: string;
  }>({});

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { t, language } = useLanguage();

  const { user, isLoading: authLoading, signIn, signUp, signInWithGoogle, signInWithApple, resetPassword } = useAuth();
  const passwordValidation = usePasswordValidation(password);

  const emailSchema = z.string().email(t("auth.invalidEmail"));
  const nameSchema = z.string().trim().min(2, t("auth.nameMin"));

  // Redirect signed-in users
  useEffect(() => {
    if (!user) return;
    const rawReturnTo = searchParams.get("returnTo");
    const safeReturnTo = rawReturnTo && rawReturnTo.startsWith("/") && !rawReturnTo.startsWith("//")
      ? rawReturnTo : null;
    (async () => {
      if (safeReturnTo) {
        navigate(safeReturnTo, { replace: true });
        return;
      }
      const { data } = await supabase
        .from("user_roles").select("role")
        .eq("user_id", user.id).eq("role", "admin").maybeSingle();
      navigate(data ? "/admin" : "/", { replace: true });
    })();
  }, [user, navigate, searchParams]);

  const validateForm = () => {
    const newErrors: typeof errors = {};

    try { emailSchema.parse(email); }
    catch (e) { if (e instanceof z.ZodError) newErrors.email = e.errors[0].message; }

    if (!isLogin && !passwordValidation.isValid) {
      if (!passwordValidation.minLength) newErrors.password = t("auth.passwordMinStrong");
      else if (!passwordValidation.hasUppercase) newErrors.password = t("auth.passwordUppercase");
      else if (!passwordValidation.hasLowercase) newErrors.password = t("auth.passwordLowercase");
      else if (!passwordValidation.hasNumber) newErrors.password = t("auth.passwordNumber");
      else if (!passwordValidation.hasSpecial) newErrors.password = t("auth.passwordSpecial");
    } else if (isLogin && password.length < 1) {
      newErrors.password = t("auth.passwordRequired");
    }

    if (!isLogin) {
      try { nameSchema.parse(fullName); }
      catch (e) { if (e instanceof z.ZodError) newErrors.name = e.errors[0].message; }

      // Phone optional → only validate when filled
      if (phone.trim().length > 0) {
        const phoneDigits = phone.replace(/[\s\-()]/g, "");
        if (!/^\+?\d{8,15}$/.test(phoneDigits)) {
          newErrors.phone = language === "nl"
            ? "Geldig telefoonnummer vereist"
            : "Numéro de téléphone invalide";
        }
      }

      if (isPro && garageName.trim().length < 2) {
        newErrors.garage = language === "nl"
          ? "Naam van de garage is vereist"
          : "Le nom du garage est requis";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (!isLogin && !acceptedTerms) {
      toast({
        title: language === "fr" ? "Veuillez accepter les conditions" : "Please accept the terms",
        description: language === "fr"
          ? "Vous devez accepter les CGU et la politique de confidentialité."
          : "You must accept the Terms and Privacy Policy.",
        variant: "destructive",
      });
      return;
    }

    if (isLogin) {
      const result = await signIn({ email, password });
      if (!result.success && result.error) {
        toast({
          title: t("auth.errorLogin"),
          description: result.error.type === "invalid_credentials"
            ? t("auth.errorCredentials") : result.error.message,
          variant: "destructive",
        });
      } else {
        trackEvent(EVENTS.LOGIN_COMPLETED, { method: "email" });
        toast({ title: t("auth.welcome"), description: t("auth.loginSuccess") });
      }
      return;
    }

    trackEvent(EVENTS.SIGNUP_STARTED, {
      method: "email",
      account_type: isPro ? "pro" : "private",
    });

    const result = await signUp({
      email,
      password,
      fullName: fullName.trim(),
      phone: phone.trim() ? phone.replace(/[\s\-()]/g, "") : undefined,
      postalCode: postalCode.trim() || undefined,
      userType: isPro ? "professionnel" : "particulier",
      garageName: isPro ? garageName.trim() : undefined,
      bceNumber: isPro && bceNumber.trim() ? bceNumber.trim() : undefined,
    });

    if (!result.success && result.error) {
      toast({
        title: result.error.type === "user_exists" ? t("auth.accountExists") : t("auth.error"),
        description: result.error.type === "user_exists"
          ? t("auth.accountExistsDesc") : result.error.message,
        variant: "destructive",
      });
      return;
    }

    trackEvent(EVENTS.SIGNUP_COMPLETED, {
      method: "email",
      account_type: isPro ? "pro" : "private",
    });

    setVerificationEmailSent(true);
    toast({
      title: "Bienvenue sur AutoRA !",
      description: isPro
        ? "Vérifiez votre email. Votre profil professionnel sera validé sous 24h."
        : "Vérifiez votre email pour activer votre compte.",
    });
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { email?: string } = {};
    try { emailSchema.parse(email); }
    catch (e) { if (e instanceof z.ZodError) newErrors.email = e.errors[0].message; }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors); return;
    }
    const result = await resetPassword(email);
    if (!result.success && result.error) {
      toast({ title: t("auth.error"), description: result.error.message, variant: "destructive" });
    } else {
      setResetEmailSent(true);
      toast({ title: t("auth.resetEmailSent"), description: t("auth.resetEmailSentDesc") });
    }
  };

  const handleGoogleAuth = async () => {
    trackEvent(isLogin ? EVENTS.LOGIN_COMPLETED : EVENTS.SIGNUP_STARTED, { method: "google" });
    const result = await signInWithGoogle();
    if (!result.success && result.error) {
      toast({ title: t("auth.error"), description: result.error.message, variant: "destructive" });
    }
  };

  const handleAppleAuth = async () => {
    trackEvent(isLogin ? EVENTS.LOGIN_COMPLETED : EVENTS.SIGNUP_STARTED, { method: "apple" });
    const result = await signInWithApple();
    if (!result.success && result.error) {
      toast({ title: t("auth.error"), description: result.error.message, variant: "destructive" });
    }
  };

  const handleResendVerification = async () => {
    setResendLoading(true);
    try {
      const { error } = await supabase.auth.resend({ type: "signup", email });
      if (error) {
        toast({ title: t("auth.error"), description: error.message, variant: "destructive" });
      } else {
        toast({ title: t("auth.resendSuccess"), description: t("auth.resendSuccessDesc") });
        setResendCooldown(60);
        const interval = setInterval(() => {
          setResendCooldown((prev) => {
            if (prev <= 1) { clearInterval(interval); return 0; }
            return prev - 1;
          });
        }, 1000);
      }
    } catch {
      toast({ title: t("auth.error"), description: t("auth.unexpectedError"), variant: "destructive" });
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="page-gradient flex">
      <SEOHead noIndex />
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-secondary" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-primary/5 rounded-full blur-3xl animate-float" style={{ animationDelay: "-3s" }} />
        <div className="relative z-10 flex flex-col justify-center p-12">
          <div className="mb-10">
            <span className="font-display text-3xl font-bold tracking-wider">
              <span className="text-foreground">Auto</span>
              <span className="text-primary">RA</span>
            </span>
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-6 tracking-tight leading-tight">
            {t("auth.heroTitle")}
          </h1>
          <p className="text-lg text-muted-foreground max-w-md mb-10">
            {t("auth.heroSubtitle")}
          </p>
          <div className="flex flex-wrap gap-3 max-w-md">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm">
              <BadgeCheck className="w-4 h-4" strokeWidth={1.5} /> Car-Pass
            </span>
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm">
              <MapPinned className="w-4 h-4" strokeWidth={1.5} /> LEZ Belgique
            </span>
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm">
              <ShieldCheck className="w-4 h-4" strokeWidth={1.5} /> {t("auth.proAndPrivate")}
            </span>
          </div>
        </div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md">
          <div className="flex lg:hidden items-center justify-center mb-8">
            <span className="font-display text-2xl font-bold tracking-wider">
              <span className="text-foreground">Auto</span>
              <span className="text-primary">RA</span>
            </span>
          </div>

          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            {t("auth.backHome")}
          </button>

          <div className="glass-panel p-8">
            {verificationEmailSent ? (
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
                  <Mail className="w-8 h-8 text-primary" />
                </div>
                <h2 className="font-display text-2xl font-bold text-foreground mb-2">
                  {t("auth.verificationEmailSent")}
                </h2>
                <p className="text-muted-foreground mb-6">
                  {t("auth.verificationEmailSentDesc")}
                </p>
                <p className="text-sm text-muted-foreground mb-6">{t("auth.checkSpam")}</p>
                <div className="space-y-3">
                  <Button
                    onClick={handleResendVerification}
                    className="w-full h-12 btn-primary-gradient"
                    disabled={resendLoading || resendCooldown > 0}
                  >
                    {resendLoading ? t("auth.loading")
                      : resendCooldown > 0 ? `${t("auth.resendEmail")} (${resendCooldown}s)`
                      : t("auth.resendEmail")}
                  </Button>
                  <Button
                    onClick={() => { setVerificationEmailSent(false); setIsLogin(true); }}
                    variant="outline" className="w-full h-12"
                  >
                    {t("auth.backToLogin")}
                  </Button>
                </div>
              </div>
            ) : resetEmailSent ? (
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-8 h-8 text-primary" />
                </div>
                <h2 className="font-display text-2xl font-bold text-foreground mb-2">
                  {t("auth.resetEmailSent")}
                </h2>
                <p className="text-muted-foreground mb-6">{t("auth.resetEmailSentDesc")}</p>
                <Button
                  onClick={() => { setResetEmailSent(false); setIsForgotPassword(false); }}
                  variant="outline" className="w-full h-12"
                >
                  {t("auth.backToLogin")}
                </Button>
              </div>
            ) : isForgotPassword ? (
              <>
                <h2 className="font-display text-2xl font-bold text-foreground mb-2">
                  {t("auth.forgotPassword")}
                </h2>
                <p className="text-muted-foreground mb-8">{t("auth.forgotPasswordDesc")}</p>
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="forgot-email" type="email" aria-label={t("auth.email")}
                        placeholder={t("auth.email")} value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 h-12 bg-secondary/50 border-border/50 focus:border-primary"
                      />
                    </div>
                    {errors.email && <p className="text-destructive text-sm mt-1">{errors.email}</p>}
                  </div>
                  <Button type="submit" className="w-full h-12 btn-primary-gradient" disabled={authLoading}>
                    {authLoading ? t("auth.loading") : t("auth.sendResetLink")}
                  </Button>
                </form>
                <p className="text-center text-muted-foreground mt-6">
                  <button
                    type="button"
                    onClick={() => { setIsForgotPassword(false); setErrors({}); }}
                    className="text-primary hover:underline font-medium"
                  >
                    {t("auth.backToLogin")}
                  </button>
                </p>
              </>
            ) : (
              <>
                <h2 className="font-display text-3xl font-bold text-foreground mb-2 tracking-tight">
                  {isLogin ? t("auth.login") : t("auth.signup")}
                </h2>
                <p className="text-muted-foreground mb-8">
                  {isLogin ? t("auth.loginSubtitle") : t("auth.signupSubtitle")}
                </p>

                {/* OAuth (unchanged) */}
                <div className="flex flex-col gap-3 mb-6">
                  <Button
                    type="button" variant="outline"
                    className="w-full h-12 bg-secondary/50 border-border/50 hover:bg-secondary text-foreground"
                    onClick={handleGoogleAuth} disabled={authLoading}
                  >
                    <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.19 3.32v2.77h3.54c2.08-1.92 3.28-4.74 3.28-8.1z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.54-2.77c-.98.66-2.23 1.06-3.74 1.06-2.87 0-5.31-1.94-6.18-4.56H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.82 14.07a6.96 6.96 0 0 1 0-4.14V7.09H2.18C1.43 8.55 1 10.2 1 12s.43 3.45 1.18 4.91l2.85-2.22.79-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.09l3.64 2.84c.87-2.62 3.31-4.55 6.18-4.55z" />
                    </svg>
                    Continuer avec Google
                  </Button>
                  <Button
                    type="button" variant="outline"
                    className="w-full h-12 bg-secondary/50 border-border/50 hover:bg-secondary text-foreground"
                    onClick={handleAppleAuth} disabled={authLoading}
                  >
                    <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                    </svg>
                    {t("auth.continueApple")}
                  </Button>
                </div>

                <div className="flex items-center gap-4 mb-6">
                  <div className="flex-1 h-px bg-border/50" />
                  <span className="text-muted-foreground text-sm">{t("auth.or")}</span>
                  <div className="flex-1 h-px bg-border/50" />
                </div>

                <form onSubmit={handleEmailAuth} className="space-y-4">
                  {/* Signup-only fields */}
                  {!isLogin && (
                    <>
                      <div>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                          <Input
                            id="signup-name" type="text" aria-label={t("auth.fullName")}
                            placeholder={t("auth.fullName")} value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="pl-10 h-12 bg-secondary/50 border-border/50 focus:border-primary focus:ring-primary/30 transition-colors"
                            autoComplete="name" required
                          />
                        </div>
                        {errors.name && <p className="text-destructive text-sm mt-1">{errors.name}</p>}
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                            <Input
                              id="signup-phone" type="tel"
                              aria-label="Téléphone (optionnel)"
                              placeholder="+32 470 12 34 56" value={phone}
                              onChange={(e) => setPhone(e.target.value)}
                              className="pl-10 h-12 bg-secondary/50 border-border/50 focus:border-primary focus:ring-primary/30 transition-colors"
                              autoComplete="tel"
                            />
                          </div>
                          {errors.phone && <p className="text-destructive text-sm mt-1">{errors.phone}</p>}
                        </div>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                          <Input
                            id="signup-postal" type="text"
                            aria-label="Code postal (optionnel)"
                            placeholder="Code postal" value={postalCode}
                            onChange={(e) => setPostalCode(e.target.value)} maxLength={5}
                            className="pl-10 h-12 bg-secondary/50 border-border/50 focus:border-primary focus:ring-primary/30 transition-colors"
                            autoComplete="postal-code"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {/* Email + Password (always) */}
                  <div>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="auth-email" type="email" aria-label={t("auth.email")}
                        placeholder={t("auth.email")} value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 h-12 bg-secondary/50 border-border/50 focus:border-primary focus:ring-primary/30 transition-colors"
                        autoComplete="email" required
                      />
                    </div>
                    {errors.email && <p className="text-destructive text-sm mt-1">{errors.email}</p>}
                  </div>

                  <div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="auth-password"
                        type={showPassword ? "text" : "password"}
                        aria-label={t("auth.password")}
                        placeholder={t("auth.password")} value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 pr-10 h-12 bg-secondary/50 border-border/50 focus:border-primary focus:ring-primary/30 transition-colors"
                        autoComplete={isLogin ? "current-password" : "new-password"} required
                      />
                      <button
                        type="button" onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {errors.password && <p className="text-destructive text-sm mt-1">{errors.password}</p>}

                    {!isLogin && password.length > 0 && (
                      <div className="mt-2 space-y-1 text-xs">
                        {[
                          { ok: passwordValidation.minLength, label: t("auth.passwordMinStrong") },
                          { ok: passwordValidation.hasUppercase, label: t("auth.passwordUppercase") },
                          { ok: passwordValidation.hasLowercase, label: t("auth.passwordLowercase") },
                          { ok: passwordValidation.hasNumber, label: t("auth.passwordNumber") },
                          { ok: passwordValidation.hasSpecial, label: t("auth.passwordSpecial") },
                        ].map((r) => (
                          <div key={r.label} className={`flex items-center gap-1 ${r.ok ? "text-emerald-500" : "text-muted-foreground"}`}>
                            <CheckCircle className="w-3 h-3" />
                            <span>{r.label}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {isLogin && (
                    <div className="text-right">
                      <button
                        type="button"
                        onClick={() => { setIsForgotPassword(true); setErrors({}); }}
                        className="text-sm text-primary hover:underline"
                      >
                        {t("auth.forgotPasswordLink")}
                      </button>
                    </div>
                  )}

                  {/* Pro checkbox + conditional fields */}
                  {!isLogin && (
                    <div className="rounded-xl border border-border/50 bg-secondary/30 p-4 space-y-3">
                      <label className="flex items-start gap-3 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={isPro}
                          onChange={(e) => setIsPro(e.target.checked)}
                          className="mt-1 h-4 w-4 shrink-0 rounded border-border accent-primary cursor-pointer"
                          id="is-pro"
                        />
                        <span className="text-sm">
                          <span className="font-medium text-foreground">
                            Je suis un professionnel <span className="text-muted-foreground font-normal">(Garage / Concessionnaire)</span>
                          </span>
                          <span className="block text-xs text-muted-foreground mt-1">
                            Votre profil sera validé manuellement par notre équipe sous 24h.
                          </span>
                        </span>
                      </label>

                      {isPro && (
                        <div className="space-y-3 pt-1">
                          <div>
                            <div className="relative">
                              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                              <Input
                                id="signup-garage" type="text" aria-label="Nom du garage"
                                placeholder="Nom du garage *" value={garageName}
                                onChange={(e) => setGarageName(e.target.value)}
                                className="pl-10 h-12 bg-background/60 border-border/50 focus:border-primary"
                                required={isPro}
                              />
                            </div>
                            {errors.garage && <p className="text-destructive text-sm mt-1">{errors.garage}</p>}
                          </div>
                          <div className="relative">
                            <FileBadge className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                            <Input
                              id="signup-bce" type="text" aria-label="Numéro BCE (optionnel)"
                              placeholder="N° BCE (optionnel — ex. 0123.456.789)"
                              value={bceNumber}
                              onChange={(e) => setBceNumber(e.target.value)}
                              maxLength={20}
                              className="pl-10 h-12 bg-background/60 border-border/50 focus:border-primary"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {!isLogin && (
                    <div className="flex items-start gap-2.5 pt-1">
                      <input
                        type="checkbox" id="accept-terms" required
                        checked={acceptedTerms}
                        onChange={(e) => setAcceptedTerms(e.target.checked)}
                        className="mt-0.5 h-4 w-4 shrink-0 rounded border-border accent-primary cursor-pointer"
                      />
                      <label htmlFor="accept-terms" className="text-xs text-muted-foreground leading-relaxed cursor-pointer select-none">
                        J'accepte les{" "}
                        <Link to="/cgu" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">CGU</Link>
                        {" "}et la{" "}
                        <Link to="/confidentialite" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">politique de confidentialité</Link>.
                      </label>
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full h-12 btn-primary-gradient"
                    disabled={authLoading || (!isLogin && !acceptedTerms)}
                  >
                    {authLoading ? t("auth.loading") : isLogin ? t("auth.submit") : t("auth.submitSignup")}
                  </Button>

                  <p className="text-center text-xs text-muted-foreground mt-2">
                    {t("auth.secureNotice")}
                  </p>
                </form>

                <p className="text-center text-muted-foreground mt-6">
                  {isLogin ? t("auth.noAccount") : t("auth.hasAccount")}
                  <button
                    type="button"
                    onClick={() => { setIsLogin(!isLogin); setErrors({}); }}
                    className="ml-2 text-primary hover:underline font-medium"
                  >
                    {isLogin ? t("auth.submitSignup") : t("auth.submit")}
                  </button>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
