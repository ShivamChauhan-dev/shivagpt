"use client";

import { useState, useRef, useEffect, FormEvent, useCallback } from "react";

export type AuthUser = {
    id: string;
    name: string;
    email: string;
};

interface AuthFormProps {
    onAuthSuccess: (user: AuthUser) => void;
}

export default function AuthForm({ onAuthSuccess }: AuthFormProps) {
    const [authMode, setAuthMode] = useState<"login" | "signup">("login");
    const [authName, setAuthName] = useState("");
    const [authEmail, setAuthEmail] = useState("");
    const [authPassword, setAuthPassword] = useState("");
    const [authLoading, setAuthLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const googleButtonRef = useRef<HTMLDivElement | null>(null);
    const googleInitializedRef = useRef(false);

    /* ─── API helpers ─────────────────────────── */

    async function handleAuthSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError(null);
        setAuthLoading(true);

        try {
            const endpoint =
                authMode === "login" ? "/api/auth/login" : "/api/auth/signup";
            const payload =
                authMode === "login"
                    ? { email: authEmail, password: authPassword }
                    : { name: authName, email: authEmail, password: authPassword };

            const response = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error ?? "Authentication failed");
            }

            onAuthSuccess(data.user);
        } catch (authError) {
            setError(
                authError instanceof Error
                    ? authError.message
                    : "Authentication failed",
            );
        } finally {
            setAuthLoading(false);
        }
    }

    const handleGoogleCredential = useCallback(
        async (credential: string) => {
            setError(null);
            setGoogleLoading(true);

            try {
                const response = await fetch("/api/auth/google", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ credential }),
                });
                const data = await response.json();
                if (!response.ok || !data.success) {
                    throw new Error(data.error ?? "Google authentication failed");
                }

                onAuthSuccess(data.user);
            } catch (authError) {
                setError(
                    authError instanceof Error
                        ? authError.message
                        : "Google authentication failed",
                );
            } finally {
                setGoogleLoading(false);
            }
        },
        [onAuthSuccess],
    );

    /* ─── Effects ─────────────────────────────── */

    useEffect(() => {
        const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
        if (!clientId || !googleButtonRef.current) {
            return;
        }

        const initializeGoogle = () => {
            if (
                !window.google?.accounts?.id ||
                !googleButtonRef.current ||
                googleInitializedRef.current
            ) {
                return;
            }

            window.google.accounts.id.initialize({
                client_id: clientId,
                callback: ({ credential }) => {
                    if (credential) {
                        void handleGoogleCredential(credential);
                    }
                },
            });

            googleButtonRef.current.innerHTML = "";
            window.google.accounts.id.renderButton(googleButtonRef.current, {
                theme: "outline",
                size: "large",
                shape: "pill",
                width: 320,
                text: "continue_with",
            });

            googleInitializedRef.current = true;
        };

        if (window.google?.accounts?.id) {
            initializeGoogle();
            return;
        }

        const existingScript = document.querySelector(
            'script[src="https://accounts.google.com/gsi/client"]',
        ) as HTMLScriptElement | null;

        if (existingScript) {
            existingScript.addEventListener("load", initializeGoogle, {
                once: true,
            });
            return;
        }

        const script = document.createElement("script");
        script.src = "https://accounts.google.com/gsi/client";
        script.async = true;
        script.defer = true;
        script.onload = initializeGoogle;
        document.head.appendChild(script);
    }, [handleGoogleCredential]);

    return (
        <div className="flex h-screen items-center justify-center bg-[#0f0f17] px-4 text-slate-100">
            <form
                onSubmit={handleAuthSubmit}
                className="w-full max-w-md rounded-2xl border border-white/10 bg-[#13131d] p-6 shadow-2xl backdrop-blur-sm"
            >
                <div className="mb-6 text-center">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                        {authMode === "login" ? "Welcome Back" : "Create Account"}
                    </h1>
                    <p className="mt-2 text-sm text-slate-400">
                        {authMode === "login"
                            ? "Login to continue your AI journey"
                            : "Signup to start exploring"}
                    </p>
                </div>

                {authMode === "signup" && (
                    <div className="mb-3">
                        <label className="block text-xs font-medium text-slate-400 mb-1 ml-1">Full Name</label>
                        <input
                            className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm outline-none placeholder:text-slate-600 focus:border-violet-500/50 focus:bg-white/[0.08] transition-all"
                            placeholder="John Doe"
                            value={authName}
                            onChange={(e) => setAuthName(e.target.value)}
                            required
                        />
                    </div>
                )}

                <div className="mb-3">
                    <label className="block text-xs font-medium text-slate-400 mb-1 ml-1">Email Address</label>
                    <input
                        className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm outline-none placeholder:text-slate-600 focus:border-violet-500/50 focus:bg-white/[0.08] transition-all"
                        type="email"
                        placeholder="name@example.com"
                        value={authEmail}
                        onChange={(e) => setAuthEmail(e.target.value)}
                        required
                    />
                </div>

                <div className="mb-6">
                    <label className="block text-xs font-medium text-slate-400 mb-1 ml-1">Password</label>
                    <input
                        className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm outline-none placeholder:text-slate-600 focus:border-violet-500/50 focus:bg-white/[0.08] transition-all"
                        type="password"
                        placeholder="••••••••"
                        value={authPassword}
                        onChange={(e) => setAuthPassword(e.target.value)}
                        minLength={6}
                        required
                    />
                </div>

                <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-violet-600/20 transition hover:from-violet-500 hover:to-fuchsia-500 hover:shadow-violet-600/30 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    {authLoading
                        ? "Please wait..."
                        : authMode === "login"
                            ? "Sign In"
                            : "Create Account"}
                </button>

                <div className="mt-4 text-center">
                    <button
                        type="button"
                        className="text-sm text-slate-400 hover:text-white transition-colors"
                        onClick={() => {
                            setAuthMode((prev) => (prev === "login" ? "signup" : "login"));
                            setError(null);
                        }}
                    >
                        {authMode === "login" ? (
                            <>Don't have an account? <span className="text-violet-400">Sign up</span></>
                        ) : (
                            <>Already have an account? <span className="text-violet-400">Log in</span></>
                        )}
                    </button>
                </div>

                <div className="mt-6 flex items-center justify-between gap-4">
                    <div className="h-px flex-1 bg-white/10"></div>
                    <span className="text-xs text-slate-500 uppercase tracking-widest">Or</span>
                    <div className="h-px flex-1 bg-white/10"></div>
                </div>

                <div className="mt-6 flex justify-center">
                    <div ref={googleButtonRef} className="h-[44px]" />
                </div>

                {!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID && (
                    <p className="mt-4 rounded-lg bg-amber-500/10 border border-amber-500/20 p-2 text-center text-xs text-amber-200">
                        ⚠️ NEXT_PUBLIC_GOOGLE_CLIENT_ID is missing
                    </p>
                )}

                {googleLoading && (
                    <p className="mt-2 text-center text-xs text-slate-400 animate-pulse">
                        Connecting to Google...
                    </p>
                )}

                {error && (
                    <div className="mt-4 rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-center text-sm text-red-200">
                        {error}
                    </div>
                )}
            </form>
        </div>
    );
}
