"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  TransactionsService,
  TransferService,
  WalletService,
  type AuthResponse
} from "@wallet/openapi-client";
import {
  ArrowDownToLine,
  ArrowUpRight,
  Banknote,
  CircleCheck,
  Clock3,
  LogOut,
  RefreshCcw,
  SendHorizontal,
  ShieldCheck,
  WalletCards
} from "lucide-react";
import { useRecoilState, useSetRecoilState } from "recoil";
import { configureSdk, makeIdempotencyKey } from "../lib/sdk";
import { sessionAtom, transactionsAtom, walletAtom } from "../state/session";

const sessionStorageKey = "wallet-session";

function parseRupees(value: string): number {
  return Math.round(Number(value || "0") * 100);
}

function StatItem({
  icon,
  label,
  value
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-md bg-slate-100 text-trustBlue">
        {icon}
      </div>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-ink">{value}</p>
    </div>
  );
}

export function DashboardClient() {
  const router = useRouter();
  const [session, setSession] = useRecoilState(sessionAtom);
  const [wallet, setWallet] = useRecoilState(walletAtom);
  const [transactions, setTransactions] = useRecoilState(transactionsAtom);
  const setSessionOnly = useSetRecoilState(sessionAtom);
  const [topUpAmount, setTopUpAmount] = useState("500");
  const [receiverEmail, setReceiverEmail] = useState("aisha@example.com");
  const [transferAmount, setTransferAmount] = useState("100");
  const [note, setNote] = useState("Lunch split");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setBusy] = useState(false);

  const userInitials = useMemo(() => {
    const name = session?.user.name ?? "";
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }, [session?.user.name]);

  const loadDashboard = useCallback(async () => {
    try {
      const [walletResponse, transactionsResponse] = await Promise.all([
        WalletService.getWallet(),
        TransactionsService.listTransactions({ limit: 20 })
      ]);
      setWallet(walletResponse.wallet);
      setTransactions(transactionsResponse.transactions);
    } catch (error: any) {
      setError(error?.body?.error ?? error?.message ?? "Could not refresh wallet");
    }
  }, [setTransactions, setWallet]);

  useEffect(() => {
    const rawSession = localStorage.getItem(sessionStorageKey);
    if (!rawSession) {
      router.replace("/login");
      return;
    }

    const parsed = JSON.parse(rawSession) as AuthResponse;
    configureSdk(parsed.token);
    setSession(parsed);
    setWallet(parsed.wallet);
    void loadDashboard();
  }, [loadDashboard, router, setSession, setWallet]);

  async function topUp(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setStatus(null);

    try {
      const response = await WalletService.addMoney({
        idempotencyKey: makeIdempotencyKey("topup"),
        requestBody: {
          amountPaise: parseRupees(topUpAmount)
        }
      });
      setWallet(response.wallet);
      setStatus("Wallet balance updated.");
      await loadDashboard();
    } catch (error: any) {
      setError(error?.body?.error ?? error?.message ?? "Top-up failed");
    } finally {
      setBusy(false);
    }
  }

  async function transfer(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setStatus(null);

    try {
      const response = await TransferService.transferMoney({
        idempotencyKey: makeIdempotencyKey("transfer"),
        requestBody: {
          receiverEmail,
          amountPaise: parseRupees(transferAmount),
          note
        }
      });
      setWallet(response.wallet);
      setStatus(`Sent ${response.transaction.amountDisplay} to ${receiverEmail}.`);
      await loadDashboard();
    } catch (error: any) {
      setError(error?.body?.error ?? error?.message ?? "Transfer failed");
    } finally {
      setBusy(false);
    }
  }

  function logout() {
    localStorage.removeItem(sessionStorageKey);
    configureSdk();
    setSessionOnly(null);
    setWallet(null);
    setTransactions([]);
    router.replace("/login");
  }

  if (!session) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-slate-500">Loading wallet...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-md bg-paytmBlue text-white">
              <WalletCards size={24} aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-ink">Paytm Wallet P2P</h1>
              <p className="text-sm text-slate-500">
                Concurrent ledger transfers with Redis idempotency.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-white font-semibold text-trustBlue shadow-sm">
              {userInitials || "U"}
            </div>
            <button
              aria-label="Refresh dashboard"
              className="focus-ring rounded-md border border-slate-200 bg-white p-2 text-slate-700 hover:text-trustBlue"
              type="button"
              onClick={() => void loadDashboard()}
            >
              <RefreshCcw size={18} aria-hidden="true" />
            </button>
            <button
              aria-label="Log out"
              className="focus-ring rounded-md border border-slate-200 bg-white p-2 text-slate-700 hover:text-red-600"
              type="button"
              onClick={logout}
            >
              <LogOut size={18} aria-hidden="true" />
            </button>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg bg-trustBlue p-5 text-white shadow-soft md:col-span-1">
            <p className="text-sm text-blue-100">Available balance</p>
            <p className="mt-3 text-3xl font-semibold">
              {wallet?.balanceDisplay ?? "INR 0.00"}
            </p>
            <p className="mt-3 text-sm text-blue-100">
              Wallet ID {wallet?.id.slice(0, 8) ?? "loading"}
            </p>
          </div>
          <StatItem
            icon={<ShieldCheck size={19} aria-hidden="true" />}
            label="Isolation"
            value="REPEATABLE READ"
          />
          <StatItem
            icon={<Clock3 size={19} aria-hidden="true" />}
            label="Retry safety"
            value="Redis idempotency"
          />
        </section>

        {status ? (
          <div className="mt-5 flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            <CircleCheck size={18} aria-hidden="true" />
            {status}
          </div>
        ) : null}

        {error ? (
          <div className="mt-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <section className="mt-6 grid gap-6 lg:grid-cols-[380px_1fr]">
          <div className="space-y-6">
            <form
              className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
              onSubmit={topUp}
            >
              <div className="mb-4 flex items-center gap-2">
                <ArrowDownToLine size={20} className="text-mint" aria-hidden="true" />
                <h2 className="text-lg font-semibold text-ink">Add Money</h2>
              </div>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">
                  Amount in rupees
                </span>
                <input
                  className="focus-ring min-h-11 w-full rounded-md border border-slate-200 px-3 outline-none"
                  min="1"
                  step="1"
                  type="number"
                  value={topUpAmount}
                  onChange={(event) => setTopUpAmount(event.target.value)}
                />
              </label>
              <button
                className="focus-ring mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-mint px-4 font-semibold text-white disabled:opacity-60"
                disabled={isBusy}
                type="submit"
              >
                <Banknote size={18} aria-hidden="true" />
                Top Up
              </button>
            </form>

            <form
              className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
              onSubmit={transfer}
            >
              <div className="mb-4 flex items-center gap-2">
                <SendHorizontal
                  size={20}
                  className="text-paytmBlue"
                  aria-hidden="true"
                />
                <h2 className="text-lg font-semibold text-ink">Send Money</h2>
              </div>
              <div className="space-y-3">
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-slate-700">
                    Receiver email
                  </span>
                  <input
                    className="focus-ring min-h-11 w-full rounded-md border border-slate-200 px-3 outline-none"
                    type="email"
                    value={receiverEmail}
                    onChange={(event) => setReceiverEmail(event.target.value)}
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-slate-700">
                    Amount in rupees
                  </span>
                  <input
                    className="focus-ring min-h-11 w-full rounded-md border border-slate-200 px-3 outline-none"
                    min="1"
                    step="1"
                    type="number"
                    value={transferAmount}
                    onChange={(event) => setTransferAmount(event.target.value)}
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-slate-700">
                    Note
                  </span>
                  <textarea
                    className="focus-ring min-h-20 w-full resize-none rounded-md border border-slate-200 px-3 py-2 outline-none"
                    maxLength={160}
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                  />
                </label>
              </div>
              <button
                className="focus-ring mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-trustBlue px-4 font-semibold text-white disabled:opacity-60"
                disabled={isBusy}
                type="submit"
              >
                <ArrowUpRight size={18} aria-hidden="true" />
                Transfer
              </button>
            </form>
          </div>

          <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <h2 className="text-lg font-semibold text-ink">Transactions</h2>
                <p className="text-sm text-slate-500">Latest ledger entries</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Type</th>
                    <th className="px-5 py-3 font-semibold">Counterparty</th>
                    <th className="px-5 py-3 font-semibold">Amount</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                    <th className="px-5 py-3 font-semibold">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-slate-50">
                      <td className="px-5 py-4">
                        <span
                          className={
                            transaction.type === "credit"
                              ? "rounded-md bg-emerald-50 px-2 py-1 text-emerald-700"
                              : "rounded-md bg-sky-50 px-2 py-1 text-sky-700"
                          }
                        >
                          {transaction.type}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-medium text-ink">
                          {transaction.counterpartyName}
                        </p>
                        <p className="text-xs text-slate-500">
                          {transaction.counterpartyEmail}
                        </p>
                      </td>
                      <td className="px-5 py-4 font-semibold text-ink">
                        {transaction.amountDisplay}
                      </td>
                      <td className="px-5 py-4">
                        <span className="rounded-md bg-slate-100 px-2 py-1 text-slate-700">
                          {transaction.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-slate-500">
                        {new Date(transaction.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                  {!transactions.length ? (
                    <tr>
                      <td className="px-5 py-10 text-center text-slate-500" colSpan={5}>
                        No transactions yet.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}
