import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { API, apiGet, apiPost, apiPut, saveSession, clearSession, getStoredProfile, getStoredRole } from "@/api";

type Tab = "dashboard" | "clients" | "brand" | "settings";

interface Stats {
  total_clients: number;
  active_clients: number;
  new_this_month: number;
  inactive_clients: number;
}
interface Subscription {
  plan: string;
  status: string;
  clients_limit: number;
  expires_at: string;
  used: number;
  available: number;
}
interface Client {
  id: number;
  name: string;
  phone: string;
  deal_id: string;
  lawyer_name: string;
  tariff: string;
  is_active: boolean;
  created_at: string;
}
interface Brand {
  brand_name: string;
  brand_logo: string;
  brand_color: string;
  brand_accent: string;
  name: string;
  email: string;
  website: string;
}

const PLAN_LABELS: Record<string, string> = {
  trial: "Пробный (14 дней)",
  basic: "Базовый",
  pro: "Про",
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
    const res = await apiPost(API.auth, "login", { phone, password, role: "company" });
    setLoading(false);
    if (res.success) {
      saveSession(res.token, "company", res.profile);
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
            <Icon name="Building2" size={26} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold font-oswald text-foreground">Кабинет компании</h1>
          <p className="text-muted-foreground text-sm mt-1">Управление клиентами и настройки</p>
        </div>
        <div className="glass-card rounded-2xl p-6 space-y-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Телефон</label>
            <input
              type="tel" value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="+7 (___) ___-__-__"
              className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary/60"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Пароль</label>
            <input
              type="password" value={password}
              onChange={e => setPassword(e.target.value)}
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
        </div>
      </div>
    </div>
  );
}

