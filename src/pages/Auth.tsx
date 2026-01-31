/**
 * Authentication Page
 * Handles login, signup, and password reset flows
 * @module pages/Auth
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Lock, User, Eye, EyeOff, Car, ArrowLeft, CheckCircle } from "lucide-react";
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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [verificationEmailSent, setVerificationEmailSent] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [errors, setErrors] = useState<{ email?: string; password?: string; name?: string }>({});
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();

  // Use auth hooks from features/auth
  const { user, isLoading: authLoading, signIn, signUp, signInWithGoogle, resetPassword } = useAuth();
  const passwordValidation = usePasswordValidation(password);

  // Validation schemas
  const emailSchema = z.string().email(t("auth.invalidEmail"));
  const nameSchema = z.string().min(2, t("auth.nameMin"));

  // Redirect authenticated users
  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  /**
   * Validate form fields
   */
  const validateForm = () => {
    const newErrors: { email?: string; password?: string; name?: string } = {};
    
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
      const result = await signUp({ email, password, fullName });
      
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
    <div className="min-h-screen bg-background flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-secondary" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-primary/5 rounded-full blur-3xl animate-float" style={{ animationDelay: "-3s" }} />
        
        <div className="relative z-10 flex flex-col justify-center p-12">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
              <Car className="w-7 h-7 text-primary" />
            </div>
            <span className="font-display text-2xl font-bold text-foreground">AutoRa</span>
          </div>
          
          <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-6">
            {t("hero.title1")}
            <br />
            <span className="gradient-text">{t("auth.findIdealCar")}</span>
          </h1>
          
          <p className="text-lg text-muted-foreground max-w-md">
            {t("auth.heroDesc")}
          </p>
          
          <div className="flex gap-8 mt-12">
            <div className="text-center">
              <div className="font-display text-3xl font-bold text-foreground">15K+</div>
              <div className="text-muted-foreground text-sm">{t("hero.vehicles")}</div>
            </div>
            <div className="text-center">
              <div className="font-display text-3xl font-bold text-foreground">98%</div>
              <div className="text-muted-foreground text-sm">Car-Pass</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="flex lg:hidden items-center gap-3 mb-8 justify-center">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Car className="w-6 h-6 text-primary" />
            </div>
            <span className="font-display text-xl font-bold text-foreground">AutoRa</span>
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
                <h2 className="font-display text-2xl font-bold text-foreground mb-2">
                  {isLogin ? t("auth.login") : t("auth.signup")}
                </h2>
                <p className="text-muted-foreground mb-8">
                  {isLogin ? t("auth.loginSubtitle") : t("auth.signupSubtitle")}
                </p>

                {/* Google Button */}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-12 mb-6 bg-secondary/50 border-border/50 hover:bg-secondary text-foreground"
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

                {/* Divider */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex-1 h-px bg-border/50" />
                  <span className="text-muted-foreground text-sm">{t("auth.or")}</span>
                  <div className="flex-1 h-px bg-border/50" />
                </div>

                {/* Email Form */}
                <form onSubmit={handleEmailAuth} className="space-y-4">
                  {!isLogin && (
                    <div>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                          type="text"
                          placeholder={t("auth.fullName")}
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="pl-10 h-12 bg-secondary/50 border-border/50 focus:border-primary"
                        />
                      </div>
                      {errors.name && (
                        <p className="text-destructive text-sm mt-1">{errors.name}</p>
                      )}
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
                        className="pl-10 h-12 bg-secondary/50 border-border/50 focus:border-primary"
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
                        className="pl-10 pr-10 h-12 bg-secondary/50 border-border/50 focus:border-primary"
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
