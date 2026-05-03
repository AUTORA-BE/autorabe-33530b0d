/**
 * Authentication Page
 * Handles login, signup, and password reset flows
 * @module pages/Auth
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Lock, User, Eye, EyeOff, ArrowLeft, CheckCircle, Phone, Building2, MapPin, ShieldCheck, BadgeCheck, MapPinned } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth, usePasswordValidation } from "@/features/auth";
import { z } from "zod";

/**
 * Authentication page component
 * Provides login, signup, password reset, and Google OAuth
 */
const Auth = () => {
  // Form state
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [accountType, setAccountType] = useState<"private" | "pro">("private");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("+32 ");
  const [garageName, setGarageName] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [verificationEmailSent, setVerificationEmailSent] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [errors, setErrors] = useState<{ email?: string; password?: string; name?: string; phone?: string }>({});
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t, language } = useLanguage();

  // Use auth hooks from features/auth
  const { user, isLoading: authLoading, signIn, signUp, signInWithGoogle, signInWithApple, resetPassword } = useAuth();
  const passwordValidation = usePasswordValidation(password);

  // Validation schemas
  const emailSchema = z.string().email(t("auth.invalidEmail"));
  const nameSchema = z.string().min(2, t("auth.nameMin"));

  // Redirect authenticated users (admin → /admin, others → home)
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();
      navigate(data ? "/admin" : "/");
    })();
  }, [user, navigate]);

  /**
   * Validate form fields
   */
  const validateForm = () => {
    const newErrors: { email?: string; password?: string; name?: string; phone?: string } = {};
    
    // Validate email
    try {
      emailSchema.parse(email);
    } catch (e) {
      if (e instanceof z.ZodError) {
        newErrors.email = e.errors[0].message;
      }
    }

    // Validate password using hook
    if (!isLogin && !passwordValidation.isValid) {
      if (!passwordValidation.minLength) {
        newErrors.password = t("auth.passwordMinStrong");
      } else if (!passwordValidation.hasUppercase) {
        newErrors.password = t("auth.passwordUppercase");
      } else if (!passwordValidation.hasLowercase) {
        newErrors.password = t("auth.passwordLowercase");
      } else if (!passwordValidation.hasNumber) {
        newErrors.password = t("auth.passwordNumber");
      } else if (!passwordValidation.hasSpecial) {
        newErrors.password = t("auth.passwordSpecial");
      }
    } else if (isLogin && password.length < 1) {
      newErrors.password = t("auth.passwordRequired");
    }

    // Validate name for signup
    if (!isLogin) {
      try {
        nameSchema.parse(fullName);
      } catch (e) {
        if (e instanceof z.ZodError) {
          newErrors.name = e.errors[0].message;
        }
      }

      // Validate Belgian phone number
      const phoneDigits = phone.replace(/[\s\-\(\)]/g, "");
      const belgianPhoneRegex = /^\+32\d{8,9}$/;
      if (!belgianPhoneRegex.test(phoneDigits)) {
        newErrors.phone = language === "nl" ? "Geldig Belgisch telefoonnummer vereist (+32...)" : "Numéro de téléphone belge valide requis (+32...)";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle email authentication (login/signup)
   */
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    if (isLogin) {
      const result = await signIn({ email, password });
      
      if (!result.success && result.error) {
        if (result.error.type === 'invalid_credentials') {
          toast({
            title: t("auth.errorLogin"),
            description: t("auth.errorCredentials"),
            variant: "destructive",
          });
        } else {
          toast({
            title: t("auth.error"),
            description: result.error.message,
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: t("auth.welcome"),
          description: t("auth.loginSuccess"),
        });
      }
    } else {
      const result = await signUp({
        email,
        password,
        fullName,
        phone: phone.replace(/[\s\-\(\)]/g, ""),
        garageName: accountType === "pro" ? (garageName || undefined) : undefined,
        postalCode: accountType === "pro" ? (postalCode || undefined) : undefined,
      });
      
      if (!result.success && result.error) {
        if (result.error.type === 'user_exists') {
          toast({
            title: t("auth.accountExists"),
            description: t("auth.accountExistsDesc"),
            variant: "destructive",
          });
        } else {
          toast({
            title: t("auth.error"),
            description: result.error.message,
            variant: "destructive",
          });
        }
      } else {
        setVerificationEmailSent(true);
        toast({
          title: t("auth.verificationEmailSent"),
          description: t("auth.verificationEmailSentDesc"),
        });
      }
    }
  };

  /**
   * Handle forgot password flow
   */
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate email only
    const newErrors: { email?: string } = {};
    try {
      emailSchema.parse(email);
    } catch (e) {
      if (e instanceof z.ZodError) {
        newErrors.email = e.errors[0].message;
      }
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const result = await resetPassword(email);

    if (!result.success && result.error) {
      toast({
        title: t("auth.error"),
        description: result.error.message,
        variant: "destructive",
      });
    } else {
      setResetEmailSent(true);
      toast({
        title: t("auth.resetEmailSent"),
        description: t("auth.resetEmailSentDesc"),
      });
    }
  };

  /**
   * Handle Google OAuth
   */
  const handleGoogleAuth = async () => {
    const result = await signInWithGoogle();

    if (!result.success && result.error) {
      toast({
        title: t("auth.error"),
        description: result.error.message,
        variant: "destructive",
      });
    }
  };

  /**
   * Handle Apple OAuth
   */
  const handleAppleAuth = async () => {
    const result = await signInWithApple();

    if (!result.success && result.error) {
      toast({
        title: t("auth.error"),
        description: result.error.message,
        variant: "destructive",
      });
    }
  };

  /**
   * Resend verification email
   */
  const handleResendVerification = async () => {
    setResendLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });
      if (error) {
        toast({
          title: t("auth.error"),
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: t("auth.resendSuccess"),
          description: t("auth.resendSuccessDesc"),
        });
        // Start 60 second cooldown
        setResendCooldown(60);
        const interval = setInterval(() => {
          setResendCooldown((prev) => {
            if (prev <= 1) {
              clearInterval(interval);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    } catch (error) {
      toast({
        title: t("auth.error"),
        description: t("auth.unexpectedError"),
        variant: "destructive",
      });
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="page-gradient flex">
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
              <BadgeCheck className="w-4 h-4" strokeWidth={1.5} />
              Car-Pass
            </span>
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm">
              <MapPinned className="w-4 h-4" strokeWidth={1.5} />
              LEZ Belgique
            </span>
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm">
              <ShieldCheck className="w-4 h-4" strokeWidth={1.5} />
              {t("auth.proAndPrivate")}
            </span>
          </div>
        </div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="flex lg:hidden items-center justify-center mb-8">
            <span className="font-display text-2xl font-bold tracking-wider">
              <span className="text-foreground">Auto</span>
              <span className="text-primary">RA</span>
            </span>
          </div>

          {/* Back Button */}
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            {t("auth.backHome")}
          </button>

          {/* Form Card */}
          <div className="glass-panel p-8">
            {verificationEmailSent ? (
              // Verification email sent confirmation
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
                <p className="text-sm text-muted-foreground mb-6">
                  {t("auth.checkSpam")}
                </p>
                <div className="space-y-3">
                  <Button
                    onClick={handleResendVerification}
                    className="w-full h-12 btn-primary-gradient"
                    disabled={resendLoading || resendCooldown > 0}
                  >
                    {resendLoading 
                      ? t("auth.loading") 
                      : resendCooldown > 0 
                        ? `${t("auth.resendEmail")} (${resendCooldown}s)`
                        : t("auth.resendEmail")
                    }
                  </Button>
                  <Button
                    onClick={() => {
                      setVerificationEmailSent(false);
                      setIsLogin(true);
                    }}
                    variant="outline"
                    className="w-full h-12"
                  >
                    {t("auth.backToLogin")}
                  </Button>
                </div>
              </div>
            ) : resetEmailSent ? (
              // Email sent confirmation
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-8 h-8 text-primary" />
                </div>
                <h2 className="font-display text-2xl font-bold text-foreground mb-2">
                  {t("auth.resetEmailSent")}
                </h2>
                <p className="text-muted-foreground mb-6">
                  {t("auth.resetEmailSentDesc")}
                </p>
                <Button
                  onClick={() => {
                    setResetEmailSent(false);
                    setIsForgotPassword(false);
                  }}
                  variant="outline"
                  className="w-full h-12"
                >
                  {t("auth.backToLogin")}
                </Button>
              </div>
            ) : isForgotPassword ? (
              // Forgot password form
              <>
                <h2 className="font-display text-2xl font-bold text-foreground mb-2">
                  {t("auth.forgotPassword")}
                </h2>
                <p className="text-muted-foreground mb-8">
                  {t("auth.forgotPasswordDesc")}
                </p>

                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        type="email"
                        placeholder={t("auth.email")}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 h-12 bg-secondary/50 border-border/50 focus:border-primary"
                      />
                    </div>
                    {errors.email && (
                      <p className="text-destructive text-sm mt-1">{errors.email}</p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 btn-primary-gradient"
                    disabled={authLoading}
                  >
                    {authLoading ? t("auth.loading") : t("auth.sendResetLink")}
                  </Button>
                </form>

                <p className="text-center text-muted-foreground mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotPassword(false);
                      setErrors({});
                    }}
                    className="text-primary hover:underline font-medium"
                  >
                    {t("auth.backToLogin")}
                  </button>
                </p>
              </>
            ) : (
              // Login/Signup form
              <>
                <h2 className="font-display text-3xl font-bold text-foreground mb-2 tracking-tight">
                  {isLogin ? t("auth.login") : t("auth.signup")}
                </h2>
                <p className="text-muted-foreground mb-8">
                  {isLogin ? t("auth.loginSubtitle") : t("auth.signupSubtitle")}
                </p>

                {/* Social Buttons */}
                <div className="flex flex-col gap-3 mb-6">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-12 bg-secondary/50 border-border/50 hover:bg-secondary text-foreground"
                    onClick={handleGoogleAuth}
                    disabled={authLoading}
                  >
                    <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    {t("auth.continueGoogle")}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-12 bg-secondary/50 border-border/50 hover:bg-secondary text-foreground"
                    onClick={handleAppleAuth}
                    disabled={authLoading}
                  >
                    <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                    </svg>
                    {t("auth.continueApple")}
                  </Button>
                </div>

                {/* Divider */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex-1 h-px bg-border/50" />
                  <span className="text-muted-foreground text-sm">{t("auth.or")}</span>
                  <div className="flex-1 h-px bg-border/50" />
                </div>

                {/* Email Form */}
                <form onSubmit={handleEmailAuth} className="space-y-4">
                  {!isLogin && (
                    <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-secondary/40 border border-border/50">
                      <button
                        type="button"
                        onClick={() => setAccountType("private")}
                        className={`h-10 rounded-lg text-sm font-medium transition-colors ${
                          accountType === "private"
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {t("auth.rolePrivate")}
                      </button>
                      <button
                        type="button"
                        onClick={() => setAccountType("pro")}
                        className={`h-10 rounded-lg text-sm font-medium transition-colors ${
                          accountType === "pro"
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {t("auth.rolePro")}
                      </button>
                    </div>
                  )}

                  {!isLogin && (
                    <div>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                          type="text"
                          placeholder={t("auth.fullName")}
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="pl-10 h-12 bg-secondary/50 border-border/50 focus:border-primary focus:ring-primary/30 transition-colors"
                        />
                      </div>
                      {errors.name && (
                        <p className="text-destructive text-sm mt-1">{errors.name}</p>
                      )}
                    </div>
                  )}

                  {!isLogin && (
                    <div>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                          type="tel"
                          placeholder="+32 4XX XX XX XX"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="pl-10 h-12 bg-secondary/50 border-border/50 focus:border-primary focus:ring-primary/30 transition-colors"
                        />
                      </div>
                      {errors.phone && (
                        <p className="text-destructive text-sm mt-1">{errors.phone}</p>
                      )}
                    </div>
                  )}

                  {!isLogin && accountType === "pro" && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                          type="text"
                          placeholder={t("auth.garageNamePlaceholder")}
                          value={garageName}
                          onChange={(e) => setGarageName(e.target.value)}
                          className="pl-10 h-12 bg-secondary/50 border-border/50 focus:border-primary focus:ring-primary/30 transition-colors"
                        />
                      </div>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                          type="text"
                          placeholder={t("auth.postalCodePlaceholder")}
                          value={postalCode}
                          onChange={(e) => setPostalCode(e.target.value)}
                          maxLength={4}
                          className="pl-10 h-12 bg-secondary/50 border-border/50 focus:border-primary focus:ring-primary/30 transition-colors"
                        />
                      </div>
                    </div>
                  )}
                  <div>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        type="email"
                        placeholder={t("auth.email")}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 h-12 bg-secondary/50 border-border/50 focus:border-primary focus:ring-primary/30 transition-colors"
                      />
                    </div>
                    {errors.email && (
                      <p className="text-destructive text-sm mt-1">{errors.email}</p>
                    )}
                  </div>

                  <div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder={t("auth.password")}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 pr-10 h-12 bg-secondary/50 border-border/50 focus:border-primary focus:ring-primary/30 transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-destructive text-sm mt-1">{errors.password}</p>
                    )}
                    
                    {/* Password strength indicator for signup */}
                    {!isLogin && password.length > 0 && (
                      <div className="mt-2 space-y-1 text-xs">
                        <div className={`flex items-center gap-1 ${passwordValidation.minLength ? 'text-green-500' : 'text-muted-foreground'}`}>
                          <CheckCircle className="w-3 h-3" />
                          <span>{t("auth.passwordMinStrong")}</span>
                        </div>
                        <div className={`flex items-center gap-1 ${passwordValidation.hasUppercase ? 'text-green-500' : 'text-muted-foreground'}`}>
                          <CheckCircle className="w-3 h-3" />
                          <span>{t("auth.passwordUppercase")}</span>
                        </div>
                        <div className={`flex items-center gap-1 ${passwordValidation.hasLowercase ? 'text-green-500' : 'text-muted-foreground'}`}>
                          <CheckCircle className="w-3 h-3" />
                          <span>{t("auth.passwordLowercase")}</span>
                        </div>
                        <div className={`flex items-center gap-1 ${passwordValidation.hasNumber ? 'text-green-500' : 'text-muted-foreground'}`}>
                          <CheckCircle className="w-3 h-3" />
                          <span>{t("auth.passwordNumber")}</span>
                        </div>
                        <div className={`flex items-center gap-1 ${passwordValidation.hasSpecial ? 'text-green-500' : 'text-muted-foreground'}`}>
                          <CheckCircle className="w-3 h-3" />
                          <span>{t("auth.passwordSpecial")}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {isLogin && (
                    <div className="text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setIsForgotPassword(true);
                          setErrors({});
                        }}
                        className="text-sm text-primary hover:underline"
                      >
                        {t("auth.forgotPasswordLink")}
                      </button>
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full h-12 btn-primary-gradient"
                    disabled={authLoading}
                  >
                    {authLoading ? t("auth.loading") : isLogin ? t("auth.submit") : t("auth.submitSignup")}
                  </Button>
                </form>

                {/* Toggle Login/Signup */}
                <p className="text-center text-muted-foreground mt-6">
                  {isLogin ? t("auth.noAccount") : t("auth.hasAccount")}
                  <button
                    type="button"
                    onClick={() => {
                      setIsLogin(!isLogin);
                      setErrors({});
                    }}
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
