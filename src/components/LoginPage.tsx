import { useState } from "react";
import Icon from "@/components/ui/icon";

export default function LoginPage({ onLogin }: { onLogin: () => void }) {
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
