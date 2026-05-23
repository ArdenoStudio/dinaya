"use client";

import { type FC, type FormEvent, type ReactNode, type RefObject } from "react";
import Link from "next/link";
import { AnimatePresence, motion, type Variants } from "motion/react";
import { FaGoogle, FaApple } from "react-icons/fa";

/*  TYPES  */

interface SwapFormTexts {
  signInTitle: string;
  signUpTitle: string;
  signInSubtitle: string;
  signUpSubtitle: string;
  signInButton: string;
  signUpButton: string;
  footerSignIn: string;
  footerSignUp: string;
  footerSignInCta: string;
  footerSignUpCta: string;
}

export interface SwapFormProps {
  isSignIn: boolean;
  onModeChange: (isSignIn: boolean) => void;
  texts?: Partial<SwapFormTexts>;
  email: string;
  onEmailChange: (value: string) => void;
  password?: string;
  onPasswordChange?: (value: string) => void;
  onSubmit?: (event: FormEvent<HTMLFormElement>) => void;
  onSignUpContinue?: () => void;
  loading?: boolean;
  error?: string;
  showSocialAuth?: boolean;
  forgotPasswordHref?: string;
  emailInputRef?: RefObject<HTMLInputElement | null>;
  banner?: ReactNode;
}

/*  DEFAULT TEXTS  */

const DEFAULT_TEXTS: SwapFormTexts = {
  signInTitle: "Sign In",
  signUpTitle: "Create Account",
  signInSubtitle: "Hey friend, welcome back!",
  signUpSubtitle: "Just one more step to get started!",
  signInButton: "Get Sign In Code",
  signUpButton: "Create Account",
  footerSignIn: "Don't have account?",
  footerSignUp: "Already have account?",
  footerSignInCta: "Create Account",
  footerSignUpCta: "Sign In",
};

/*  COMPONENT  */

export const SwapForm: FC<SwapFormProps> = ({
  isSignIn,
  onModeChange,
  texts = {},
  email,
  onEmailChange,
  password = "",
  onPasswordChange,
  onSubmit,
  onSignUpContinue,
  loading = false,
  error,
  showSocialAuth = false,
  forgotPasswordHref,
  emailInputRef,
  banner,
}) => {
  const mergedTexts = { ...DEFAULT_TEXTS, ...texts };

  const variants: Variants = {
    initial: {
      opacity: 0,
      y: -30,
      scale: 0.97,
      filter: "blur(4px)",
    },
    animate: {
      opacity: 1,
      y: 0,
      scale: 1,
      filter: "blur(0px)",
    },
    exit: {
      opacity: 0,
      y: -30,
      scale: 0.97,
      filter: "blur(4px)",
    },
  };

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSignIn) {
      onSubmit?.(event);
      return;
    }
    onSignUpContinue?.();
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={isSignIn ? "signin" : "signup"}
        variants={variants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{
          ease: "easeIn",
          duration: 0.3,
        }}
        className="font-sans w-xs sm:w-sm bg-muted shadow-[0_10px_20px_rgba(0,0,0,0.08)] rounded-2xl overflow-hidden border border-border transition-colors"
      >
        <form
          onSubmit={handleSubmit}
          className="p-6 sm:p-8 pb-8 sm:pb-10 border-b bg-card rounded-2xl border-border transition-colors"
          noValidate
        >
          <h2 className="font-sans text-2xl sm:text-3xl font-bold text-foreground mb-1.5 sm:mb-2 text-center sm:text-left">
            {isSignIn ? mergedTexts.signInTitle : mergedTexts.signUpTitle}
          </h2>

          <p className="font-sans text-muted-foreground text-[15px] sm:text-[17px] mb-4 sm:mb-6 text-center sm:text-left">
            {isSignIn ? mergedTexts.signInSubtitle : mergedTexts.signUpSubtitle}
          </p>

          {banner}

          {showSocialAuth && (
            <>
              <div className="space-y-2.5 sm:space-y-3">
                <button
                  type="button"
                  className="font-sans w-full flex shadow-sm items-center justify-center gap-2 sm:gap-3 py-3 px-4 border border-border rounded-xl font-medium text-foreground bg-card hover:bg-muted transition-colors text-[15px] sm:text-base"
                >
                  <FaGoogle className="text-lg sm:text-xl" />
                  Continue with Google
                </button>

                <button
                  type="button"
                  className="font-sans w-full flex shadow-sm items-center justify-center gap-2 sm:gap-3 py-3 px-4 border border-border rounded-xl font-medium text-foreground bg-card hover:bg-muted transition-colors text-[15px] sm:text-base"
                >
                  <FaApple className="text-[22px] sm:text-[26px]" />
                  Continue with Apple
                </button>
              </div>

              <div className="relative my-5 sm:my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full h-px bg-gradient-to-r from-transparent via-border to-transparent" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-transparent font-sans text-[12px] sm:text-[14px] px-2 text-muted-foreground">
                    OR
                  </span>
                </div>
              </div>
            </>
          )}

          <div className="space-y-6 sm:space-y-8">
            <div>
              <label
                htmlFor="swap-form-email"
                className="font-sans block text-sm font-medium text-foreground mb-1.5"
              >
                Email
              </label>
              <input
                ref={emailInputRef}
                id="swap-form-email"
                name="email"
                type="email"
                required
                autoComplete="email"
                inputMode="email"
                value={email}
                onChange={(event) => onEmailChange(event.target.value)}
                placeholder="name@example.com"
                className="font-sans w-full px-4 py-2.5 rounded-xl border border-border bg-input focus:ring-1 focus:ring-ring outline-none shadow-sm text-[15px] sm:text-base text-foreground"
              />
            </div>

            {isSignIn && onPasswordChange && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="swap-form-password"
                    className="font-sans block text-sm font-medium text-foreground"
                  >
                    Password
                  </label>
                  {forgotPasswordHref && (
                    <Link
                      href={forgotPasswordHref}
                      className="font-sans text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Forgot password?
                    </Link>
                  )}
                </div>
                <input
                  id="swap-form-password"
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => onPasswordChange(event.target.value)}
                  placeholder="••••••••"
                  className="font-sans w-full px-4 py-2.5 rounded-xl border border-border bg-input focus:ring-1 focus:ring-ring outline-none shadow-sm text-[15px] sm:text-base text-foreground"
                />
              </div>
            )}

            {error && (
              <div
                role="alert"
                className="font-sans px-3 py-2.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm"
              >
                {error}
              </div>
            )}

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={loading ? undefined : { scale: 1.015 }}
              whileTap={loading ? undefined : { scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="font-sans w-full py-3 sm:py-3.5 bg-primary text-primary-foreground rounded-xl font-semibold shadow-lg text-[15px] sm:text-base disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading
                ? isSignIn
                  ? "Signing in…"
                  : "Continuing…"
                : isSignIn
                  ? mergedTexts.signInButton
                  : mergedTexts.signUpButton}
            </motion.button>
          </div>
        </form>

        <div className="bg-muted py-3 sm:py-4 text-center">
          <p className="font-sans text-muted-foreground text-[13px] sm:text-[14px]">
            {isSignIn ? mergedTexts.footerSignIn : mergedTexts.footerSignUp}
            <button
              type="button"
              onClick={() => onModeChange(!isSignIn)}
              className="ml-1 font-medium text-foreground hover:underline"
            >
              {isSignIn ? mergedTexts.footerSignInCta : mergedTexts.footerSignUpCta}
            </button>
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
