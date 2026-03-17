const AUTH_URL = "https://functions.poehali.dev/9924a499-d921-46e3-936a-88fb1d734130";
const TX_URL = "https://functions.poehali.dev/91df9ba3-e115-41b4-9bd0-dab6388ac1e2";
const GOALS_URL = "https://functions.poehali.dev/5a58de45-ca18-4524-9d3a-9da93c4318ed";

function getSession(): string {
  return localStorage.getItem("session_id") || "";
}

async function req(url: string, method = "GET", body?: object) {
  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      "X-Session-Id": getSession(),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Ошибка запроса");
  return data;
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export const api = {
  register: (login: string, email: string, password: string) =>
    req(`${AUTH_URL}/register`, "POST", { login, email, password }),

  login: (login: string, password: string) =>
    req(`${AUTH_URL}/login`, "POST", { login, password }),

  logout: () =>
    req(`${AUTH_URL}/logout`, "POST"),

  me: () =>
    req(`${AUTH_URL}/me`),

  resetRequest: (email: string) =>
    req(`${AUTH_URL}/reset-request`, "POST", { email }),

  resetConfirm: (token: string, new_password: string) =>
    req(`${AUTH_URL}/reset-confirm`, "POST", { token, new_password }),

  // ── Transactions ─────────────────────────────────────────────────────────
  getTransactions: () =>
    req(`${TX_URL}/`),

  addTransaction: (tx: { amount: number; category: string; comment: string; type: string; date?: string }) =>
    req(`${TX_URL}/`, "POST", tx),

  updateTransaction: (id: number, tx: { amount: number; category: string; comment: string; type: string }) =>
    req(`${TX_URL}/${id}`, "PUT", tx),

  removeTransaction: (id: number) =>
    req(`${TX_URL}/${id}`, "DELETE"),

  // ── Goals ─────────────────────────────────────────────────────────────────
  getGoal: () =>
    req(`${GOALS_URL}/goal`),

  saveGoal: (goal: { name: string; target: number; current: number }) =>
    req(`${GOALS_URL}/goal`, "POST", goal),

  fundGoal: (amount: number) =>
    req(`${GOALS_URL}/goal/fund`, "POST", { amount }),

  getSettings: () =>
    req(`${GOALS_URL}/settings`),

  saveSettings: (s: { currency: string; theme: string }) =>
    req(`${GOALS_URL}/settings`, "POST", s),
};
