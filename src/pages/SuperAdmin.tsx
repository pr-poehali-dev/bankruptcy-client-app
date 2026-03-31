import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { API, apiGet, apiPost, apiPut, saveSession, clearSession, getStoredRole, getStoredProfile } from "@/api";

type Tab = "dashboard" | "companies" | "clients";

interface PlatformStats {
  total_companies: number;
  total_clients: number;
  active_subscriptions: number;
  new_companies_month: number;
  by_plan: Record<string, number>;
}
interface Company {
  id: number;
  name: string;
  phone: string;
  is_active: boolean;
  created_at: string;
  client_count: number;
  subscription: {
    plan: string;
    status: string;
    clients_limit: number;
    expires_at: string;
  } | null;
}

const PLAN_LABELS: Record<string, string> = {
  trial: "Пробный",
  basic: "Базовый",
  pro: "Про",
};
const PLAN_COLORS: Record<string, string> = {
  trial: "text-muted-foreground bg-muted/30",
  basic: "text-primary bg-primary/10",
  pro:   "text-amber-400 bg-amber-500/10",
};

// ── Экран входа ───────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!phone || !password) { setError("Заполните все поля"); return; }
    setLoading(true);
    setError("");
    const res = await apiPost(API.auth, "login", { phone, password, role: "superadmin" });
    setLoading(false);
    if (res.success) {
      saveSession(res.token, "superadmin", res.profile);
      onLogin();
    } else {
      setError(res.error || "Неверный телефон или пароль");
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-6 animate-fade-in-up">
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl gradient-blue-purple flex items-center justify-center mx-auto mb-4 glow-blue">
            <Icon name="ShieldCheck" size={26} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold font-oswald text-foreground">Супер-Администратор</h1>
          <p className="text-muted-foreground text-sm mt-1">Управление всей платформой</p>
        </div>
        <div className="glass-card rounded-2xl p-6 space-y-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Телефон</label>
            <input
              type="tel" value={phone} onChange={e => setPhone(e.target.value)}
              placeholder="+79000000000"
              className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary/60"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Пароль</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleLogin()}
              placeholder="••••••••"
              className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary/60"
            />
          </div>
          {error && <p className="text-destructive text-xs">{error}</p>}
          <button
            onClick={handleLogin} disabled={loading}
            className="w-full gradient-blue-purple text-white font-semibold py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            {loading ? "Входим..." : "Войти"}
          </button>
          <p className="text-center text-xs text-muted-foreground">Демо: +79000000000 / admin123</p>
        </div>
      </div>
    </div>
  );
}

// ── Модалка: создать компанию ─────────────────────────────────────────────────
function CreateCompanyModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ name: "", phone: "", password: "", plan: "trial" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCreate() {
    if (!form.name || !form.phone || !form.password) { setError("Заполните все поля"); return; }
    setLoading(true);
    const res = await apiPost(API.superAdmin, "companies", form);
    setLoading(false);
    if (res.success) { onCreated(); onClose(); }
    else setError(res.error || "Ошибка");
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4">
      <div className="glass-card rounded-2xl p-6 w-full max-w-sm space-y-4 animate-fade-in-up">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-foreground">Новая компания</h3>
          <button onClick={onClose}><Icon name="X" size={18} className="text-muted-foreground" /></button>
        </div>
        {[
          { key: "name", label: "Название", placeholder: "ООО Юр.Помощь" },
          { key: "phone", label: "Телефон", placeholder: "+79111111111" },
          { key: "password", label: "Пароль", placeholder: "••••••••", type: "password" },
        ].map(f => (
          <div key={f.key}>
            <label className="text-xs text-muted-foreground mb-1 block">{f.label}</label>
            <input
              type={f.type || "text"}
              value={(form as Record<string, string>)[f.key]}
              onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
              placeholder={f.placeholder}
              className="w-full bg-muted border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/60"
            />
          </div>
        ))}
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Тариф</label>
          <select
            value={form.plan}
            onChange={e => setForm(p => ({ ...p, plan: e.target.value }))}
            className="w-full bg-muted border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none"
          >
            <option value="trial">Пробный (14 дней, 5 клиентов)</option>
            <option value="basic">Базовый (50 клиентов)</option>
            <option value="pro">Про (500 клиентов)</option>
          </select>
        </div>
        {error && <p className="text-destructive text-xs">{error}</p>}
        <button
          onClick={handleCreate} disabled={loading}
          className="w-full gradient-blue-purple text-white font-semibold py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-60"
        >
          {loading ? "Создаём..." : "Создать компанию"}
        </button>
      </div>
    </div>
  );
}

