import { useState, useEffect, useRef } from "react";
import Icon from "@/components/ui/icon";
import { Transaction, Settings, CATEGORIES, formatMoney } from "@/types";

export default function ReportsPage({ transactions, settings }: { transactions: Transaction[]; settings: Settings }) {
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
