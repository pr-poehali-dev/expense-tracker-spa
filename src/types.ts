export type Page = "login" | "dashboard" | "transactions" | "reports" | "settings";
export type TxType = "income" | "expense" | "transfer";

export interface Transaction {
  id: string;
  amount: number;
  category: string;
  comment: string;
  type: TxType;
  date: string;
}

export interface Goal {
  name: string;
  target: number;
  current: number;
}

export interface Settings {
  currency: string;
  theme: "light" | "dark";
}

export interface User {
  id: number;
  login: string;
  email: string;
}

export const EXPENSE_CATEGORIES = [
  { name: "Еда", icon: "UtensilsCrossed", color: "#F59E0B" },
  { name: "Транспорт", icon: "Car", color: "#3B82F6" },
  { name: "Развлечения", icon: "Gamepad2", color: "#8B5CF6" },
  { name: "Здоровье", icon: "Heart", color: "#EF4444" },
  { name: "Одежда", icon: "Shirt", color: "#EC4899" },
  { name: "Коммунальные", icon: "Home", color: "#6B7280" },
  { name: "Образование", icon: "BookOpen", color: "#10B981" },
  { name: "Путешествия", icon: "Plane", color: "#06B6D4" },
  { name: "Спорт", icon: "Dumbbell", color: "#F97316" },
  { name: "Подписки", icon: "Repeat", color: "#A855F7" },
];

export const INCOME_CATEGORIES = [
  { name: "Зарплата", icon: "Briefcase", color: "#10B981" },
  { name: "Подработка", icon: "Hammer", color: "#34D399" },
  { name: "Фриланс", icon: "Laptop", color: "#06B6D4" },
  { name: "Инвестиции", icon: "TrendingUp", color: "#FBBF24" },
  { name: "Подарок", icon: "Gift", color: "#F472B6" },
  { name: "Иные доходы", icon: "PlusCircle", color: "#A3E635" },
];

export const ALL_CATEGORIES = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];

export const CATEGORY_COLORS: Record<string, string> = Object.fromEntries(
  ALL_CATEGORIES.map((c) => [c.name, c.color])
);

export const CURRENCIES: Record<string, string> = { RUB: "₽", USD: "$", EUR: "€" };

export const DEFAULT_SETTINGS: Settings = {
  currency: "RUB",
  theme: "dark",
};

export function formatMoney(amount: number, currency: string): string {
  const sym = CURRENCIES[currency] || "₽";
  return `${amount.toLocaleString("ru-RU")} ${sym}`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("ru-RU", {
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
  });
}
