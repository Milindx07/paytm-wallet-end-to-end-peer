import type {
  AuthResponse,
  Transaction,
  Wallet
} from "@wallet/openapi-client";
import { atom } from "recoil";

export const sessionAtom = atom<AuthResponse | null>({
  key: "session",
  default: null
});

export const walletAtom = atom<Wallet | null>({
  key: "wallet",
  default: null
});

export const transactionsAtom = atom<Transaction[]>({
  key: "transactions",
  default: []
});
