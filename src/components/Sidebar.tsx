import Icon from "@/components/ui/icon";
import { Page } from "@/types";

export default function Sidebar({ page, setPage }: { page: Page; setPage: (p: Page) => void }) {
  const items = [
    { id: "dashboard", label: "Главная", icon: "LayoutDashboard" },
    { id: "transactions", label: "Транзакции", icon: "ArrowLeftRight" },
    { id: "reports", label: "Отчёты", icon: "BarChart2" },
    { id: "settings", label: "Настройки", icon: "Settings" },
  ] as const;

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon-sm">
          <Icon name="TrendingUp" size={20} color="#10B981" />
        </div>
        <span className="sidebar-brand">ФинКонтроль</span>
      </div>
      <nav className="sidebar-nav">
        {items.map((item) => (
          <button
            key={item.id}
            className={`nav-item ${page === item.id ? "nav-item--active" : ""}`}
            onClick={() => setPage(item.id)}
          >
            <Icon name={item.icon} size={20} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="user-avatar">Д</div>
          <div>
            <p className="user-name">Демо пользователь</p>
            <p className="user-role">Личный аккаунт</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
