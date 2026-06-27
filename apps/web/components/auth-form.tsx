"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthService } from "@wallet/openapi-client";
import { Eye, LockKeyhole, Mail, UserRound, WalletCards } from "lucide-react";
import { useSetRecoilState } from "recoil";
import { configureSdk } from "../lib/sdk";
import { sessionAtom, walletAtom } from "../state/session";

const sessionStorageKey = "wallet-session";

type AuthMode = "login" | "register";

export function AuthForm({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const setSession = useSetRecoilState(sessionAtom);
  const setWallet = useSetRecoilState(walletAtom);
  const [name, setName] = useState("Milan");
  const [email, setEmail] = useState("milan@example.com");
  const [password, setPassword] = useState("password123");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setSubmitting] = useState(false);

  const title = useMemo(
    () => (mode === "login" ? "Sign in to Wallet" : "Create Wallet Account"),
    [mode]
  );

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    configureSdk();

    try {
      const session =
        mode === "login"
          ? await AuthService.login({
              requestBody: { email, password }
            })
          : await AuthService.register({
              requestBody: { name, email, password }
            });

      configureSdk(session.token);
      setSession(session);
      setWallet(session.wallet);
      localStorage.setItem(sessionStorageKey, JSON.stringify(session));
      router.replace("/dashboard");
    } catch (error: any) {
      setError(error?.body?.error ?? error?.message ?? "Authentication failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-soft">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-md bg-paytmBlue text-white">
            <WalletCards size={24} aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-ink">{title}</h1>
            <p className="text-sm text-slate-500">
              Secure P2P wallet built on locked ledger transactions.
            </p>
          </div>
        </div>

        <form className="space-y-4" onSubmit={submit}>
          {mode === "register" ? (
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">
                Name
              </span>
              <span className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3">
                <UserRound size={18} className="text-slate-400" aria-hidden="true" />
                <input
                  className="focus-ring min-h-11 w-full border-0 bg-transparent outline-none"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  autoComplete="name"
                  required
                />
              </span>
            </label>
          ) : null}

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">
              Email
            </span>
            <span className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3">
              <Mail size={18} className="text-slate-400" aria-hidden="true" />
              <input
                className="focus-ring min-h-11 w-full border-0 bg-transparent outline-none"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
              />
            </span>
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">
              Password
            </span>
            <span className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3">
              <LockKeyhole size={18} className="text-slate-400" aria-hidden="true" />
              <input
                className="focus-ring min-h-11 w-full border-0 bg-transparent outline-none"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                required
              />
              <button
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="focus-ring rounded-md p-1 text-slate-500 hover:text-ink"
                type="button"
                onClick={() => setShowPassword((value) => !value)}
              >
                <Eye size={18} aria-hidden="true" />
              </button>
            </span>
          </label>

          {error ? (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          <button
            className="focus-ring flex min-h-11 w-full items-center justify-center rounded-md bg-trustBlue px-4 font-semibold text-white transition hover:bg-[#0b3868] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting
              ? "Working..."
              : mode === "login"
                ? "Sign In"
                : "Create Account"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-600">
          {mode === "login" ? "Need an account?" : "Already registered?"}{" "}
          <Link
            className="font-semibold text-trustBlue hover:underline"
            href={mode === "login" ? "/register" : "/login"}
          >
            {mode === "login" ? "Register" : "Sign in"}
          </Link>
        </p>
      </section>
    </main>
  );
}
