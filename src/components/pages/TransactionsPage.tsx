import { useState } from "react";
import Icon from "@/components/ui/icon";
import { Transaction, Settings, TxType, EXPENSE_CATEGORIES, INCOME_CATEGORIES, CATEGORY_COLORS, CURRENCIES, formatMoney, formatDateTime } from "@/types";
import { api } from "@/api";

interface Props {
  transactions: Transaction[];
  settings: Settings;
  onAdd: (tx: Transaction) => void;
  onUpdate: (tx: Transaction) => void;
  onRemove: (id: string) => void;
}

export default function TransactionsPage({ transactions, settings, onAdd, onUpdate, onRemove }: Props) {
  const empty = { amount: "", category: EXPENSE_CATEGORIES[0].name, comment: "", type: "expense" as TxType };
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const categories = form.type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const handleTypeChange = (type: TxType) => {
    const defaultCat = type === "income" ? INCOME_CATEGORIES[0].name : EXPENSE_CATEGORIES[0].name;
    setForm(f => ({ ...f, type, category: defaultCat }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(form.amount);
    if (!form.amount || isNaN(amt) || amt <= 0) { setError("Введите корректную сумму"); return; }
    setLoading(true);
    try {
      if (editId) {
        await api.updateTransaction(Number(editId), { amount: amt, category: form.category, comment: form.comment, type: form.type });
        onUpdate({ id: editId, amount: amt, category: form.category, comment: form.comment, type: form.type, date: new Date().toISOString() });
        setEditId(null);
      } else {
        const res = await api.addTransaction({ amount: amt, category: form.category, comment: form.comment, type: form.type });
        onAdd({ id: String(res.id), amount: amt, category: form.category, comment: form.comment, type: form.type, date: res.date });
      }
      setForm(empty);
      setError("");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (t: Transaction) => {
    setEditId(t.id);
    setForm({ amount: t.amount.toString(), category: t.category, comment: t.comment, type: t.type as TxType });
  };

  const remove = async (id: string) => {
    await api.removeTransaction(Number(id));
    onRemove(id);
  };

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
                  onClick={() => handleTypeChange("expense")}>
                  <Icon name="TrendingDown" size={14} /> Расход
                </button>
                <button type="button" className={`type-btn ${form.type === "income" ? "type-btn--active-green" : ""}`}
                  onClick={() => handleTypeChange("income")}>
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
                    {categories.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
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
              <button className="btn-primary" type="submit" disabled={loading}>
                {loading ? <span className="spinner" /> : <Icon name={editId ? "Save" : "Plus"} size={16} />}
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
                <div className="tx-cat-dot" style={{
                  background: t.type === "transfer" ? "#9CA3AF" : (CATEGORY_COLORS[t.category] || "#888")
                }} />
                <div className="tx-info">
                  <span className="tx-cat">{t.type === "transfer" ? "Перевод" : t.category}</span>
                  <span className="tx-comment">{t.comment || "—"}</span>
                </div>
                <div className="tx-right">
                  <span className={`tx-amount ${t.type === "income" ? "tx-amount--plus" : t.type === "transfer" ? "tx-amount--neutral" : "tx-amount--minus"}`}>
                    {t.type === "income" ? "+" : "−"}{formatMoney(t.amount, settings.currency)}
                  </span>
                  <span className="tx-date">{formatDateTime(t.date)}</span>
                </div>
                {t.type !== "transfer" && (
                  <div className="tx-actions">
                    <button className="icon-btn icon-btn--edit" onClick={() => startEdit(t)} title="Редактировать">
                      <Icon name="Pencil" size={14} />
                    </button>
                    <button className="icon-btn icon-btn--delete" onClick={() => remove(t.id)} title="Удалить">
                      <Icon name="Trash2" size={14} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
