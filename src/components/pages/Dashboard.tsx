import { useState } from "react";
import Icon from "@/components/ui/icon";
import { Transaction, Goal, Settings, CATEGORY_COLORS, formatMoney, formatDateTime } from "@/types";
import { api } from "@/api";

interface Props {
  transactions: Transaction[];
  goal: Goal | null;
  settings: Settings;
  onGoalFunded: (tx: Transaction, newCurrent: number) => void;
  onGoalWithdrawn?: (tx: Transaction, newCurrent: number) => void;
}

export default function Dashboard({ transactions, goal, settings, onGoalFunded, onGoalWithdrawn }: Props) {
  const [fundAmount, setFundAmount] = useState("");
  const [fundError, setFundError] = useState("");
  const [fundLoading, setFundLoading] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawError, setWithdrawError] = useState("");
  const [withdrawLoading, setWithdrawLoading] = useState(false);

  const balance = transactions.reduce((acc, t) => {
    if (t.type === "income") return acc + t.amount;
    if (t.type === "expense") return acc - t.amount;
    return acc - t.amount; // transfer уменьшает баланс
  }, 0);
  const totalIncome = transactions.filter(t => t.type === "income").reduce((a, t) => a + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === "expense").reduce((a, t) => a + t.amount, 0);
  const recent = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);
  const goalPct = goal ? Math.min(100, Math.round((goal.current / goal.target) * 100)) : 0;

  const handleFund = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(fundAmount);
    if (!fundAmount || isNaN(amt) || amt <= 0) { setFundError("Введите корректную сумму"); return; }
    if (amt > balance) { setFundError("Недостаточно средств на балансе"); return; }
    setFundLoading(true);
    try {
      const res = await api.fundGoal(amt);
      onGoalFunded(res.transaction, res.new_current);
      setFundAmount("");
      setFundError("");
    } catch (e: unknown) {
      setFundError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setFundLoading(false);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(withdrawAmount);
    if (!withdrawAmount || isNaN(amt) || amt <= 0) { setWithdrawError("Введите корректную сумму"); return; }
    if (goal && amt > goal.current) { setWithdrawError("Недостаточно средств на цели"); return; }
    setWithdrawLoading(true);
    try {
      const res = await api.withdrawGoal(amt);
      if (onGoalWithdrawn) onGoalWithdrawn(res.transaction, res.new_current);
      setWithdrawAmount("");
      setWithdrawError("");
    } catch (e: unknown) {
      setWithdrawError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setWithdrawLoading(false);
    }
  };

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
          {recent.length === 0 ? (
            <p className="empty-state">Нет транзакций. Добавьте первую!</p>
          ) : (
            <div className="tx-list">
              {recent.map((t) => (
                <div key={t.id} className="tx-row">
                  <div className="tx-cat-dot" style={{
                    background: t.type === "transfer" ? "#9CA3AF" : (CATEGORY_COLORS[t.category] || "#888")
                  }} />
                  <div className="tx-info">
                    <span className="tx-cat">{t.type === "transfer" ? "Перевод" : t.category}</span>
                    <span className="tx-comment">{t.comment}</span>
                  </div>
                  <div className="tx-right">
                    <span className={`tx-amount ${t.type === "income" ? "tx-amount--plus" : t.type === "transfer" ? "tx-amount--neutral" : "tx-amount--minus"}`}>
                      {t.type === "income" ? "+" : "−"}{formatMoney(t.amount, settings.currency)}
                    </span>
                    <span className="tx-date">{formatDateTime(t.date)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h3 className="card-title">Финансовая цель</h3>
          {!goal ? (
            <p className="empty-state">Цель не задана. Настройте её в разделе «Настройки».</p>
          ) : (
            <div className="goal-block">
              <div className="goal-header">
                <Icon name="Target" size={24} color="#FBBF24" />
                <span className="goal-name">{goal.name}</span>
              </div>
              <div className="goal-progress-wrap">
                <div className="goal-progress-track">
                  <div className="goal-progress-fill" style={{ width: `${goalPct}%` }} />
                </div>
              </div>
              <div className="goal-stats">
                <span className="goal-pct">{goalPct}%</span>
                <span className="goal-amounts">
                  {formatMoney(goal.current, settings.currency)} из {formatMoney(goal.target, settings.currency)}
                </span>
              </div>
              {goal.current >= goal.target ? (
                <p className="goal-remain" style={{ color: "#10B981", fontWeight: 600 }}>
                  🎉 Поздравляем! Вы накопили нужную сумму!
                </p>
              ) : (
                <p className="goal-remain">Осталось: {formatMoney(goal.target - goal.current, settings.currency)}</p>
              )}

              <form onSubmit={handleFund} className="goal-fund-form">
                <div className="field-wrap">
                  <span className="field-icon currency-sym" style={{ color: "var(--c-text-soft)" }}>+</span>
                  <input className="field-input" type="number" min="0.01" step="0.01"
                    placeholder="Пополнить на сумму..."
                    value={fundAmount} onChange={e => { setFundAmount(e.target.value); setFundError(""); }} />
                </div>
                {fundError && <p className="field-error" style={{ marginTop: 4 }}>{fundError}</p>}
                <button className="btn-primary btn-fund" type="submit" disabled={fundLoading}>
                  {fundLoading ? <span className="spinner" /> : <Icon name="ArrowUpRight" size={14} />}
                  Пополнить
                </button>
              </form>

              {goal.current > 0 && (
                <form onSubmit={handleWithdraw} className="goal-fund-form" style={{ marginTop: 8 }}>
                  <div className="field-wrap">
                    <span className="field-icon currency-sym" style={{ color: "var(--c-text-soft)" }}>−</span>
                    <input className="field-input" type="number" min="0.01" step="0.01"
                      placeholder="Вывести на сумму..."
                      value={withdrawAmount} onChange={e => { setWithdrawAmount(e.target.value); setWithdrawError(""); }} />
                  </div>
                  {withdrawError && <p className="field-error" style={{ marginTop: 4 }}>{withdrawError}</p>}
                  <button className="btn-fund" type="submit" disabled={withdrawLoading}
                    style={{ background: "var(--c-red, #EF4444)", color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", display: "flex", alignItems: "center", gap: 6, fontWeight: 600, cursor: "pointer", opacity: withdrawLoading ? 0.7 : 1 }}>
                    {withdrawLoading ? <span className="spinner" /> : <Icon name="ArrowDownLeft" size={14} />}
                    Вывести
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}