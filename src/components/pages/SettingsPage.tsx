import { useState } from "react";
import Icon from "@/components/ui/icon";
import { Settings, Goal, CURRENCIES } from "@/types";
import { api } from "@/api";

interface Props {
  settings: Settings;
  goal: Goal | null;
  onSettingsChange: (s: Settings) => void;
  onGoalChange: (g: Goal) => void;
  onLogout: () => void;
}

export default function SettingsPage({ settings, goal, onSettingsChange, onGoalChange, onLogout }: Props) {
  const [goalName, setGoalName] = useState(goal?.name || "");
  const [goalTarget, setGoalTarget] = useState(goal?.target?.toString() || "");
  const [goalCurrent, setGoalCurrent] = useState(goal?.current?.toString() || "");
  const [saved, setSaved] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);

  const saveGoal = async () => {
    const target = parseFloat(goalTarget) || 0;
    const current = parseFloat(goalCurrent) || 0;
    await api.saveGoal({ name: goalName, target, current });
    onGoalChange({ name: goalName, target, current });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSettingsChange = async (newSettings: Settings) => {
    onSettingsChange(newSettings);
    await api.saveSettings(newSettings);
  };

  const handleLogout = async () => {
    setLogoutLoading(true);
    try {
      await api.logout();
    } finally {
      localStorage.removeItem("session_id");
      setLogoutLoading(false);
      onLogout();
    }
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
                    onClick={() => handleSettingsChange({ ...settings, currency: code })}>
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
                  onClick={() => handleSettingsChange({ ...settings, theme: "dark" })}>
                  <Icon name="Moon" size={16} /> Тёмная
                </button>
                <button className={`theme-btn ${settings.theme === "light" ? "theme-btn--active" : ""}`}
                  onClick={() => handleSettingsChange({ ...settings, theme: "light" })}>
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
                <input className="field-input" type="text" placeholder="Например: Накопить на отпуск"
                  value={goalName} onChange={e => setGoalName(e.target.value)} />
              </div>
            </div>
            <div className="form-row form-row--2">
              <div className="field-group">
                <label className="field-label">Цель ({CURRENCIES[settings.currency]})</label>
                <div className="field-wrap">
                  <span className="field-icon currency-sym">{CURRENCIES[settings.currency]}</span>
                  <input className="field-input" type="number" placeholder="0"
                    value={goalTarget} onChange={e => setGoalTarget(e.target.value)} />
                </div>
              </div>
              <div className="field-group">
                <label className="field-label">Уже накоплено</label>
                <div className="field-wrap">
                  <span className="field-icon currency-sym">{CURRENCIES[settings.currency]}</span>
                  <input className="field-input" type="number" placeholder="0"
                    value={goalCurrent} onChange={e => setGoalCurrent(e.target.value)} />
                </div>
              </div>
            </div>
            <button className="btn-primary" onClick={saveGoal}>
              {saved
                ? <><Icon name="Check" size={16} /> Сохранено!</>
                : <><Icon name="Save" size={16} /> Сохранить цель</>}
            </button>
          </div>
        </div>

        <div className="card">
          <h3 className="card-title">Аккаунт</h3>
          <div className="settings-section">
            <p className="setting-desc" style={{ marginBottom: 8 }}>
              Все данные сохранены в вашем аккаунте. При выходе вам нужно будет войти заново.
            </p>
            <button className="btn-logout" onClick={handleLogout} disabled={logoutLoading}>
              {logoutLoading ? <span className="spinner" /> : <Icon name="LogOut" size={16} />}
              Выйти из аккаунта
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
