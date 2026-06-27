export type User = {
  id: string;
  name: string;
  email: string;
};

export type Wallet = {
  id: string;
  userId: string;
  balancePaise: number;
  balanceDisplay: string;
  currency: string;
};

export type AuthResponse = {
  token: string;
  user: User;
  wallet: Wallet;
};

export type Transaction = {
  id: string;
  type: "credit" | "debit";
  counterpartyName: string;
  counterpartyEmail: string;
  amountPaise: number;
  amountDisplay: string;
  status: "pending" | "completed" | "failed";
  note?: string | null;
  createdAt: string;
};

export type WalletResponse = {
  wallet: Wallet;
};

export type TransferResponse = {
  transaction: Transaction;
  wallet: Wallet;
};

export type TransactionsResponse = {
  transactions: Transaction[];
};

export type RegisterRequest = {
  name: string;
  email: string;
  password: string;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type AddMoneyRequest = {
  amountPaise: number;
};

export type TransferRequest = {
  receiverEmail: string;
  amountPaise: number;
  note?: string;
};

export const OpenAPI: {
  BASE: string;
  TOKEN?: string | (() => string | Promise<string>);
} = {
  BASE: "http://localhost:4000"
};

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body: unknown
  ) {
    super(message);
  }
}

type RequestOptions = {
  method?: string;
  body?: unknown;
  headers?: Record<string, string | undefined>;
  query?: Record<string, string | number | boolean | undefined>;
};

async function resolveToken(): Promise<string | undefined> {
  if (typeof OpenAPI.TOKEN === "function") {
    return OpenAPI.TOKEN();
  }

  return OpenAPI.TOKEN;
}

function buildUrl(path: string, query?: RequestOptions["query"]): string {
  const base = OpenAPI.BASE.replace(/\/$/, "");
  const requestPath =
    base.endsWith("/api") && path.startsWith("/api")
      ? path.replace(/^\/api/, "")
      : path;
  const url = new URL(`${base}${requestPath}`, globalThis.location?.origin);

  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined) {
      url.searchParams.set(key, String(value));
    }
  }

  return url.toString();
}

async function request<T>(
  path: string,
  { method = "GET", body, headers, query }: RequestOptions = {}
): Promise<T> {
  const token = await resolveToken();
  const response = await fetch(buildUrl(path, query), {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers
    },
    body: body === undefined ? undefined : JSON.stringify(body)
  });

  const contentType = response.headers.get("content-type") ?? "";
  const responseBody = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    throw new ApiError(
      typeof responseBody === "object" && responseBody && "error" in responseBody
        ? String(responseBody.error)
        : response.statusText,
      response.status,
      responseBody
    );
  }

  return responseBody as T;
}

export class AuthService {
  static register(options: {
    requestBody: RegisterRequest;
  }): Promise<AuthResponse> {
    return request<AuthResponse>("/api/auth/register", {
      method: "POST",
      body: options.requestBody
    });
  }

  static login(options: { requestBody: LoginRequest }): Promise<AuthResponse> {
    return request<AuthResponse>("/api/auth/login", {
      method: "POST",
      body: options.requestBody
    });
  }
}

export class WalletService {
  static getWallet(): Promise<WalletResponse> {
    return request<WalletResponse>("/api/wallet");
  }

  static addMoney(options: {
    idempotencyKey?: string;
    requestBody: AddMoneyRequest;
  }): Promise<WalletResponse> {
    return request<WalletResponse>("/api/wallet/add-money", {
      method: "POST",
      body: options.requestBody,
      headers: {
        "Idempotency-Key": options.idempotencyKey
      }
    });
  }
}

export class TransferService {
  static transferMoney(options: {
    idempotencyKey: string;
    requestBody: TransferRequest;
  }): Promise<TransferResponse> {
    return request<TransferResponse>("/api/transfer", {
      method: "POST",
      body: options.requestBody,
      headers: {
        "Idempotency-Key": options.idempotencyKey
      }
    });
  }
}

export class TransactionsService {
  static listTransactions(options: {
    limit?: number;
  } = {}): Promise<TransactionsResponse> {
    return request<TransactionsResponse>("/api/transactions", {
      query: {
        limit: options.limit
      }
    });
  }
}
