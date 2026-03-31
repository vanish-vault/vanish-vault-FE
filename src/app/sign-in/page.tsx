"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Lock, Mail } from "lucide-react";
import { toast } from "sonner";
import { Card, Input, Label, Button } from "@/src/components/ui";
import { AnimatedSection } from "@/src/components/animation";
import { useAppDispatch, useAppSelector } from "@/src/store/hooks";
import { signIn, signInWithGoogle } from "@/src/store/auth/authSlice";
import Image from "next/image";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const dispatch = useAppDispatch();
  const { isLoading, isAuthenticated } = useAppSelector((state) => state.auth);
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) router.push("/");
  }, [isAuthenticated, router]);

  // Show error toast if redirected here after a failed token refresh
  useEffect(() => {
    const authError = sessionStorage.getItem("authError");
    if (authError) {
      sessionStorage.removeItem("authError");
      toast.error(authError);
    }
  }, []);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await dispatch(signIn({ email, password }));
    if (signIn.fulfilled.match(result)) {
      toast.success("Welcome back!");
      router.push("/dashboard/secrets");
    } else {
      toast.error("Invalid credentials");
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const idToken = await new Promise<string>((resolve, reject) => {
        const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
        if (!clientId)
          return reject(
            new Error(
              "Missing Google client id (NEXT_PUBLIC_GOOGLE_CLIENT_ID)",
            ),
          );
        const redirectUri = `${location.origin}/auth/google-callback`;
        const scope = "openid email profile";
        const nonce = window.crypto?.randomUUID?.() || Math.random().toString(36).slice(2);
        const state = window.crypto?.randomUUID?.() || Math.random().toString(36).slice(2);

        // Store nonce & state for later verification
        try {
          sessionStorage.setItem("oauth_nonce", nonce);
          sessionStorage.setItem("oauth_state", state);
        } catch (e) {
          // ignore storage errors
        }

        const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(
          clientId,
        )}&redirect_uri=${encodeURIComponent(
          redirectUri,
        )}&response_type=id_token&scope=${encodeURIComponent(
          scope,
        )}&prompt=select_account&nonce=${encodeURIComponent(nonce)}&state=${encodeURIComponent(state)}`;

        const width = 500;
        const height = 600;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;
        const popup = window.open(
          url,
          "google_oauth",
          `width=${width},height=${height},left=${left},top=${top}`,
        );
        if (!popup) return reject(new Error("Popup blocked"));

        const decodePayload = (token: string) => {
          try {
            const parts = token.split(".");
            if (parts.length < 2) return null;
            const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
            const json = decodeURIComponent(
              atob(payload)
                .split("")
                .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
                .join("")
            );
            return JSON.parse(json);
          } catch (e) {
            return null;
          }
        };

        const cleanup = () => {
          try {
            sessionStorage.removeItem("oauth_nonce");
            sessionStorage.removeItem("oauth_state");
          } catch (e) {
            // ignore
          }
        };

        const listener = (e: MessageEvent) => {
          if (e.origin !== window.location.origin) return;
          // verify state matches stored state
          const storedState = sessionStorage.getItem("oauth_state");
          if (e.data?.state && storedState && e.data.state !== storedState) return;

          if (e.data?.id_token) {
            const storedNonce = sessionStorage.getItem("oauth_nonce");
            const payload = decodePayload(e.data.id_token as string);
            if (storedNonce && payload?.nonce && payload.nonce !== storedNonce) {
              window.removeEventListener("message", listener);
              cleanup();
              return reject(new Error("Invalid nonce in id_token"));
            }
            window.removeEventListener("message", listener);
            cleanup();
            return resolve(e.data.id_token as string);
          }
          if (e.data?.error) {
            window.removeEventListener("message", listener);
            cleanup();
            return reject(new Error(e.data.error));
          }
        };

        window.addEventListener("message", listener);
        setTimeout(() => {
          window.removeEventListener("message", listener);
          cleanup();
          reject(new Error("Timed out waiting for Google sign-in"));
        }, 60000);
      });

      const result = await dispatch(signInWithGoogle(idToken));
      if (signInWithGoogle.fulfilled.match(result)) {
        toast.success("Welcome back!");
        router.push("/dashboard/secrets");
      } else {
        toast.error("Google sign in failed");
      }
    } catch (err: any) {
      toast.error(err?.message || "Google sign in failed");
    }
  };

  return (
    <div className="pt-32 pb-24 min-h-screen flex items-center justify-center px-6">
      <AnimatedSection animate="scale" className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-[var(--gradient-from)] via-[var(--gradient-via)] to-[var(--gradient-to)] shadow-lg shadow-indigo-500/25">
              <Lock className="size-6 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-2">Welcome Back</h1>
          <p className="text-muted-foreground">
            Sign in to access your secure vault
          </p>
        </div>

        <Card className="p-8 border-border/50 backdrop-blur-sm bg-card/50">
          <form onSubmit={handleSignIn} className="space-y-5">
            <div>
              <Label htmlFor="email">Email</Label>
              <div className="relative mt-2">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                  autoFocus
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative mt-2">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-[var(--gradient-from)] via-[var(--gradient-via)] to-[var(--gradient-to)] text-white hover:opacity-90"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border/50" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-card px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full gap-2"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
            >
              <Image
                src="/google-icon-logo.svg"
                alt="Google Logo"
                width={16}
                height={16}
                className="size-4"
              />
              Continue with Google
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">
              Don&apos;t have an account?{" "}
            </span>
            <a
              href="/sign-up"
              className="font-semibold text-indigo-500 hover:text-indigo-400"
            >
              Sign up
            </a>
          </div>
        </Card>
      </AnimatedSection>
    </div>
  );
}
