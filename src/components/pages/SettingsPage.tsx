import { useState } from "react";
import Icon from "@/components/ui/icon";
import { Settings, CURRENCIES } from "@/types";

export default function SettingsPage({
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
