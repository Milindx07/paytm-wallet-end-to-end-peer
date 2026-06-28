"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  OpsService,
  ProfileService,
  ReceiversService,
  TransactionsService,
  TransferService,
  WalletService,
  type AuthResponse,
  type ProfileResponse,
  type Receiver
} from "@wallet/openapi-client";
import {
  ArrowDownToLine,
  ArrowUpRight,
  BadgeCheck,
  Banknote,
  Building2,
  CheckCircle2,
  ChevronRight,
  CircleCheck,
  Clock3,
  Fingerprint,
  Gauge,
  IndianRupee,
  LockKeyhole,
  LogOut,
  RefreshCcw,
  Search,
  SendHorizontal,
  ShieldCheck,
  Smartphone,
  UserRound,
  WalletCards
} from "lucide-react";
import { useRecoilState, useSetRecoilState } from "recoil";
import { configureSdk, makeIdempotencyKey } from "../lib/sdk";
import { sessionAtom, transactionsAtom, walletAtom } from "../state/session";

const sessionStorageKey = "wallet-session";

function parseRupees(value: string): number {
  return Math.round(Number(value || "0") * 100);
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 py-2 last:border-0">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-right text-sm font-medium text-ink">{value}</span>
    </div>
  );
}

function BackendPanel({
  title,
  payload
}: {
  title: string;
  payload: unknown;
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-[#111827] p-4 text-white shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase text-slate-400">Backend response</p>
          <h2 className="text-base font-semibold">{title}</h2>
        </div>
        <BadgeCheck size={20} className="text-paytmBlue" aria-hidden="true" />
      </div>
      <pre className="max-h-72 overflow-auto rounded-md bg-black/30 p-3 text-xs leading-relaxed text-slate-100">
        {JSON.stringify(payload, null, 2)}
      </pre>
    </section>
  );
}

function ActionCard({
  icon,
  label,
  value,
  onClick
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onClick: () => void;
}) {
  return (
    <button
      className="focus-ring group rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-paytmBlue hover:shadow-soft"
      type="button"
      onClick={onClick}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-slate-100 text-trustBlue">
          {icon}
        </div>
        <ChevronRight
          size={18}
          className="text-slate-400 transition group-hover:translate-x-1 group-hover:text-paytmBlue"
          aria-hidden="true"
        />
      </div>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-ink">{value}</p>
    </button>
  );
}

export function DashboardClient() {
  const router = useRouter();
  const [session, setSession] = useRecoilState(sessionAtom);
  const [wallet, setWallet] = useRecoilState(walletAtom);
  const [transactions, setTransactions] = useRecoilState(transactionsAtom);
  const setSessionOnly = useSetRecoilState(sessionAtom);
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [receiver, setReceiver] = useState<Receiver | null>(null);
  const [topUpAmount, setTopUpAmount] = useState("500");
  const [receiverIdentifier, setReceiverIdentifier] = useState("aisha@wallet");
  const [transferAmount, setTransferAmount] = useState("100");
  const [note, setNote] = useState("Lunch split");
  const [aadhaarLast4, setAadhaarLast4] = useState("4321");
  const [upiId, setUpiId] = useState("milan@wallet");
  const [backendTitle, setBackendTitle] = useState("Latest snapshot");
  const [backendPayload, setBackendPayload] = useState<unknown>({
    status: "Open a backend-backed card to inspect live data."
  });
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
      const [walletResponse, transactionsResponse, profileResponse] =
        await Promise.all([
          WalletService.getWallet(),
          TransactionsService.listTransactions({ limit: 20 }),
          ProfileService.getProfile()
        ]);
      setWallet(walletResponse.wallet);
      setTransactions(transactionsResponse.transactions);
      setProfile(profileResponse);
      return {
        wallet: walletResponse.wallet,
        transactions: transactionsResponse.transactions,
        profile: profileResponse
      };
    } catch (error: any) {
      setError(error?.body?.error ?? error?.message ?? "Could not refresh wallet");
      return null;
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

  async function showProfile() {
    setError(null);
    const response = await ProfileService.getProfile();
    setProfile(response);
    setBackendTitle("Profile and KYC");
    setBackendPayload(response);
  }

  async function refreshFromBackend() {
    setError(null);
    setStatus(null);
    const [dashboard, snapshot] = await Promise.all([
      loadDashboard(),
      OpsService.getOpsSnapshot()
    ]);
    setBackendTitle("Refresh snapshot");
    setBackendPayload({ dashboard, snapshot });
    setStatus("Dashboard refreshed from backend services.");
  }

  async function showIsolation() {
    setError(null);
    const response = await OpsService.getIsolationDetails();
    setBackendTitle("Transaction isolation");
    setBackendPayload(response);
  }

  async function showRetrySafety() {
    setError(null);
    const response = await OpsService.getRetrySafetyDetails();
    setBackendTitle("Retry safety");
    setBackendPayload(response);
  }

  async function linkAadhaar(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setStatus(null);

    try {
      const response = await ProfileService.linkAadhaar({
        requestBody: {
          aadhaarLast4,
          consentAccepted: true,
          upiId
        }
      });
      setProfile(response);
      setBackendTitle("Aadhaar KYC mapping");
      setBackendPayload(response);
      setStatus("Aadhaar-style KYC mapped using masked storage.");
    } catch (error: any) {
      setError(error?.body?.error ?? error?.message ?? "Aadhaar mapping failed");
    } finally {
      setBusy(false);
    }
  }

  async function resolveReceiver() {
    setBusy(true);
    setError(null);
    setStatus(null);

    try {
      const response = await ReceiversService.resolveReceiver({
        identifier: receiverIdentifier
      });
      setReceiver(response.receiver);
      setReceiverIdentifier(response.receiver.email);
      setBackendTitle("Receiver verification");
      setBackendPayload(response);
      setStatus(`${response.receiver.name} is verified for instant wallet transfer.`);
    } catch (error: any) {
      setReceiver(null);
      setError(error?.body?.error ?? error?.message ?? "Receiver lookup failed");
    } finally {
      setBusy(false);
    }
  }

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
      setBackendTitle("Wallet top-up");
      setBackendPayload(response);
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
      const email = receiver?.email ?? receiverIdentifier;
      const response = await TransferService.transferMoney({
        idempotencyKey: makeIdempotencyKey("transfer"),
        requestBody: {
          receiverEmail: email,
          amountPaise: parseRupees(transferAmount),
          note
        }
      });
      setWallet(response.wallet);
      setBackendTitle("P2P transfer");
      setBackendPayload(response);
      setStatus(`Sent ${response.transaction.amountDisplay} to ${email}.`);
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
    <main className="min-h-screen bg-paper px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 flex flex-col justify-between gap-4 rounded-lg border border-slate-200 bg-white px-4 py-4 shadow-sm sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-md bg-paytmBlue text-white">
              <WalletCards size={26} aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-ink">Paytm Wallet P2P</h1>
              <p className="text-sm text-slate-500">
                Wallet, KYC, receiver verification, and ledger operations.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              aria-label="Open profile"
              className="focus-ring flex h-11 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 font-semibold text-trustBlue shadow-sm transition hover:border-paytmBlue"
              type="button"
              onClick={() => void showProfile()}
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-trustBlue text-white">
                {userInitials || "M"}
              </span>
              <span className="hidden sm:inline">{session.user.name}</span>
            </button>
            <button
              aria-label="Refresh dashboard from backend"
              className="focus-ring rounded-md border border-slate-200 bg-white p-2 text-slate-700 hover:text-trustBlue"
              type="button"
              onClick={() => void refreshFromBackend()}
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

        <section className="grid min-w-0 gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="min-w-0 rounded-lg bg-trustBlue p-5 text-white shadow-soft">
            <div className="flex flex-col justify-between gap-5 sm:flex-row">
              <div>
                <p className="text-sm text-blue-100">Available wallet balance</p>
                <p className="mt-3 text-4xl font-semibold">
                  {wallet?.balanceDisplay ?? "INR 0.00"}
                </p>
                <p className="mt-3 text-sm text-blue-100">
                  Wallet ID {wallet?.id.slice(0, 8) ?? "loading"} ·{" "}
                  {profile?.kyc.upiId ?? "upi pending"}
                </p>
              </div>
              <div className="grid min-w-48 gap-2 text-sm">
                <span className="rounded-md bg-white/10 px-3 py-2">
                  KYC {profile?.kyc.kycStatus ?? "pending"}
                </span>
                <span className="rounded-md bg-white/10 px-3 py-2">
                  Aadhaar {profile?.kyc.aadhaarMasked ?? "not linked"}
                </span>
              </div>
            </div>
          </div>

          <div className="min-w-0">
            <BackendPanel title={backendTitle} payload={backendPayload} />
          </div>
        </section>

        <section className="mt-4 grid min-w-0 gap-4 md:grid-cols-3">
          <ActionCard
            icon={<ShieldCheck size={19} aria-hidden="true" />}
            label="Isolation"
            value="REPEATABLE READ"
            onClick={() => void showIsolation()}
          />
          <ActionCard
            icon={<Clock3 size={19} aria-hidden="true" />}
            label="Retry safety"
            value="Redis idempotency"
            onClick={() => void showRetrySafety()}
          />
          <ActionCard
            icon={<Gauge size={19} aria-hidden="true" />}
            label="Backend refresh"
            value="Postgres + Redis"
            onClick={() => void refreshFromBackend()}
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

        <section className="mt-6 grid min-w-0 gap-6 xl:grid-cols-[390px_1fr]">
          <div className="min-w-0 space-y-6">
            <form
              className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
              onSubmit={linkAadhaar}
            >
              <div className="mb-4 flex items-center gap-2">
                <Fingerprint size={20} className="text-saffron" aria-hidden="true" />
                <h2 className="text-lg font-semibold text-ink">Aadhaar KYC</h2>
              </div>
              <div className="space-y-3">
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-slate-700">
                    Aadhaar last 4
                  </span>
                  <input
                    className="focus-ring min-h-11 w-full rounded-md border border-slate-200 px-3 outline-none"
                    inputMode="numeric"
                    maxLength={4}
                    pattern="[0-9]{4}"
                    value={aadhaarLast4}
                    onChange={(event) => setAadhaarLast4(event.target.value)}
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-slate-700">
                    UPI ID
                  </span>
                  <input
                    className="focus-ring min-h-11 w-full rounded-md border border-slate-200 px-3 outline-none"
                    value={upiId}
                    onChange={(event) => setUpiId(event.target.value)}
                  />
                </label>
              </div>
              <button
                className="focus-ring mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-saffron px-4 font-semibold text-white disabled:opacity-60"
                disabled={isBusy}
                type="submit"
              >
                <LockKeyhole size={18} aria-hidden="true" />
                Map KYC
              </button>
            </form>

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
          </div>

          <div className="min-w-0 space-y-6">
            <section className="min-w-0 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <SendHorizontal
                  size={20}
                  className="text-paytmBlue"
                  aria-hidden="true"
                />
                <h2 className="text-lg font-semibold text-ink">Send Money</h2>
              </div>

              <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
                <form className="min-w-0 space-y-3" onSubmit={transfer}>
                  <label className="block">
                    <span className="mb-1 block text-sm font-medium text-slate-700">
                      Receiver email or UPI
                    </span>
                    <div className="flex gap-2">
                      <input
                        className="focus-ring min-h-11 w-full rounded-md border border-slate-200 px-3 outline-none"
                        value={receiverIdentifier}
                        onChange={(event) => {
                          setReceiverIdentifier(event.target.value);
                          setReceiver(null);
                        }}
                      />
                      <button
                        aria-label="Verify receiver"
                        className="focus-ring flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-slate-200 text-trustBlue hover:border-paytmBlue"
                        disabled={isBusy}
                        type="button"
                        onClick={() => void resolveReceiver()}
                      >
                        <Search size={18} aria-hidden="true" />
                      </button>
                    </div>
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
                  <button
                    className="focus-ring flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-trustBlue px-4 font-semibold text-white disabled:opacity-60"
                    disabled={isBusy}
                    type="submit"
                  >
                    <ArrowUpRight size={18} aria-hidden="true" />
                    Transfer
                  </button>
                </form>

                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  {receiver ? (
                    <div>
                      <div className="mb-4 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-white text-trustBlue shadow-sm">
                          <UserRound size={20} aria-hidden="true" />
                        </div>
                        <div>
                          <p className="font-semibold text-ink">{receiver.name}</p>
                          <p className="text-xs text-slate-500">{receiver.email}</p>
                        </div>
                      </div>
                      <DetailRow label="UPI" value={receiver.upiId ?? "not set"} />
                      <DetailRow
                        label="KYC"
                        value={
                          <span className="inline-flex items-center gap-1 text-emerald-700">
                            <CheckCircle2 size={14} aria-hidden="true" />
                            {receiver.kycStatus}
                          </span>
                        }
                      />
                      <DetailRow label="Risk" value={receiver.riskTier} />
                      <DetailRow label="Rails" value={receiver.rails.join(", ")} />
                    </div>
                  ) : (
                    <div className="flex h-full min-h-56 flex-col justify-center text-center text-sm text-slate-500">
                      <Smartphone
                        className="mx-auto mb-3 text-slate-400"
                        size={28}
                        aria-hidden="true"
                      />
                      Verify a receiver to load wallet, UPI, and KYC status.
                    </div>
                  )}
                </div>
              </div>
            </section>

            <section className="min-w-0 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                <div>
                  <h2 className="text-lg font-semibold text-ink">Transactions</h2>
                  <p className="text-sm text-slate-500">Latest ledger entries</p>
                </div>
                <IndianRupee size={20} className="text-mint" aria-hidden="true" />
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
                        <td
                          className="px-5 py-10 text-center text-slate-500"
                          colSpan={5}
                        >
                          No transactions yet.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
