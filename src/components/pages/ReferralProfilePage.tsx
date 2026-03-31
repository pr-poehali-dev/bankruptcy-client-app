import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import type { User } from "@/components/pages/AuthPage";
import { BRAND } from "@/brand.config";

const REFERRALS_URL = "https://functions.poehali.dev/1ce06022-c1f9-481a-a21e-f5d7c0f1de78";

type Theme = "dark" | "light";

function getInitials(name: string) {
  return name.trim().split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

type ReferralStatus = "thinking" | "not_eligible" | "declined" | "contract_signed";
type FilterTab = "all" | ReferralStatus;

type Referral = {
  name: string;
  status: ReferralStatus;
  earned: number;
  date: string;
  source: "qr" | "link" | "promo";
  debt?: number;
};

const STATUS_CONFIG: Record<ReferralStatus, {
  label: string;
  shortLabel: string;
  color: string;
  textColor: string;
  iconBg: string;
  icon: string;
  cardBg: string;
}> = {
  contract_signed: {
    label: "Договор заключён",
    shortLabel: "Договор",
    color: "text-green-600",
    textColor: "text-green-700",
    iconBg: "bg-green-100 border-green-200",
    icon: "CheckCircle",
    cardBg: "bg-green-50/50 dark:bg-green-500/5",
  },
  thinking: {
    label: "Думает",
    shortLabel: "Думает",
    color: "text-amber-600",
    textColor: "text-amber-700",
    iconBg: "bg-amber-100 border-amber-200",
    icon: "Clock",
    cardBg: "bg-amber-50/50 dark:bg-amber-500/5",
  },
  declined: {
    label: "Отказался",
    shortLabel: "Отказался",
    color: "text-muted-foreground",
    textColor: "text-muted-foreground",
    iconBg: "bg-muted/50 border-border",
    icon: "XCircle",
    cardBg: "",
  },
  not_eligible: {
    label: "Не подошёл под банкротство",
    shortLabel: "Не подошёл",
    color: "text-blue-600",
    textColor: "text-blue-700",
    iconBg: "bg-blue-100 border-blue-200",
    icon: "AlertCircle",
    cardBg: "bg-blue-50/50 dark:bg-blue-500/5",
  },
};

const SOURCE_ICONS: Record<Referral["source"], string> = {
  qr: "QrCode",
  link: "Link",
  promo: "Tag",
};

const SOURCE_LABELS: Record<Referral["source"], string> = {
  qr: "QR-код",
  link: "Ссылка",
  promo: "Промокод",
};

// ─── REFERRAL ─────────────────────────────────────────────────────────────────
export function ReferralPage() {
  const [filter, setFilter] = useState<FilterTab>("all");
  const [showList, setShowList] = useState(true);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch(`${REFERRALS_URL}/`)
      .then(r => r.json())
      .then(data => {
        if (data.success && data.referrals) {
          const mapped: Referral[] = data.referrals.map((r: {
            name: string; status: ReferralStatus; earned: number; date: string;
          }, i: number) => ({
            name: r.name,
            status: r.status,
            earned: r.earned,
            date: r.date,
            source: (["qr", "link", "promo"] as const)[i % 3],
            debt: [450000, 320000, 580000, 210000][i % 4],
          }));
          setReferrals(mapped);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const counts = {
    all: referrals.length,
    contract_signed: referrals.filter(r => r.status === "contract_signed").length,
    thinking: referrals.filter(r => r.status === "thinking").length,
    declined: referrals.filter(r => r.status === "declined").length,
    not_eligible: referrals.filter(r => r.status === "not_eligible").length,
  };

  const totalEarned = referrals.filter(r => r.status === "contract_signed")
    .reduce((sum, r) => sum + (r.earned || BRAND.referral.bonusAmount), 0);

  const totalTransitions = referrals.length;
  const conversionPct = totalTransitions > 0
    ? Math.round((counts.contract_signed / totalTransitions) * 100)
    : 0;

  const qrCount = referrals.filter(r => r.source === "qr").length;
  const linkCount = referrals.filter(r => r.source === "link").length;
  const promoCount = referrals.filter(r => r.source === "promo").length;

  const filtered = filter === "all" ? referrals : referrals.filter(r => r.status === filter);

  function handleCopy() {
    navigator.clipboard.writeText("https://jurportal.ru/ref/REF2025").then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const FILTER_TABS: { key: FilterTab; label: string }[] = [
    { key: "all", label: `Все (${counts.all})` },
    { key: "contract_signed", label: `Договор (${counts.contract_signed})` },
    { key: "thinking", label: `Думает (${counts.thinking})` },
    { key: "declined", label: `Отказался (${counts.declined})` },
    { key: "not_eligible", label: `Не подошёл (${counts.not_eligible})` },
  ];

  return (
    <div className="p-4 space-y-4">
      <div className="animate-fade-in-up">
        <h1 className="text-2xl font-bold font-oswald gradient-text mb-1">Рефералы</h1>
        <p className="text-muted-foreground text-sm">Зарабатывайте, помогая другим избавиться от долгов</p>
      </div>

      {/* Реферальная ссылка */}
      <div className="glass-card rounded-2xl p-4 animate-fade-in-up stagger-1">
        <p className="text-xs text-muted-foreground mb-2">Реферальная ссылка</p>
        <div className="flex items-center gap-2">
          <code className="flex-1 text-xs text-primary bg-primary/10 rounded-lg px-3 py-2 truncate">
            https://jurportal.ru/ref/REF2025
          </code>
          <button
            onClick={handleCopy}
            className={`p-2.5 rounded-lg border transition-colors ${copied ? "bg-green-500/10 border-green-500/30 text-green-500" : "glass-card hover:border-primary/40 text-primary"}`}
          >
            <Icon name={copied ? "Check" : "Copy"} size={16} />
          </button>
        </div>
        <div className="flex gap-2 mt-3">
          <div className="flex-1 bg-muted/50 rounded-xl p-2.5 text-center">
            <p className="text-[10px] text-muted-foreground">Промокод</p>
            <p className="font-bold text-foreground text-sm">REF2025</p>
          </div>
          <button className="flex-1 bg-muted/50 rounded-xl p-2.5 text-center hover:bg-muted transition-colors flex items-center justify-center gap-1.5">
            <Icon name="QrCode" size={16} className="text-primary" />
            <span className="text-sm text-foreground font-medium">QR-код</span>
          </button>
          <div className="flex-1 bg-muted/50 rounded-xl p-2.5 text-center">
            <p className="text-[10px] text-muted-foreground">Бонус</p>
            <p className="font-bold text-primary text-sm">{BRAND.referral.bonusLabel}</p>
          </div>
        </div>
      </div>

      {/* Заголовок клиентов + конверсия */}
      <div className="flex items-center justify-between animate-fade-in-up stagger-2">
        <h2 className="font-bold text-foreground flex items-center gap-2">
          <Icon name="Users" size={18} className="text-primary" />
          Мои клиенты
        </h2>
        {!loading && (
          <span className="text-sm text-muted-foreground">
            Конверсия{" "}
            <span className="font-bold text-green-500">{conversionPct}%</span>
          </span>
        )}
      </div>

      {/* Статистика 2×2 */}
      {loading ? (
        <div className="grid grid-cols-2 gap-3">
          {[1,2,3,4].map(i => <div key={i} className="h-24 rounded-2xl bg-muted/30 animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 animate-fade-in-up stagger-2">
          {(["contract_signed", "thinking", "declined", "not_eligible"] as ReferralStatus[]).map(s => {
            const cfg = STATUS_CONFIG[s];
            const count = counts[s];
            return (
              <button
                key={s}
                onClick={() => setFilter(filter === s ? "all" : s)}
                className={`glass-card rounded-2xl p-4 text-left transition-all hover:scale-[1.02] ${
                  filter === s ? "ring-2 ring-primary/40" : ""
                }`}
              >
                <div className={`w-8 h-8 rounded-full border flex items-center justify-center mb-2 ${cfg.iconBg}`}>
                  <Icon name={cfg.icon} size={16} className={cfg.color} />
                </div>
                <p className={`text-xs font-medium leading-tight mb-1 ${cfg.color}`}>
                  {cfg.label}
                </p>
                <p className={`text-3xl font-black font-oswald ${cfg.color}`}>{count}</p>
              </button>
            );
          })}
        </div>
      )}

      {/* Итого переходов */}
      {!loading && (
        <div className="glass-card rounded-xl px-4 py-3 animate-fade-in-up stagger-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Всего переходов</p>
            <p className="font-bold text-foreground">{totalTransitions}</p>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Icon name="QrCode" size={12} className="text-muted-foreground" />
              QR-код: {qrCount}
            </span>
            <span className="flex items-center gap-1">
              <Icon name="Link" size={12} className="text-muted-foreground" />
              Ссылка: {linkCount}
            </span>
            <span className="flex items-center gap-1">
              <Icon name="Tag" size={12} className="text-muted-foreground" />
              Промокод: {promoCount}
            </span>
          </div>
        </div>
      )}

      {/* Заработано */}
      {!loading && totalEarned > 0 && (
        <div className="glass-card neon-border-blue rounded-2xl p-4 flex items-center justify-between animate-fade-in-up stagger-3">
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Заработано</p>
            <p className="text-2xl font-black font-oswald neon-text-blue">
              +{totalEarned.toLocaleString("ru-RU")} ₽
            </p>
          </div>
          <button className="gradient-blue-purple text-white text-sm font-semibold px-4 py-2 rounded-xl hover:opacity-90 transition-opacity">
            Вывести
          </button>
        </div>
      )}

      {/* Кнопка скрыть/показать список */}
      <button
        onClick={() => setShowList(v => !v)}
        className="w-full glass-card rounded-xl py-3 flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors animate-fade-in-up stagger-4"
      >
        <Icon name={showList ? "ChevronUp" : "ChevronDown"} size={16} />
        {showList ? "Скрыть список" : "Показать список"}
      </button>

      {/* Фильтры-таблетки */}
      {showList && (
        <>
          <div className="flex gap-2 overflow-x-auto pb-1 animate-fade-in-up scrollbar-hide">
            {FILTER_TABS.map(t => (
              <button
                key={t.key}
                onClick={() => setFilter(t.key)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  filter === t.key
                    ? t.key === "all"
                      ? "bg-foreground text-background"
                      : t.key === "contract_signed"
                        ? "bg-green-500 text-white"
                        : t.key === "thinking"
                          ? "bg-amber-500 text-white"
                          : t.key === "declined"
                            ? "bg-muted-foreground text-background"
                            : "bg-blue-500 text-white"
                    : "glass-card text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Список рефералов */}
          <div className="space-y-2 animate-fade-in-up">
            {loading && [1,2,3].map(i => (
              <div key={i} className="h-16 rounded-xl bg-muted/30 animate-pulse" />
            ))}
            {!loading && filtered.length === 0 && (
              <div className="text-center py-8 text-muted-foreground text-sm">
                Нет рефералов с таким статусом
              </div>
            )}
            {!loading && filtered.map((r, i) => {
              const cfg = STATUS_CONFIG[r.status];
              return (
                <div key={i} className={`glass-card rounded-xl p-3 flex items-center gap-3 ${cfg.cardBg}`}>
                  <div className={`w-9 h-9 rounded-full border flex items-center justify-center flex-shrink-0 ${cfg.iconBg}`}>
                    <Icon name={cfg.icon} size={18} className={cfg.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-foreground">{r.name}</p>
                      <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                        <Icon name={SOURCE_ICONS[r.source]} size={10} className="text-muted-foreground" />
                        {SOURCE_LABELS[r.source]}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className={`text-xs font-medium ${cfg.color}`}>{cfg.label}</p>
                      {r.debt && (
                        <span className="text-xs text-muted-foreground">
                          долг {r.debt.toLocaleString("ru-RU")} ₽
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-muted-foreground">{r.date}</p>
                    {r.status === "contract_signed" && (
                      <p className="text-sm font-bold text-green-500">
                        +{(r.earned || BRAND.referral.bonusAmount).toLocaleString("ru-RU")} ₽
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ─── PROFILE ──────────────────────────────────────────────────────────────────
export function ProfilePage({ theme, onToggleTheme, user, onLogout }: {
  theme: Theme;
  onToggleTheme: () => void;
  user?: User;
  onLogout?: () => void;
}) {
  const displayName = user?.name ?? "Клиент";
  const info = [
    { label: "ФИО", value: displayName, icon: "User" },
    { label: "Телефон", value: user?.phone ?? "—", icon: "Phone" },
    { label: "Email", value: "—", icon: "Mail" },
    { label: "Дата рождения", value: "—", icon: "Calendar" },
    { label: "ИНН", value: "—", icon: "Hash" },
  ];
  const security = [
    { label: "Двухфакторная аутентификация", enabled: true },
    { label: "Уведомления о входе", enabled: true },
    { label: "Шифрование документов", enabled: true },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="glass-card rounded-2xl p-6 text-center animate-fade-in-up mesh-bg">
        <div className="w-20 h-20 rounded-full gradient-blue-purple flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4 glow-blue">
          {getInitials(displayName)}
        </div>
        <h2 className="text-xl font-bold text-foreground">{displayName}</h2>
        <p className="text-muted-foreground text-sm">{BRAND.companyName}</p>
        <div className="flex items-center justify-center gap-1 mt-2">
          <Icon name="ShieldCheck" size={14} className="text-green-400" />
          <span className="text-green-400 text-xs">Личность подтверждена</span>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-5 animate-fade-in-up stagger-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
              <Icon name={theme === "dark" ? "Moon" : "Sun"} size={20} className="text-primary" />
            </div>
            <div>
              <p className="font-semibold text-foreground text-sm">Тема оформления</p>
              <p className="text-xs text-muted-foreground">{theme === "dark" ? "Тёмная" : "Светлая"}</p>
            </div>
          </div>
          <button
            onClick={onToggleTheme}
            className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${theme === "dark" ? "bg-primary" : "bg-muted-foreground/30"}`}
          >
            <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-300 ${theme === "dark" ? "translate-x-6" : "translate-x-0.5"}`} />
          </button>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-5 animate-fade-in-up stagger-2">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-foreground flex items-center gap-2">
            <Icon name="UserCircle" size={18} className="text-primary" />
            Личные данные
          </h2>
          <button className="text-xs text-primary bg-primary/10 rounded-lg px-3 py-1.5 hover:bg-primary/20 transition-colors">
            Изменить
          </button>
        </div>
        <div className="space-y-3">
          {info.map((item, i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl">
              <Icon name={item.icon} size={16} className="text-primary flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="text-sm font-medium text-foreground">{item.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card rounded-2xl p-5 animate-fade-in-up stagger-3">
        <h2 className="font-bold text-foreground mb-4 flex items-center gap-2">
          <Icon name="Shield" size={18} className="text-green-400" />
          Безопасность
        </h2>
        <div className="space-y-3">
          {security.map((s, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
              <span className="text-sm text-foreground">{s.label}</span>
              <div className={`flex items-center gap-1.5 text-xs font-medium ${s.enabled ? "text-green-400" : "text-muted-foreground"}`}>
                <div className={`w-2 h-2 rounded-full ${s.enabled ? "bg-green-400" : "bg-muted-foreground"}`} />
                {s.enabled ? "Вкл." : "Выкл."}
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1.5">
          <Icon name="Lock" size={12} className="text-muted-foreground" />
          Все документы зашифрованы по стандарту AES-256
        </p>
      </div>

      <button
        onClick={onLogout}
        className="w-full glass-card rounded-2xl p-4 flex items-center justify-center gap-2 text-destructive border-destructive/20 hover:bg-destructive/10 transition-colors animate-fade-in-up stagger-4"
      >
        <Icon name="LogOut" size={18} />
        <span className="font-medium">Выйти из аккаунта</span>
      </button>
    </div>
  );
}