// ── Главная страница ───────────────────────────────────────────────────────────
export default function SuperAdmin() {
  const [isAuth, setIsAuth] = useState(false);
  const [tab, setTab] = useState<Tab>("dashboard");
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loadingCo, setLoadingCo] = useState(false);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  useEffect(() => {
    if (getStoredRole() === "superadmin") setIsAuth(true);
  }, []);

  useEffect(() => {
    if (!isAuth) return;
    loadStats();
  }, [isAuth]);

  useEffect(() => {
    if (tab === "companies") loadCompanies();
  }, [tab]);

  async function loadStats() {
    const res = await apiGet(API.superAdmin, { action: "stats" });
    if (res.success) setStats(res.stats);
  }

  async function loadCompanies() {
    setLoadingCo(true);
    const res = await apiGet(API.superAdmin, { action: "companies", search });
    if (res.success) setCompanies(res.companies);
    setLoadingCo(false);
  }

  async function toggleCompany(id: number, is_active: boolean) {
    await apiPut(API.superAdmin, "companies", { id, is_active: !is_active });
    loadCompanies();
  }

  async function changePlan(id: number, plan: string) {
    await apiPut(API.superAdmin, "companies", { id, plan });
    loadCompanies();
    setEditingId(null);
  }

  function handleLogout() {
    clearSession();
    setIsAuth(false);
  }

  if (!isAuth) return <LoginScreen onLogin={() => setIsAuth(true)} />;

  return (
    <div className="min-h-screen bg-background font-golos">
      {showCreate && (
        <CreateCompanyModal onClose={() => setShowCreate(false)} onCreated={() => { loadCompanies(); loadStats(); }} />
      )}

      {/* Header */}
      <header className="sticky top-0 z-50 glass-card border-b border-border/50 px-4 py-3 flex items-center justify-between max-w-5xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg gradient-blue-purple flex items-center justify-center">
            <Icon name="ShieldCheck" size={16} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-foreground text-sm">Супер-Админ</p>
            <p className="text-xs text-muted-foreground">Платформа управления</p>
          </div>
        </div>
        <button onClick={handleLogout} className="text-muted-foreground hover:text-destructive transition-colors">
          <Icon name="LogOut" size={18} />
        </button>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Навигация */}
        <div className="flex gap-2 mb-6">
          {([
            { id: "dashboard", label: "Обзор", icon: "BarChart3" },
            { id: "companies", label: "Компании", icon: "Building2" },
            { id: "clients",   label: "Клиенты",  icon: "Users" },
          ] as { id: Tab; label: string; icon: string }[]).map(t => (
            <button
              key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium flex-shrink-0 transition-all ${
                tab === t.id ? "gradient-blue-purple text-white" : "glass-card text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon name={t.icon} size={15} />
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Обзор ── */}
        {tab === "dashboard" && (
          <div className="space-y-6">
            {stats ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: "Компаний",      value: stats.total_companies,       icon: "Building2",   color: "text-primary" },
                    { label: "Клиентов",      value: stats.total_clients,         icon: "Users",       color: "text-green-400" },
                    { label: "Активных подписок", value: stats.active_subscriptions, icon: "CreditCard", color: "text-amber-400" },
                    { label: "Новых за месяц", value: stats.new_companies_month,   icon: "TrendingUp",  color: "text-purple-400" },
                  ].map((s, i) => (
                    <div key={i} className="glass-card rounded-2xl p-4">
                      <Icon name={s.icon} size={20} className={`${s.color} mb-2`} />
                      <p className={`text-3xl font-black font-oswald ${s.color}`}>{s.value}</p>
                      <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
                    </div>
                  ))}
                </div>

                {Object.keys(stats.by_plan).length > 0 && (
                  <div className="glass-card rounded-2xl p-5">
                    <h2 className="font-bold text-foreground mb-4 flex items-center gap-2">
                      <Icon name="PieChart" size={16} className="text-primary" />
                      Распределение по тарифам
                    </h2>
                    <div className="grid grid-cols-3 gap-3">
                      {Object.entries(stats.by_plan).map(([plan, count]) => (
                        <div key={plan} className={`rounded-xl p-3 text-center ${PLAN_COLORS[plan] || "bg-muted/30 text-foreground"}`}>
                          <p className="text-2xl font-black font-oswald">{count}</p>
                          <p className="text-xs mt-0.5">{PLAN_LABELS[plan] || plan}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[1,2,3,4].map(i => <div key={i} className="h-28 rounded-2xl bg-muted/30 animate-pulse" />)}
              </div>
            )}
          </div>
        )}

        {/* ── Компании ── */}
        {tab === "companies" && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1 glass-card rounded-xl flex items-center gap-2 px-3">
                <Icon name="Search" size={16} className="text-muted-foreground flex-shrink-0" />
                <input
                  value={search} onChange={e => setSearch(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && loadCompanies()}
                  placeholder="Поиск по названию или телефону"
                  className="flex-1 bg-transparent py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none"
                />
              </div>
              <button onClick={loadCompanies} className="glass-card px-3 rounded-xl text-muted-foreground hover:text-foreground">
                <Icon name="RefreshCw" size={16} />
              </button>
              <button
                onClick={() => setShowCreate(true)}
                className="gradient-blue-purple text-white px-4 rounded-xl text-sm font-medium flex items-center gap-2"
              >
                <Icon name="Plus" size={15} />
                Добавить
              </button>
            </div>

            {loadingCo ? (
              <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-20 rounded-xl bg-muted/30 animate-pulse" />)}</div>
            ) : (
              <div className="space-y-2">
                {companies.length === 0 && (
                  <div className="text-center py-10 text-muted-foreground text-sm">Компаний нет</div>
                )}
                {companies.map(c => (
                  <div key={c.id} className="glass-card rounded-xl p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-bold text-foreground">{c.name}</p>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${c.is_active ? "bg-green-500/10 text-green-400" : "bg-destructive/10 text-destructive"}`}>
                            {c.is_active ? "Активна" : "Заблокирована"}
                          </span>
                          {c.subscription && (
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${PLAN_COLORS[c.subscription.plan] || ""}`}>
                              {PLAN_LABELS[c.subscription.plan] || c.subscription.plan}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {c.phone} · {c.client_count} клиентов
                          {c.subscription && ` · до ${new Date(c.subscription.expires_at).toLocaleDateString("ru-RU")}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {editingId === c.id ? (
                          <select
                            autoFocus
                            onChange={e => changePlan(c.id, e.target.value)}
                            onBlur={() => setEditingId(null)}
                            className="bg-muted border border-border rounded-lg px-2 py-1 text-xs text-foreground focus:outline-none"
                          >
                            <option value="">Тариф...</option>
                            <option value="trial">Пробный</option>
                            <option value="basic">Базовый</option>
                            <option value="pro">Про</option>
                          </select>
                        ) : (
                          <button
                            onClick={() => setEditingId(c.id)}
                            className="text-xs text-primary bg-primary/10 px-2.5 py-1 rounded-lg hover:bg-primary/20 transition-colors"
                          >
                            Тариф
                          </button>
                        )}
                        <button
                          onClick={() => toggleCompany(c.id, c.is_active)}
                          className={`text-xs px-2.5 py-1 rounded-lg transition-colors ${
                            c.is_active
                              ? "text-destructive bg-destructive/10 hover:bg-destructive/20"
                              : "text-green-400 bg-green-500/10 hover:bg-green-500/20"
                          }`}
                        >
                          {c.is_active ? "Блок." : "Активир."}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Клиенты (глобально) ── */}
        {tab === "clients" && <ClientsTab />}
      </div>
    </div>
  );
}

function ClientsTab() {
  const [clients, setClients] = useState<{ id: number; name: string; phone: string; deal_id: string; is_active: boolean; created_at: string; company_name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet(API.superAdmin, { action: "clients", limit: "100" }).then(res => {
      if (res.success) setClients(res.clients);
      setLoading(false);
    });
  }, []);

  if (loading) return (
    <div className="space-y-2">{[1,2,3,4,5].map(i => <div key={i} className="h-16 rounded-xl bg-muted/30 animate-pulse" />)}</div>
  );

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground mb-3">Всего клиентов: {clients.length}</p>
      {clients.map(c => (
        <div key={c.id} className="glass-card rounded-xl p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full gradient-blue-purple flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {c.name[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">{c.name}</p>
            <p className="text-xs text-muted-foreground">{c.phone} · {c.company_name}</p>
          </div>
          <div className="text-right text-xs flex-shrink-0">
            <p className={c.is_active ? "text-green-400" : "text-muted-foreground"}>
              {c.is_active ? "Активен" : "Неактивен"}
            </p>
            <p className="text-muted-foreground">{new Date(c.created_at).toLocaleDateString("ru-RU")}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
