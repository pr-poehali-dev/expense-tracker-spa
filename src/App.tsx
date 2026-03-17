import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { Page, Transaction, Settings, DEMO_TRANSACTIONS, DEFAULT_SETTINGS } from "@/types";
import LoginPage from "@/components/LoginPage";
import Sidebar from "@/components/Sidebar";
import Dashboard from "@/components/pages/Dashboard";
import TransactionsPage from "@/components/pages/TransactionsPage";
import ReportsPage from "@/components/pages/ReportsPage";
import SettingsPage from "@/components/pages/SettingsPage";

export default function App() {
  const [page, setPage] = useState<Page>("login");
  const [transactions, setTransactions] = useLocalStorage<Transaction[]>("fincontrol_tx", DEMO_TRANSACTIONS);
  const [settings, setSettings] = useLocalStorage<Settings>("fincontrol_settings", DEFAULT_SETTINGS);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", settings.theme);
  }, [settings.theme]);

  if (page === "login") {
    return <LoginPage onLogin={() => setPage("dashboard")} />;
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
        {page === "dashboard" && <Dashboard transactions={transactions} settings={settings} />}
        {page === "transactions" && <TransactionsPage transactions={transactions} setTransactions={setTransactions} settings={settings} />}
        {page === "reports" && <ReportsPage transactions={transactions} settings={settings} />}
        {page === "settings" && <SettingsPage settings={settings} setSettings={setSettings} />}
      </main>
    </div>
  );
}
