const AUTH_URL = "https://functions.poehali.dev/9924a499-d921-46e3-936a-88fb1d734130";
const TX_URL = "https://functions.poehali.dev/91df9ba3-e115-41b4-9bd0-dab6388ac1e2";
const GOALS_URL = "https://functions.poehali.dev/5a58de45-ca18-4524-9d3a-9da93c4318ed";

function getSession(): string {
  return localStorage.getItem("session_id") || "";
}

async function call(url: string, body: object) {
  const session = getSession();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (session) {
    headers["Authorization"] = `Bearer ${session}`;
  }
  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Ошибка запроса");
  return data;
}

export const api = {
  // ── Auth ──────────────────────────────────────────────────────────────────
  register: (login: string, email: string, password: string) =>
    call(AUTH_URL, { action: "register", login, email, password }),

  login: (login: string, password: string) =>
    call(AUTH_URL, { action: "login", login, password }),

  logout: () =>
    call(AUTH_URL, { action: "logout" }),

  me: () =>
    call(AUTH_URL, { action: "me" }),

  resetRequest: (email: string) =>
    call(AUTH_URL, { action: "reset-request", email }),

  resetConfirm: (token: string, new_password: string) =>
    call(AUTH_URL, { action: "reset-confirm", token, new_password }),

  // ── Transactions ───────────────────────────────────────────────────────────
  getTransactions: () =>
    call(TX_URL, { action: "list" }),

  addTransaction: (tx: { amount: number; category: string; comment: string; type: string; date?: string }) =>
    call(TX_URL, { action: "add", ...tx }),

  updateTransaction: (id: number, tx: { amount: number; category: string; comment: string; type: string }) =>
    call(TX_URL, { action: "update", id, ...tx }),

  removeTransaction: (id: number) =>
    call(TX_URL, { action: "remove", id }),

  // ── Goals & Settings ───────────────────────────────────────────────────────
  getGoal: () =>
    call(GOALS_URL, { action: "get_goal" }),

  saveGoal: (goal: { name: string; target: number; current: number }) =>
    call(GOALS_URL, { action: "save_goal", ...goal }),

  fundGoal: (amount: number) =>
    call(GOALS_URL, { action: "fund_goal", amount }),

  withdrawGoal: (amount: number) =>
    call(GOALS_URL, { action: "withdraw_goal", amount }),

  getSettings: () =>
    call(GOALS_URL, { action: "get_settings" }),

  saveSettings: (s: { currency: string; theme: string }) =>
    call(GOALS_URL, { action: "save_settings", ...s }),
};