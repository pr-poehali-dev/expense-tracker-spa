import { useState } from "react";
import Icon from "@/components/ui/icon";
import { api } from "@/api";

type AuthMode = "login" | "register" | "reset-request" | "reset-confirm";

interface Props {
  onLogin: (sessionId: string) => void;
}

export default function LoginPage({ onLogin }: Props) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [form, setForm] = useState({ login: "", email: "", password: "", confirm: "", token: "", newPassword: "" });
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (field: string, value: string) => {
    setForm(f => ({ ...f, [field]: value }));
    setError("");
    setInfo("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setInfo("");
    setLoading(true);
    try {
      if (mode === "login") {
        if (!form.login || !form.password) { setError("Заполните все поля"); return; }
        const res = await api.login(form.login, form.password);
        onLogin(res.session_id);

      } else if (mode === "register") {
        if (!form.login || !form.email || !form.password) { setError("Заполните все поля"); return; }
        if (form.password !== form.confirm) { setError("Пароли не совпадают"); return; }
        const res = await api.register(form.login, form.email, form.password);
        onLogin(res.session_id);

      } else if (mode === "reset-request") {
        if (!form.email) { setError("Введите email"); return; }
        const res = await api.resetRequest(form.email);
        setInfo(`Токен для сброса: ${res.token}`);
        setTimeout(() => setMode("reset-confirm"), 2500);

      } else if (mode === "reset-confirm") {
        if (!form.token || !form.newPassword) { setError("Заполните все поля"); return; }
        await api.resetConfirm(form.token, form.newPassword);
        setInfo("Пароль изменён! Войдите с новым паролем.");
        setTimeout(() => setMode("login"), 1500);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setLoading(false);
    }
  };

  const titles: Record<AuthMode, string> = {
    login: "Войти",
    register: "Зарегистрироваться",
    "reset-request": "Отправить токен",
    "reset-confirm": "Сменить пароль",
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

        {(mode === "login" || mode === "register") && (
          <div className="login-tabs">
            <button className={`login-tab ${mode === "login" ? "login-tab--active" : ""}`}
              onClick={() => { setMode("login"); setError(""); setInfo(""); }}>
              Вход
            </button>
            <button className={`login-tab ${mode === "register" ? "login-tab--active" : ""}`}
              onClick={() => { setMode("register"); setError(""); setInfo(""); }}>
              Регистрация
            </button>
          </div>
        )}

        {(mode === "reset-request" || mode === "reset-confirm") && (
          <div className="reset-header">
            <Icon name="KeyRound" size={20} color="#FBBF24" />
            <span>{mode === "reset-request" ? "Восстановление пароля" : "Новый пароль"}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">

          {mode === "login" && <>
            <div className="field-group">
              <label className="field-label">Логин</label>
              <div className="field-wrap">
                <Icon name="User" size={16} className="field-icon" />
                <input className="field-input" type="text" placeholder="Ваш логин"
                  value={form.login} onChange={e => set("login", e.target.value)} />
              </div>
            </div>
            <div className="field-group">
              <label className="field-label">Пароль</label>
              <div className="field-wrap">
                <Icon name="Lock" size={16} className="field-icon" />
                <input className="field-input" type="password" placeholder="••••••••"
                  value={form.password} onChange={e => set("password", e.target.value)} />
              </div>
            </div>
            <button type="button" className="forgot-link" onClick={() => { setMode("reset-request"); setError(""); setInfo(""); }}>
              Забыли пароль?
            </button>
          </>}

          {mode === "register" && <>
            <div className="field-group">
              <label className="field-label">Логин</label>
              <div className="field-wrap">
                <Icon name="User" size={16} className="field-icon" />
                <input className="field-input" type="text" placeholder="Придумайте логин"
                  value={form.login} onChange={e => set("login", e.target.value)} />
              </div>
            </div>
            <div className="field-group">
              <label className="field-label">Email <span className="required-mark">*</span></label>
              <div className="field-wrap">
                <Icon name="Mail" size={16} className="field-icon" />
                <input className="field-input" type="email" placeholder="your@email.com"
                  value={form.email} onChange={e => set("email", e.target.value)} />
              </div>
            </div>
            <div className="field-group">
              <label className="field-label">Пароль</label>
              <div className="field-wrap">
                <Icon name="Lock" size={16} className="field-icon" />
                <input className="field-input" type="password" placeholder="Минимум 6 символов"
                  value={form.password} onChange={e => set("password", e.target.value)} />
              </div>
            </div>
            <div className="field-group">
              <label className="field-label">Повторите пароль</label>
              <div className="field-wrap">
                <Icon name="Lock" size={16} className="field-icon" />
                <input className="field-input" type="password" placeholder="••••••••"
                  value={form.confirm} onChange={e => set("confirm", e.target.value)} />
              </div>
            </div>
          </>}

          {mode === "reset-request" && <>
            <p className="reset-hint">Введите email, указанный при регистрации — получите токен для сброса пароля.</p>
            <div className="field-group">
              <label className="field-label">Email</label>
              <div className="field-wrap">
                <Icon name="Mail" size={16} className="field-icon" />
                <input className="field-input" type="email" placeholder="your@email.com"
                  value={form.email} onChange={e => set("email", e.target.value)} />
              </div>
            </div>
            <button type="button" className="forgot-link" onClick={() => { setMode("login"); setError(""); setInfo(""); }}>
              ← Назад к входу
            </button>
          </>}

          {mode === "reset-confirm" && <>
            <p className="reset-hint">Введите токен, который вы получили, и придумайте новый пароль.</p>
            <div className="field-group">
              <label className="field-label">Токен сброса</label>
              <div className="field-wrap">
                <Icon name="Key" size={16} className="field-icon" />
                <input className="field-input" type="text" placeholder="Вставьте токен"
                  value={form.token} onChange={e => set("token", e.target.value)} />
              </div>
            </div>
            <div className="field-group">
              <label className="field-label">Новый пароль</label>
              <div className="field-wrap">
                <Icon name="Lock" size={16} className="field-icon" />
                <input className="field-input" type="password" placeholder="Минимум 6 символов"
                  value={form.newPassword} onChange={e => set("newPassword", e.target.value)} />
              </div>
            </div>
          </>}

          {error && <p className="field-error">{error}</p>}
          {info && <p className="field-info">{info}</p>}

          <button className="btn-primary btn-full" type="submit" disabled={loading}>
            {loading ? <span className="spinner" /> : null}
            {loading ? "Загрузка..." : titles[mode]}
          </button>
        </form>
      </div>
    </div>
  );
}
