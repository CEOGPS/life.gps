import { forwardRef, useCallback, useState } from "react";
import { type VariantProps } from "class-variance-authority";
import { Loader2, LogIn, LogOut } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient.ts";
import { useAuth } from "@/hooks/use-auth.ts";
import { Button, buttonVariants } from "@/components/ui/button.tsx";

export interface SignInButtonProps
  extends
    Omit<React.ComponentProps<"button">, "onClick">,
    VariantProps<typeof buttonVariants> {
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  showIcon?: boolean;
  signInText?: string;
  signOutText?: string;
  loadingText?: string;
  asChild?: boolean;
  /** OAuth provider to use when signing in. Defaults to "google". */
  provider?: "google" | "github";
}

export const SignInButton = forwardRef<HTMLButtonElement, SignInButtonProps>(
  (
    {
      onClick,
      showIcon = true,
      signInText = "Sign In",
      signOutText = "Sign Out",
      loadingText,
      asChild = false,
      provider = "google",
      variant,
      size,
      className,
      disabled,
      ...props
    },
    ref,
  ) => {
    const { isAuthenticated, signOut } = useAuth();
    const [isLoading, setIsLoading] = useState(false);

    const handleClick = useCallback(
      async (event: React.MouseEvent<HTMLButtonElement>) => {
        onClick?.(event);
        if (event.defaultPrevented) return;

        setIsLoading(true);
        try {
          if (isAuthenticated) {
            await signOut();
          } else {
            const { error } = await supabase.auth.signInWithOAuth({
              provider,
              options: { redirectTo: `${window.location.origin}/auth/callback` },
            });
            if (error) throw error;
          }
        } catch (err) {
          console.error("Authentication error:", err);
          toast.error(err instanceof Error ? err.message : "Authentication failed");
        } finally {
          setIsLoading(false);
        }
      },
      [isAuthenticated, signOut, onClick, provider],
    );

    const isDisabled = disabled || isLoading;
    const defaultLoadingText = isAuthenticated ? "Signing Out..." : "Signing In...";
    const currentLoadingText = loadingText || defaultLoadingText;

    const buttonText = isLoading
      ? currentLoadingText
      : isAuthenticated
        ? signOutText
        : signInText;

    const icon = isLoading ? (
      <Loader2 className="size-4 animate-spin" />
    ) : isAuthenticated ? (
      <LogOut className="size-4" />
    ) : (
      <LogIn className="size-4" />
    );

    return (
      <Button
        ref={ref}
        onClick={handleClick}
        disabled={isDisabled}
        variant={variant}
        size={size}
        className={className}
        asChild={asChild}
        aria-label={isAuthenticated ? "Sign out of your account" : "Sign in to your account"}
        {...props}
      >
        {showIcon && icon}
        {buttonText}
      </Button>
    );
  },
);

SignInButton.displayName = "SignInButton";
