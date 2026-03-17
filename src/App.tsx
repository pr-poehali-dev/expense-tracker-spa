import { useState, useEffect, useRef } from "react";
import Icon from "@/components/ui/icon";

// ─── Types ───────────────────────────────────────────────────────────────────

type Page = "login" | "dashboard" | "transactions" | "reports" | "settings";
type TxType = "income" | "expense";

interface Transaction {
  id: string;
  amount: number;
  category: string;
  comment: string;
  type: TxType;
  date: string;
}

interface Settings {
  currency: string;
  theme: "light" | "dark";
  goalName: string;
  goalTarget: number;
  goalCurrent: number;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const CATEGORIES = [
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

const CATEGORY_COLORS: Record<string, string> = Object.fromEntries(
  CATEGORIES.map((c) => [c.name, c.color])
);

const CURRENCIES: Record<string, string> = { RUB: "₽", USD: "$", EUR: "€" };

const DEMO_TRANSACTIONS: Transaction[] = [
  { id: "1", amount: 85000, category: "Еда", comment: "Продукты на неделю", type: "income", date: new Date(Date.now() - 1 * 86400000).toISOString() },
  { id: "2", amount: 3200, category: "Транспорт", comment: "Метро + такси", type: "expense", date: new Date(Date.now() - 2 * 86400000).toISOString() },
  { id: "3", amount: 1500, category: "Развлечения", comment: "Кино", type: "expense", date: new Date(Date.now() - 3 * 86400000).toISOString() },
  { id: "4", amount: 800, category: "Подписки", comment: "Яндекс Плюс", type: "expense", date: new Date(Date.now() - 4 * 86400000).toISOString() },
  { id: "5", amount: 4500, category: "Здоровье", comment: "Аптека", type: "expense", date: new Date(Date.now() - 5 * 86400000).toISOString() },
  { id: "6", amount: 120000, category: "Образование", comment: "Зарплата", type: "income", date: new Date(Date.now() - 6 * 86400000).toISOString() },
  { id: "7", amount: 12000, category: "Одежда", comment: "Кроссовки", type: "expense", date: new Date(Date.now() - 7 * 86400000).toISOString() },
  { id: "8", amount: 6800, category: "Коммунальные", comment: "ЖКХ за месяц", type: "expense", date: new Date(Date.now() - 8 * 86400000).toISOString() },
];

const DEFAULT_SETTINGS: Settings = {
  currency: "RUB",
  theme: "dark",
  goalName: "Накопить на ноутбук",
  goalTarget: 120000,
  goalCurrent: 61000,
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatMoney(amount: number, currency: string): string {
  const sym = CURRENCIES[currency] || "₽";
  return `${amount.toLocaleString("ru-RU")} ${sym}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
}

function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);
  return [value, setValue] as const;
}

// ─── Login ────────────────────────────────────────────────────────────────────

function LoginPage({ onLogin }: { onLogin: () => void }) {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!login || !password) { setError("Заполните все поля"); return; }
    setLoading(true);
    setTimeout(() => { setLoading(false); onLogin(); }, 800);
  };

  return (
    <div className="login-page">
      <div className="login-bg">
        <div className="login-blob blob-1" />
        <div className="login-blob blob-2" />
        <div className="login-blob blob-3" />
      </div>
      <div className="login-card animate-fade-in">
        <div className="login-logo">
          <div className="logo-icon">
            <Icon name="TrendingUp" size={28} color="#10B981" />
          </div>
          <div>
            <h1 className="login-title">ФинКонтроль</h1>
            <p className="login-subtitle">Учёт личных расходов</p>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="login-form">
          <div className="field-group">
            <label className="field-label">Логин</label>
            <div className="field-wrap">
              <Icon name="User" size={16} className="field-icon" />
              <input
                className="field-input"
                type="text"
                placeholder="demo"
                value={login}
                onChange={(e) => { setLogin(e.target.value); setError(""); }}
              />
            </div>
          </div>
          <div className="field-group">
            <label className="field-label">Пароль</label>
            <div className="field-wrap">
              <Icon name="Lock" size={16} className="field-icon" />
              <input
                className="field-input"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
              />
            </div>
          </div>
          {error && <p className="field-error">{error}</p>}
          <button className="btn-primary btn-full" type="submit" disabled={loading}>
            {loading ? <span className="spinner" /> : null}
            {loading ? "Входим..." : "Войти"}
          </button>
          <p className="login-hint">Демо: любой логин и пароль</p>
        </form>
      </div>
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function Sidebar({ page, setPage }: { page: Page; setPage: (p: Page) => void }) {
  const items = [
    { id: "dashboard", label: "Главная", icon: "LayoutDashboard" },
    { id: "transactions", label: "Транзакции", icon: "ArrowLeftRight" },
    { id: "reports", label: "Отчёты", icon: "BarChart2" },
    { id: "settings", label: "Настройки", icon: "Settings" },
  ] as const;

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon-sm">
          <Icon name="TrendingUp" size={20} color="#10B981" />
        </div>
        <span className="sidebar-brand">ФинКонтроль</span>
      </div>
      <nav className="sidebar-nav">
        {items.map((item) => (
          <button
            key={item.id}
            className={`nav-item ${page === item.id ? "nav-item--active" : ""}`}
            onClick={() => setPage(item.id)}
          >
            <Icon name={item.icon} size={20} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="user-avatar">Д</div>
          <div>
            <p className="user-name">Демо пользователь</p>
            <p className="user-role">Личный аккаунт</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

function Dashboard({ transactions, settings }: { transactions: Transaction[]; settings: Settings }) {
  const balance = transactions.reduce((acc, t) =>
    t.type === "income" ? acc + t.amount : acc - t.amount, 0
  );
  const totalIncome = transactions.filter(t => t.type === "income").reduce((a, t) => a + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === "expense").reduce((a, t) => a + t.amount, 0);
  const recent = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);
  const goalPct = Math.min(100, Math.round((settings.goalCurrent / settings.goalTarget) * 100));

  return (
    <div className="page-content animate-fade-in">
      <div className="page-header">
        <h2 className="page-title">Главная</h2>
        <p className="page-date">{new Date().toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long" })}</p>
      </div>

      <div className="stat-cards">
        <div className="stat-card stat-card--balance">
          <div className="stat-label">Текущий баланс</div>
          <div className="stat-value stat-value--large">{formatMoney(balance, settings.currency)}</div>
          <div className="stat-sub">Обновлено сейчас</div>
        </div>
        <div className="stat-card stat-card--income">
          <div className="stat-label">Доходы</div>
          <div className="stat-value stat-value--green">+{formatMoney(totalIncome, settings.currency)}</div>
          <div className="stat-icon-wrap"><Icon name="TrendingUp" size={32} /></div>
        </div>
        <div className="stat-card stat-card--expense">
          <div className="stat-label">Расходы</div>
          <div className="stat-value stat-value--red">−{formatMoney(totalExpense, settings.currency)}</div>
          <div className="stat-icon-wrap"><Icon name="TrendingDown" size={32} /></div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <h3 className="card-title">Последние операции</h3>
          <div className="tx-list">
            {recent.map((t) => (
              <div key={t.id} className="tx-row">
                <div className="tx-cat-dot" style={{ background: CATEGORY_COLORS[t.category] || "#888" }} />
                <div className="tx-info">
                  <span className="tx-cat">{t.category}</span>
                  <span className="tx-comment">{t.comment}</span>
                </div>
                <div className="tx-right">
                  <span className={`tx-amount ${t.type === "income" ? "tx-amount--plus" : "tx-amount--minus"}`}>
                    {t.type === "income" ? "+" : "−"}{formatMoney(t.amount, settings.currency)}
                  </span>
                  <span className="tx-date">{formatDate(t.date)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 className="card-title">Финансовая цель</h3>
          <div className="goal-block">
            <div className="goal-header">
              <Icon name="Target" size={24} color="#FBBF24" />
              <span className="goal-name">{settings.goalName}</span>
            </div>
            <div className="goal-progress-wrap">
              <div className="goal-progress-track">
                <div className="goal-progress-fill" style={{ width: `${goalPct}%` }} />
              </div>
            </div>
            <div className="goal-stats">
              <span className="goal-pct">{goalPct}%</span>
              <span className="goal-amounts">
                {formatMoney(settings.goalCurrent, settings.currency)} из {formatMoney(settings.goalTarget, settings.currency)}
              </span>
            </div>
            <p className="goal-remain">
              Осталось: {formatMoney(settings.goalTarget - settings.goalCurrent, settings.currency)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Transactions ─────────────────────────────────────────────────────────────

function TransactionsPage({
  transactions,
  setTransactions,
  settings,
}: {
  transactions: Transaction[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  settings: Settings;
}) {
  const empty = { amount: "", category: CATEGORIES[0].name, comment: "", type: "expense" as TxType };
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(form.amount);
    if (!form.amount || isNaN(amt) || amt <= 0) { setError("Введите корректную сумму"); return; }
    if (editId) {
      setTransactions(prev => prev.map(t => t.id === editId ? { ...t, amount: amt, category: form.category, comment: form.comment, type: form.type } : t));
      setEditId(null);
    } else {
      const tx: Transaction = { id: Date.now().toString(), amount: amt, category: form.category, comment: form.comment, type: form.type, date: new Date().toISOString() };
      setTransactions(prev => [tx, ...prev]);
    }
    setForm(empty);
    setError("");
  };

  const startEdit = (t: Transaction) => {
    setEditId(t.id);
    setForm({ amount: t.amount.toString(), category: t.category, comment: t.comment, type: t.type });
  };

  const remove = (id: string) => setTransactions(prev => prev.filter(t => t.id !== id));
  const cancel = () => { setEditId(null); setForm(empty); setError(""); };

  const sorted = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="page-content animate-fade-in">
      <div className="page-header">
        <h2 className="page-title">Транзакции</h2>
      </div>

      <div className="tx-page-grid">
        <div className="card">
          <h3 className="card-title">{editId ? "Редактировать" : "Добавить транзакцию"}</h3>
          <form onSubmit={handleSubmit} className="tx-form">
            <div className="field-group">
              <label className="field-label">Тип</label>
              <div className="type-toggle">
                <button type="button" className={`type-btn ${form.type === "expense" ? "type-btn--active-red" : ""}`}
                  onClick={() => setForm(f => ({ ...f, type: "expense" }))}>
                  <Icon name="TrendingDown" size={14} /> Расход
                </button>
                <button type="button" className={`type-btn ${form.type === "income" ? "type-btn--active-green" : ""}`}
                  onClick={() => setForm(f => ({ ...f, type: "income" }))}>
                  <Icon name="TrendingUp" size={14} /> Доход
                </button>
              </div>
            </div>
            <div className="form-row form-row--2">
              <div className="field-group">
                <label className="field-label">Сумма</label>
                <div className="field-wrap">
                  <span className="field-icon currency-sym">{CURRENCIES[settings.currency]}</span>
                  <input className="field-input" type="number" placeholder="0.00" min="0" step="0.01"
                    value={form.amount} onChange={e => { setForm(f => ({ ...f, amount: e.target.value })); setError(""); }} />
                </div>
              </div>
              <div className="field-group">
                <label className="field-label">Категория</label>
                <div className="field-wrap">
                  <Icon name="Tag" size={16} className="field-icon" />
                  <select className="field-input field-select" value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                    {CATEGORIES.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="field-group">
              <label className="field-label">Комментарий</label>
              <div className="field-wrap">
                <Icon name="MessageSquare" size={16} className="field-icon" />
                <input className="field-input" type="text" placeholder="Необязательно..."
                  value={form.comment} onChange={e => setForm(f => ({ ...f, comment: e.target.value }))} />
              </div>
            </div>
            {error && <p className="field-error">{error}</p>}
            <div className="form-actions">
              <button className="btn-primary" type="submit">
                <Icon name={editId ? "Save" : "Plus"} size={16} />
                {editId ? "Сохранить" : "Добавить"}
              </button>
              {editId && <button className="btn-ghost" type="button" onClick={cancel}>Отмена</button>}
            </div>
          </form>
        </div>

        <div className="card">
          <h3 className="card-title">Все операции <span className="count-badge">{transactions.length}</span></h3>
          <div className="tx-list tx-list--full">
            {sorted.length === 0 && <p className="empty-state">Нет транзакций. Добавьте первую!</p>}
            {sorted.map((t) => (
              <div key={t.id} className="tx-row tx-row--editable">
                <div className="tx-cat-dot" style={{ background: CATEGORY_COLORS[t.category] || "#888" }} />
                <div className="tx-info">
                  <span className="tx-cat">{t.category}</span>
                  <span className="tx-comment">{t.comment || "—"}</span>
                </div>
                <div className="tx-right">
                  <span className={`tx-amount ${t.type === "income" ? "tx-amount--plus" : "tx-amount--minus"}`}>
                    {t.type === "income" ? "+" : "−"}{formatMoney(t.amount, settings.currency)}
                  </span>
                  <span className="tx-date">{formatDate(t.date)}</span>
                </div>
                <div className="tx-actions">
                  <button className="icon-btn icon-btn--edit" onClick={() => startEdit(t)} title="Редактировать">
                    <Icon name="Pencil" size={14} />
                  </button>
                  <button className="icon-btn icon-btn--delete" onClick={() => remove(t.id)} title="Удалить">
                    <Icon name="Trash2" size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Reports ──────────────────────────────────────────────────────────────────

function ReportsPage({ transactions, settings }: { transactions: Transaction[]; settings: Settings }) {
  const [period, setPeriod] = useState<"week" | "month" | "year">("month");
  const chartRef = useRef<HTMLCanvasElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chartInstance = useRef<Record<string, any> | null>(null);

  const now = Date.now();
  const ms = period === "week" ? 7 : period === "month" ? 30 : 365;
  const cutoff = now - ms * 86400000;
  const filtered = transactions.filter(t => t.type === "expense" && new Date(t.date).getTime() > cutoff);
  const totalExpense = filtered.reduce((a, t) => a + t.amount, 0);
  const byCategory = CATEGORIES.map(c => ({
    name: c.name,
    amount: filtered.filter(t => t.category === c.name).reduce((a, t) => a + t.amount, 0),
    color: c.color,
  })).filter(c => c.amount > 0).sort((a, b) => b.amount - a.amount);

  useEffect(() => {
    if (!chartRef.current) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const win = window as Record<string, any>;
    if (!win.Chart) return;

    if (chartInstance.current) chartInstance.current.destroy();
    if (byCategory.length === 0) return;

    chartInstance.current = new win.Chart(chartRef.current, {
      type: "doughnut",
      data: {
        labels: byCategory.map(c => c.name),
        datasets: [{
          data: byCategory.map(c => c.amount),
          backgroundColor: byCategory.map(c => c.color),
          borderColor: "transparent",
          borderWidth: 0,
          hoverOffset: 8,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "65%",
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              label: (ctx: Record<string, any>) => ` ${ctx.label}: ${formatMoney(ctx.raw, settings.currency)}`,
            },
          },
        },
      },
    });
    return () => { if (chartInstance.current) chartInstance.current.destroy(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, settings.currency, transactions.length]);

  const periodLabels = { week: "Неделя", month: "Месяц", year: "Год" };

  return (
    <div className="page-content animate-fade-in">
      <div className="page-header">
        <h2 className="page-title">Отчёты</h2>
        <div className="period-tabs">
          {(["week", "month", "year"] as const).map(p => (
            <button key={p} className={`period-btn ${period === p ? "period-btn--active" : ""}`} onClick={() => setPeriod(p)}>
              {periodLabels[p]}
            </button>
          ))}
        </div>
      </div>

      <div className="reports-grid">
        <div className="card chart-card">
          <h3 className="card-title">Расходы по категориям</h3>
          {byCategory.length === 0 ? (
            <div className="empty-chart">
              <Icon name="PieChart" size={48} color="var(--c-muted)" />
              <p>Нет данных за выбранный период</p>
            </div>
          ) : (
            <div className="chart-wrap">
              <div className="chart-container">
                <canvas ref={chartRef} />
                <div className="chart-center">
                  <div className="chart-center-val">{formatMoney(totalExpense, settings.currency)}</div>
                  <div className="chart-center-lbl">Всего</div>
                </div>
              </div>
              <div className="chart-legend">
                {byCategory.map(c => (
                  <div key={c.name} className="legend-item">
                    <div className="legend-dot" style={{ background: c.color }} />
                    <span className="legend-name">{c.name}</span>
                    <span className="legend-pct">{totalExpense ? Math.round(c.amount / totalExpense * 100) : 0}%</span>
                    <span className="legend-amount">{formatMoney(c.amount, settings.currency)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="card">
          <h3 className="card-title">Топ категорий</h3>
          <div className="category-bars">
            {byCategory.slice(0, 6).map(c => (
              <div key={c.name} className="cat-bar-item">
                <div className="cat-bar-header">
                  <span className="cat-bar-name">{c.name}</span>
                  <span className="cat-bar-amount">{formatMoney(c.amount, settings.currency)}</span>
                </div>
                <div className="cat-bar-track">
                  <div className="cat-bar-fill" style={{
                    width: `${totalExpense ? (c.amount / totalExpense * 100) : 0}%`,
                    background: c.color,
                  }} />
                </div>
              </div>
            ))}
            {byCategory.length === 0 && <p className="empty-state">Нет данных</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Settings ─────────────────────────────────────────────────────────────────

function SettingsPage({
  settings,
  setSettings,
}: {
  settings: Settings;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
}) {
  const [goalName, setGoalName] = useState(settings.goalName);
  const [goalTarget, setGoalTarget] = useState(settings.goalTarget.toString());
  const [goalCurrent, setGoalCurrent] = useState(settings.goalCurrent.toString());
  const [saved, setSaved] = useState(false);

  const save = () => {
    setSettings(s => ({
      ...s,
      goalName,
      goalTarget: parseFloat(goalTarget) || s.goalTarget,
      goalCurrent: parseFloat(goalCurrent) || s.goalCurrent,
    }));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="page-content animate-fade-in">
      <div className="page-header">
        <h2 className="page-title">Настройки</h2>
      </div>

      <div className="settings-grid">
        <div className="card">
          <h3 className="card-title">Внешний вид</h3>
          <div className="settings-section">
            <div className="setting-row">
              <div>
                <p className="setting-label">Валюта</p>
                <p className="setting-desc">Используется во всём приложении</p>
              </div>
              <div className="currency-select">
                {Object.entries(CURRENCIES).map(([code, sym]) => (
                  <button key={code}
                    className={`currency-btn ${settings.currency === code ? "currency-btn--active" : ""}`}
                    onClick={() => setSettings(s => ({ ...s, currency: code }))}>
                    {sym} {code}
                  </button>
                ))}
              </div>
            </div>

            <div className="setting-row">
              <div>
                <p className="setting-label">Тема</p>
                <p className="setting-desc">Цветовая схема интерфейса</p>
              </div>
              <div className="theme-toggle">
                <button className={`theme-btn ${settings.theme === "dark" ? "theme-btn--active" : ""}`}
                  onClick={() => setSettings(s => ({ ...s, theme: "dark" }))}>
                  <Icon name="Moon" size={16} /> Тёмная
                </button>
                <button className={`theme-btn ${settings.theme === "light" ? "theme-btn--active" : ""}`}
                  onClick={() => setSettings(s => ({ ...s, theme: "light" }))}>
                  <Icon name="Sun" size={16} /> Светлая
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="card-title">Финансовая цель</h3>
          <div className="settings-section">
            <div className="field-group">
              <label className="field-label">Название цели</label>
              <div className="field-wrap">
                <Icon name="Target" size={16} className="field-icon" />
                <input className="field-input" type="text" value={goalName} onChange={e => setGoalName(e.target.value)} />
              </div>
            </div>
            <div className="form-row form-row--2">
              <div className="field-group">
                <label className="field-label">Цель ({CURRENCIES[settings.currency]})</label>
                <div className="field-wrap">
                  <span className="field-icon currency-sym">{CURRENCIES[settings.currency]}</span>
                  <input className="field-input" type="number" value={goalTarget} onChange={e => setGoalTarget(e.target.value)} />
                </div>
              </div>
              <div className="field-group">
                <label className="field-label">Накоплено ({CURRENCIES[settings.currency]})</label>
                <div className="field-wrap">
                  <span className="field-icon currency-sym">{CURRENCIES[settings.currency]}</span>
                  <input className="field-input" type="number" value={goalCurrent} onChange={e => setGoalCurrent(e.target.value)} />
                </div>
              </div>
            </div>
            <button className="btn-primary" onClick={save}>
              {saved ? <><Icon name="Check" size={16} /> Сохранено!</> : <><Icon name="Save" size={16} /> Сохранить</>}
            </button>
          </div>
        </div>

        <div className="card">
          <h3 className="card-title">О проекте</h3>
          <div className="about-block">
            <div className="about-row">
              <Icon name="GraduationCap" size={20} color="#FBBF24" />
              <div>
                <p className="about-label">Дипломный проект</p>
                <p className="about-val">Создание веб-сайта для контроля личных расходов</p>
              </div>
            </div>
            <div className="about-row">
              <Icon name="Code2" size={20} color="#10B981" />
              <div>
                <p className="about-label">Технологии</p>
                <p className="about-val">React · TypeScript · Chart.js · LocalStorage</p>
              </div>
            </div>
            <div className="about-row">
              <Icon name="Palette" size={20} color="#3B82F6" />
              <div>
                <p className="about-label">Дизайн</p>
                <p className="about-val">Poppins + Roboto · Тёмно-синяя гамма</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── App Root ─────────────────────────────────────────────────────────────────

export default function App() {
  const [page, setPage] = useState<Page>("login");
  const [transactions, setTransactions] = useLocalStorage<Transaction[]>("fincontrol_tx", DEMO_TRANSACTIONS);
  const [settings, setSettings] = useLocalStorage<Settings>("fincontrol_settings", DEFAULT_SETTINGS);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", settings.theme);
  }, [settings.theme]);

  if (page === "login") {
    return <LoginPage onLogin={() => setPage("dashboard")} />;
  }

  return (
    <div className="app-layout">
      <button className="mobile-menu-btn" onClick={() => setMenuOpen(o => !o)}>
        <Icon name={menuOpen ? "X" : "Menu"} size={22} />
      </button>
      {menuOpen && <div className="mobile-overlay" onClick={() => setMenuOpen(false)} />}
      <div className={`sidebar-wrap ${menuOpen ? "sidebar-wrap--open" : ""}`}>
        <Sidebar page={page} setPage={(p) => { setPage(p); setMenuOpen(false); }} />
      </div>
      <main className="main-content">
        {page === "dashboard" && <Dashboard transactions={transactions} settings={settings} />}
        {page === "transactions" && <TransactionsPage transactions={transactions} setTransactions={setTransactions} settings={settings} />}
        {page === "reports" && <ReportsPage transactions={transactions} settings={settings} />}
        {page === "settings" && <SettingsPage settings={settings} setSettings={setSettings} />}
      </main>
    </div>
  );
}