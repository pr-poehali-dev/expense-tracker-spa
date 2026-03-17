import { useState } from "react";
import Icon from "@/components/ui/icon";
import { Transaction, Settings, TxType, CATEGORIES, CATEGORY_COLORS, CURRENCIES, formatMoney, formatDate } from "@/types";

export default function TransactionsPage({
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
