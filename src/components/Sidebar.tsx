import Icon from "@/components/ui/icon";
import { Page, User } from "@/types";

interface Props {
  page: Page;
  setPage: (p: Page) => void;
  user: User | null;
}

export default function Sidebar({ page, setPage, user }: Props) {
  const items = [
    { id: "dashboard", label: "Главная", icon: "LayoutDashboard" },
    { id: "transactions", label: "Транзакции", icon: "ArrowLeftRight" },
    { id: "reports", label: "Отчёты", icon: "BarChart2" },
    { id: "settings", label: "Настройки", icon: "Settings" },
  ] as const;

  const avatarLetter = user?.login ? user.login[0].toUpperCase() : "?";

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
          <div className="user-avatar">{avatarLetter}</div>
          <div>
            <p className="user-name">{user?.login || "—"}</p>
            <p className="user-role">{user?.email || "Личный аккаунт"}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
