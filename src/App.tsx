import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { Page, Transaction, Goal, Settings, DEFAULT_SETTINGS } from "@/types";
import { api } from "@/api";
import LoginPage from "@/components/LoginPage";
import Sidebar from "@/components/Sidebar";
import Dashboard from "@/components/pages/Dashboard";
import TransactionsPage from "@/components/pages/TransactionsPage";
import ReportsPage from "@/components/pages/ReportsPage";
import SettingsPage from "@/components/pages/SettingsPage";

export default function App() {
  const [page, setPage] = useState<Page>("login");
  const [sessionId, setSessionId] = useState<string>(() => localStorage.getItem("session_id") || "");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [goal, setGoal] = useState<Goal | null>(null);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [menuOpen, setMenuOpen] = useState(false);
  const [appLoading, setAppLoading] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", settings.theme);
  }, [settings.theme]);

  // При наличии сессии — загружаем данные
  useEffect(() => {
    if (!sessionId) return;
    setAppLoading(true);
    Promise.all([
      api.me(),
      api.getTransactions(),
      api.getGoal(),
      api.getSettings(),
    ]).then(([meRes, txRes, goalRes, settingsRes]) => {
      if (meRes?.user) {
        setTransactions(txRes.transactions || []);
        setGoal(goalRes.goal || null);
        setSettings(settingsRes.settings || DEFAULT_SETTINGS);
        setPage("dashboard");
      }
    }).catch(() => {
      localStorage.removeItem("session_id");
      setSessionId("");
    }).finally(() => setAppLoading(false));
   
  }, [sessionId]);

  const handleLogin = (sid: string) => {
    localStorage.setItem("session_id", sid);
    setSessionId(sid);
  };

  const handleLogout = () => {
    setSessionId("");
    setTransactions([]);
    setGoal(null);
    setSettings(DEFAULT_SETTINGS);
    setPage("login");
  };

  if (appLoading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "var(--c-navy-deeper)" }}>
        <span className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
      </div>
    );
  }

  if (page === "login" || !sessionId) {
    return <LoginPage onLogin={handleLogin} />;
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
        {page === "dashboard" && (
          <Dashboard
            transactions={transactions}
            goal={goal}
            settings={settings}
            onGoalFunded={(tx, newCurrent) => {
              setTransactions(prev => [tx, ...prev]);
              setGoal(g => g ? { ...g, current: newCurrent } : g);
            }}
          />
        )}
        {page === "transactions" && (
          <TransactionsPage
            transactions={transactions}
            settings={settings}
            onAdd={tx => setTransactions(prev => [tx, ...prev])}
            onUpdate={tx => setTransactions(prev => prev.map(t => t.id === tx.id ? { ...t, ...tx } : t))}
            onRemove={id => setTransactions(prev => prev.filter(t => t.id !== id))}
          />
        )}
        {page === "reports" && <ReportsPage transactions={transactions} settings={settings} />}
        {page === "settings" && (
          <SettingsPage
            settings={settings}
            goal={goal}
            onSettingsChange={s => { setSettings(s); document.documentElement.setAttribute("data-theme", s.theme); }}
            onGoalChange={setGoal}
            onLogout={handleLogout}
          />
        )}
      </main>
    </div>
  );
}
