import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { HomePage, FinancePage } from "@/components/pages/HomeFinancePage";
import { ChatPage, CasePage } from "@/components/pages/ChatCasePage";
import { ReferralPage, ProfilePage } from "@/components/pages/ReferralProfilePage";
import { AuthPage, type User } from "@/components/pages/AuthPage";
import { BRAND } from "@/brand.config";

type Page = "home" | "finance" | "chat" | "case" | "referral" | "profile";
type Theme = "dark" | "light";

const BITRIX_URL = "https://functions.poehali.dev/d8cffbef-28c9-4cbc-9574-d1dabb3929f2";

const NAV_ITEMS = [
  { id: "home" as Page, icon: "LayoutDashboard", label: "Главная" },
  { id: "finance" as Page, icon: "CreditCard", label: "Финансы" },
  { id: "chat" as Page, icon: "MessageSquare", label: "Чаты" },
  { id: "case" as Page, icon: "Scale", label: "Дело" },
  { id: "referral" as Page, icon: "Users", label: "Рефералы" },
  { id: "profile" as Page, icon: "UserCircle", label: "Профиль" },
];

const DEFAULT_STAGES = [
  { title: "Подача заявления в суд", done: true, date: "01.11.2024", desc: "Заявление принято к производству", icon: "FileText" },
  { title: "Признание банкротом", done: true, date: "15.12.2024", desc: "Вынесено решение суда", icon: "Gavel" },
  { title: "Реализация имущества", done: false, active: true, date: "В процессе", desc: "Финансовый управляющий формирует массу", icon: "Package" },
  { title: "Расчёт с кредиторами", done: false, date: "~май 2025", desc: "Распределение средств", icon: "DollarSign" },
  { title: "Завершение. Долги списаны", done: false, date: "~июнь 2025", desc: "Списание оставшихся долгов", icon: "Trophy" },
];

function getInitials(name: string) {
  return name.trim().split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

export default function App() {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem("current_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [page, setPage] = useState<Page>("home");
  const [theme, setTheme] = useState<Theme>("dark");
  const [caseStages, setCaseStages] = useState(DEFAULT_STAGES);
  const [loadingStages, setLoadingStages] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "light") {
      root.classList.add("light");
      root.classList.remove("dark");
    } else {
      root.classList.remove("light");
      root.classList.add("dark");
    }
  }, [theme]);

  useEffect(() => {
    if (!user) return;
    setLoadingStages(true);
    fetch(`${BITRIX_URL}/?deal_id=12345`)
      .then(r => r.json())
      .then(data => {
        if (data.success && data.stages) {
          const mapped = data.stages.map((s: { title: string; done: boolean; active: boolean }) => ({
            title: s.title,
            done: s.done,
            active: s.active,
            date: s.done ? "Завершено" : s.active ? "В процессе" : "Ожидается",
            desc: "",
            icon: s.done ? "Check" : s.active ? "Scale" : "Circle",
          }));
          setCaseStages(mapped);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingStages(false));
  }, [user]);

  const toggleTheme = useCallback(() => setTheme(t => t === "dark" ? "light" : "dark"), []);

  function handleLogin(loggedUser: User) {
    localStorage.setItem("current_user", JSON.stringify(loggedUser));
    setUser(loggedUser);
  }

  function handleLogout() {
    localStorage.removeItem("current_user");
    setUser(null);
    setPage("home");
  }

  if (!user) {
    return <AuthPage onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-background font-golos max-w-md mx-auto relative">
      <header className="sticky top-0 z-50 glass-card border-b border-border/50 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg gradient-blue-purple flex items-center justify-center">
            {BRAND.logoUrl ? (
              <img src={BRAND.logoUrl} alt="logo" className="w-5 h-5 object-contain" />
            ) : (
              <Icon name={BRAND.logoIcon} size={14} className="text-white" />
            )}
          </div>
          <span className="font-bold font-oswald text-foreground tracking-wide text-sm">{BRAND.appName}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="w-8 h-8 rounded-lg glass-card flex items-center justify-center hover:border-primary/40 transition-colors"
          >
            <Icon name={theme === "dark" ? "Sun" : "Moon"} size={16} className="text-muted-foreground" />
          </button>
          <button className="relative w-8 h-8 flex items-center justify-center">
            <Icon name="Bell" size={18} className="text-muted-foreground" />
            <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-primary" />
          </button>
          <button
            onClick={() => setPage("profile")}
            className="w-8 h-8 rounded-full gradient-blue-purple flex items-center justify-center text-white text-xs font-bold"
          >
            {getInitials(user.name)}
          </button>
        </div>
      </header>

      <main className="pb-24 min-h-[calc(100vh-120px)] overflow-y-auto">
        {page === "home" && <HomePage onNavigate={setPage} caseStages={caseStages} loadingStages={loadingStages} user={user} />}
        {page === "finance" && <FinancePage />}
        {page === "chat" && <ChatPage />}
        {page === "case" && <CasePage stages={caseStages} loading={loadingStages} />}
        {page === "referral" && <ReferralPage />}
        {page === "profile" && <ProfilePage theme={theme} onToggleTheme={toggleTheme} user={user} onLogout={handleLogout} />}
      </main>

      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-50 glass-card border-t border-border/50 px-2 py-2">
        <div className="flex items-center justify-around">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => setPage(item.id)}
              className={`flex flex-col items-center gap-1 px-2 py-2 rounded-xl transition-all ${
                page === item.id ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <div className={`relative p-1.5 rounded-lg transition-all ${page === item.id ? "bg-primary/15" : ""}`}>
                <Icon name={item.icon} size={20} />
                {item.id === "chat" && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-green-400" />
                )}
              </div>
              <span className={`text-[10px] font-medium leading-none ${page === item.id ? "text-primary" : ""}`}>
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}