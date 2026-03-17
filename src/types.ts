export type Page = "login" | "dashboard" | "transactions" | "reports" | "settings";
export type TxType = "income" | "expense";

export interface Transaction {
  id: string;
  amount: number;
  category: string;
  comment: string;
  type: TxType;
  date: string;
}

export interface Settings {
  currency: string;
  theme: "light" | "dark";
  goalName: string;
  goalTarget: number;
  goalCurrent: number;
}

export const CATEGORIES = [
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

export const CATEGORY_COLORS: Record<string, string> = Object.fromEntries(
  CATEGORIES.map((c) => [c.name, c.color])
);

export const CURRENCIES: Record<string, string> = { RUB: "₽", USD: "$", EUR: "€" };

export const DEMO_TRANSACTIONS: Transaction[] = [
  { id: "1", amount: 85000, category: "Еда", comment: "Продукты на неделю", type: "income", date: new Date(Date.now() - 1 * 86400000).toISOString() },
  { id: "2", amount: 3200, category: "Транспорт", comment: "Метро + такси", type: "expense", date: new Date(Date.now() - 2 * 86400000).toISOString() },
  { id: "3", amount: 1500, category: "Развлечения", comment: "Кино", type: "expense", date: new Date(Date.now() - 3 * 86400000).toISOString() },
  { id: "4", amount: 800, category: "Подписки", comment: "Яндекс Плюс", type: "expense", date: new Date(Date.now() - 4 * 86400000).toISOString() },
  { id: "5", amount: 4500, category: "Здоровье", comment: "Аптека", type: "expense", date: new Date(Date.now() - 5 * 86400000).toISOString() },
  { id: "6", amount: 120000, category: "Образование", comment: "Зарплата", type: "income", date: new Date(Date.now() - 6 * 86400000).toISOString() },
  { id: "7", amount: 12000, category: "Одежда", comment: "Кроссовки", type: "expense", date: new Date(Date.now() - 7 * 86400000).toISOString() },
  { id: "8", amount: 6800, category: "Коммунальные", comment: "ЖКХ за месяц", type: "expense", date: new Date(Date.now() - 8 * 86400000).toISOString() },
];

export const DEFAULT_SETTINGS: Settings = {
  currency: "RUB",
  theme: "dark",
  goalName: "Накопить на ноутбук",
  goalTarget: 120000,
  goalCurrent: 61000,
};

export function formatMoney(amount: number, currency: string): string {
  const sym = CURRENCIES[currency] || "₽";
  return `${amount.toLocaleString("ru-RU")} ${sym}`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
}
