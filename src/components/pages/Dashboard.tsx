import Icon from "@/components/ui/icon";
import { Transaction, Settings, CATEGORY_COLORS, formatMoney, formatDate } from "@/types";

export default function Dashboard({ transactions, settings }: { transactions: Transaction[]; settings: Settings }) {
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