// ── Главная страница кабинета ──────────────────────────────────────────────────
export default function CompanyAdmin() {
  const [isAuth, setIsAuth] = useState(false);
  const [tab, setTab] = useState<Tab>("dashboard");
  const [profile, setProfile] = useState(getStoredProfile());
  const [stats, setStats] = useState<Stats | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [brand, setBrand] = useState<Brand | null>(null);
  const [search, setSearch] = useState("");
  const [loadingClients, setLoadingClients] = useState(false);
  const [brandSaving, setBrandSaving] = useState(false);
  const [brandForm, setBrandForm] = useState<Partial<Brand>>({});
  const [addForm, setAddForm] = useState({ name: "", phone: "", deal_id: "", lawyer_name: "" });
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState("");

  useEffect(() => {
    if (getStoredRole() === "company" && getStoredProfile()) {
      setIsAuth(true);
    }
  }, []);

  useEffect(() => {
    if (!isAuth) return;
    loadStats();
  }, [isAuth]);

  useEffect(() => {
    if (tab === "clients") loadClients();
    if (tab === "brand") loadBrand();
  }, [tab]);

  async function loadStats() {
    const res = await apiGet(API.companyAdmin, { action: "stats" });
    if (res.success) {
      setStats(res.stats);
      setSubscription(res.subscription);
    }
  }

  async function loadClients() {
    setLoadingClients(true);
    const res = await apiGet(API.companyAdmin, { action: "clients", search });
    if (res.success) setClients(res.clients);
    setLoadingClients(false);
  }

  async function loadBrand() {
    const res = await apiGet(API.companyAdmin, { action: "brand" });
    if (res.success) {
      setBrand(res.brand);
      setBrandForm(res.brand);
    }
  }

  async function saveBrand() {
    setBrandSaving(true);
    await apiPut(API.companyAdmin, "brand", brandForm);
    setBrandSaving(false);
  }

  async function addClient() {
    if (!addForm.name || !addForm.phone) { setAddError("Имя и телефон обязательны"); return; }
    setAddLoading(true);
    const res = await apiPost(API.companyAdmin, "clients", addForm);
    setAddLoading(false);
    if (res.success) {
      setAddForm({ name: "", phone: "", deal_id: "", lawyer_name: "" });
      setAddError("");
      loadClients();
      loadStats();
    } else {
      setAddError(res.error || "Ошибка при добавлении");
    }
  }

  function handleLogout() {
    clearSession();
    setIsAuth(false);
  }

  if (!isAuth) return <LoginScreen onLogin={() => { setIsAuth(true); setProfile(getStoredProfile()); }} />;

  const companyName = profile?.brand_name || profile?.name || "Компания";

  return (
    <div className="min-h-screen bg-background font-golos">
      {/* Header */}
      <header className="sticky top-0 z-50 glass-card border-b border-border/50 px-4 py-3 flex items-center justify-between max-w-4xl mx-auto">
        <div className="flex items-center gap-3">
          {profile?.brand_logo ? (
            <img src={profile.brand_logo} alt="logo" className="w-8 h-8 rounded-lg object-contain" />
          ) : (
            <div className="w-8 h-8 rounded-lg gradient-blue-purple flex items-center justify-center">
              <Icon name="Building2" size={16} className="text-white" />
            </div>
          )}
          <div>
            <p className="font-bold text-foreground text-sm leading-none">{companyName}</p>
            <p className="text-xs text-muted-foreground">Кабинет компании</p>
          </div>
        </div>
        <button onClick={handleLogout} className="text-muted-foreground hover:text-destructive transition-colors">
          <Icon name="LogOut" size={18} />
        </button>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Навигация */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {([
            { id: "dashboard", label: "Главная", icon: "LayoutDashboard" },
            { id: "clients",   label: "Клиенты", icon: "Users" },
            { id: "brand",     label: "Брендинг", icon: "Palette" },
            { id: "settings",  label: "Настройки", icon: "Settings" },
          ] as { id: Tab; label: string; icon: string }[]).map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium flex-shrink-0 transition-all ${
                tab === t.id ? "gradient-blue-purple text-white" : "glass-card text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon name={t.icon} size={15} />
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Главная ── */}
        {tab === "dashboard" && (
          <div className="space-y-6">
            {/* Подписка */}
            {subscription && (
              <div className={`glass-card rounded-2xl p-5 border ${
                subscription.status === "active" ? "border-green-500/30" : "border-destructive/30"
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Icon name="CreditCard" size={18} className="text-primary" />
                    <p className="font-bold text-foreground">Подписка: {PLAN_LABELS[subscription.plan] || subscription.plan}</p>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                    subscription.status === "active" ? "bg-green-500/10 text-green-400" : "bg-destructive/10 text-destructive"
                  }`}>
                    {subscription.status === "active" ? "Активна" : "Истекла"}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-muted/30 rounded-xl p-3">
                    <p className="text-2xl font-black font-oswald text-primary">{subscription.used}</p>
                    <p className="text-xs text-muted-foreground">Использовано</p>
                  </div>
                  <div className="bg-muted/30 rounded-xl p-3">
                    <p className="text-2xl font-black font-oswald text-foreground">{subscription.clients_limit}</p>
                    <p className="text-xs text-muted-foreground">Лимит</p>
                  </div>
                  <div className="bg-muted/30 rounded-xl p-3">
                    <p className="text-2xl font-black font-oswald text-green-400">{subscription.available}</p>
                    <p className="text-xs text-muted-foreground">Свободно</p>
                  </div>
                </div>
                <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full gradient-blue-purple"
                    style={{ width: `${Math.min(100, (subscription.used / subscription.clients_limit) * 100)}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Действует до: {new Date(subscription.expires_at).toLocaleDateString("ru-RU")}
                </p>
              </div>
            )}

            {/* Статистика */}
            {stats && (
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Всего клиентов", value: stats.total_clients, icon: "Users", color: "text-primary" },
                  { label: "Активных", value: stats.active_clients, icon: "UserCheck", color: "text-green-400" },
                  { label: "Новых за месяц", value: stats.new_this_month, icon: "UserPlus", color: "text-amber-400" },
                  { label: "Неактивных", value: stats.inactive_clients, icon: "UserX", color: "text-muted-foreground" },
                ].map((s, i) => (
                  <div key={i} className="glass-card rounded-2xl p-4">
                    <Icon name={s.icon} size={20} className={`${s.color} mb-2`} />
                    <p className={`text-3xl font-black font-oswald ${s.color}`}>{s.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
                  </div>
                ))}
              </div>
            )}

            {!stats && (
              <div className="grid grid-cols-2 gap-3">
                {[1,2,3,4].map(i => <div key={i} className="h-28 rounded-2xl bg-muted/30 animate-pulse" />)}
              </div>
            )}
          </div>
        )}

        {/* ── Клиенты ── */}
        {tab === "clients" && (
          <div className="space-y-4">
            {/* Форма добавления */}
            <div className="glass-card rounded-2xl p-5">
              <h2 className="font-bold text-foreground mb-4 flex items-center gap-2">
                <Icon name="UserPlus" size={16} className="text-primary" />
                Добавить клиента
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <input
                  value={addForm.name} onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="ФИО клиента"
                  className="bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/60"
                />
                <input
                  value={addForm.phone} onChange={e => setAddForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder="+7 (___) ___-__-__"
                  className="bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/60"
                />
                <input
                  value={addForm.deal_id} onChange={e => setAddForm(f => ({ ...f, deal_id: e.target.value }))}
                  placeholder="ID дела (Битрикс)"
                  className="bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/60"
                />
                <input
                  value={addForm.lawyer_name} onChange={e => setAddForm(f => ({ ...f, lawyer_name: e.target.value }))}
                  placeholder="Юрист"
                  className="bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/60"
                />
              </div>
              {addError && <p className="text-destructive text-xs mt-2">{addError}</p>}
              <button
                onClick={addClient} disabled={addLoading}
                className="mt-3 gradient-blue-purple text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-60"
              >
                {addLoading ? "Добавляем..." : "Добавить"}
              </button>
            </div>

            {/* Поиск */}
            <div className="flex gap-2">
              <div className="flex-1 glass-card rounded-xl flex items-center gap-2 px-3">
                <Icon name="Search" size={16} className="text-muted-foreground flex-shrink-0" />
                <input
                  value={search} onChange={e => setSearch(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && loadClients()}
                  placeholder="Поиск по имени или телефону"
                  className="flex-1 bg-transparent py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none"
                />
              </div>
              <button
                onClick={loadClients}
                className="gradient-blue-purple text-white px-4 rounded-xl text-sm font-medium"
              >
                Найти
              </button>
            </div>

            {/* Список */}
            {loadingClients ? (
              <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-16 rounded-xl bg-muted/30 animate-pulse" />)}</div>
            ) : (
              <div className="space-y-2">
                {clients.length === 0 && (
                  <div className="text-center py-10 text-muted-foreground text-sm">Клиентов нет</div>
                )}
                {clients.map(c => (
                  <div key={c.id} className="glass-card rounded-xl p-4 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full gradient-blue-purple flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {c.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-foreground">{c.name}</p>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${c.is_active ? "bg-green-500/10 text-green-400" : "bg-muted text-muted-foreground"}`}>
                          {c.is_active ? "Активен" : "Неактивен"}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">{c.phone} {c.lawyer_name ? `· ${c.lawyer_name}` : ""}</p>
                    </div>
                    <div className="text-right text-xs text-muted-foreground flex-shrink-0">
                      {c.deal_id && <p className="text-primary">#{c.deal_id}</p>}
                      <p>{new Date(c.created_at).toLocaleDateString("ru-RU")}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Брендинг ── */}
        {tab === "brand" && (
          <div className="space-y-5">
            <div className="glass-card rounded-2xl p-5">
              <h2 className="font-bold text-foreground mb-4 flex items-center gap-2">
                <Icon name="Palette" size={16} className="text-primary" />
                Настройки бренда
              </h2>
              <div className="space-y-3">
                {[
                  { key: "brand_name", label: "Название бренда", placeholder: "Название компании" },
                  { key: "brand_logo", label: "URL логотипа", placeholder: "https://..." },
                  { key: "email",      label: "Email",           placeholder: "info@company.ru" },
                  { key: "website",    label: "Сайт",            placeholder: "https://company.ru" },
                ].map(f => (
                  <div key={f.key}>
                    <label className="text-xs text-muted-foreground mb-1 block">{f.label}</label>
                    <input
                      value={(brandForm as Record<string, string>)[f.key] || ""}
                      onChange={e => setBrandForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                      placeholder={f.placeholder}
                      className="w-full bg-muted border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/60"
                    />
                  </div>
                ))}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Основной цвет</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={brandForm.brand_color || "#00a8cc"}
                        onChange={e => setBrandForm(p => ({ ...p, brand_color: e.target.value }))}
                        className="w-10 h-10 rounded-lg border border-border cursor-pointer bg-transparent"
                      />
                      <input
                        value={brandForm.brand_color || "#00a8cc"}
                        onChange={e => setBrandForm(p => ({ ...p, brand_color: e.target.value }))}
                        className="flex-1 bg-muted border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Акцентный цвет</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={brandForm.brand_accent || "#a855f7"}
                        onChange={e => setBrandForm(p => ({ ...p, brand_accent: e.target.value }))}
                        className="w-10 h-10 rounded-lg border border-border cursor-pointer bg-transparent"
                      />
                      <input
                        value={brandForm.brand_accent || "#a855f7"}
                        onChange={e => setBrandForm(p => ({ ...p, brand_accent: e.target.value }))}
                        className="flex-1 bg-muted border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <button
                onClick={saveBrand} disabled={brandSaving}
                className="mt-4 gradient-blue-purple text-white text-sm font-semibold px-6 py-2.5 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-60"
              >
                {brandSaving ? "Сохраняем..." : "Сохранить"}
              </button>
            </div>
          </div>
        )}

        {/* ── Настройки ── */}
        {tab === "settings" && (
          <div className="space-y-4">
            <div className="glass-card rounded-2xl p-5">
              <h2 className="font-bold text-foreground mb-3 flex items-center gap-2">
                <Icon name="Info" size={16} className="text-primary" />
                О компании
              </h2>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
                  <span className="text-muted-foreground">Название</span>
                  <span className="text-foreground font-medium">{profile?.name || "—"}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
                  <span className="text-muted-foreground">Телефон</span>
                  <span className="text-foreground font-medium">{profile?.phone || "—"}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
                  <span className="text-muted-foreground">Тариф</span>
                  <span className="text-primary font-medium">{PLAN_LABELS[subscription?.plan || ""] || "—"}</span>
                </div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full glass-card rounded-2xl p-4 flex items-center justify-center gap-2 text-destructive border-destructive/20 hover:bg-destructive/10 transition-colors"
            >
              <Icon name="LogOut" size={18} />
              <span className="font-medium">Выйти</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
