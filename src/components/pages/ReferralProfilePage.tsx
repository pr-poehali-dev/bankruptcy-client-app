import { useState } from "react";
import Icon from "@/components/ui/icon";

type Theme = "dark" | "light";

// ─── REFERRAL ─────────────────────────────────────────────────────────────────
export function ReferralPage() {
  const [tab, setTab] = useState<"overview" | "materials">("overview");
  const referrals = [
    { name: "Дмитрий С.", status: "Завершено", earned: "10 000 ₽", date: "15.01.2025" },
    { name: "Мария К.", status: "В процессе", earned: "—", date: "01.03.2025" },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="animate-fade-in-up">
        <h1 className="text-2xl font-bold font-oswald gradient-text mb-1">Рефералы</h1>
        <p className="text-muted-foreground text-sm">Зарабатывайте, помогая другим избавиться от долгов</p>
      </div>

      <div className="glass-card neon-border-purple rounded-2xl p-6 animate-fade-in-up stagger-1 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-purple-500/5 blur-2xl" />
        <p className="text-sm text-muted-foreground mb-1">Заработано</p>
        <p className="text-5xl font-black font-oswald neon-text-purple mb-2">10 000 ₽</p>
        <p className="text-sm text-muted-foreground">За 1 успешную рекомендацию</p>
        <button className="mt-4 gradient-blue-purple text-white text-sm font-semibold px-5 py-2.5 rounded-xl glow-blue hover:opacity-90 transition-opacity">
          Вывести бонусы
        </button>
      </div>

      <div className="glass-card rounded-2xl p-5 border border-amber-500/20 animate-fade-in-up stagger-2">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">🎁</span>
          <div>
            <p className="font-bold text-foreground">10 000 ₽ за рекомендацию</p>
            <p className="text-xs text-muted-foreground">Выплата после начала сопровождения</p>
          </div>
        </div>
        <div className="space-y-2">
          {["Поделитесь ссылкой с другом", "Он обратится в компанию", "Вы получите 10 000 ₽"].map((step, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full gradient-blue-purple flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs font-bold">{i + 1}</span>
              </div>
              <p className="text-sm text-muted-foreground">{step}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-2 animate-fade-in-up stagger-3">
        {(["overview", "materials"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
              tab === t ? "gradient-blue-purple text-white" : "glass-card text-muted-foreground"
            }`}
          >
            {t === "overview" ? "Мои рефералы" : "Обучение"}
          </button>
        ))}
      </div>

      {tab === "overview" ? (
        <div className="space-y-4 animate-fade-in-up">
          <div className="glass-card rounded-2xl p-4">
            <p className="text-xs text-muted-foreground mb-2">Реферальная ссылка</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs text-primary bg-primary/10 rounded-lg px-3 py-2 truncate">
                https://jurportal.ru/ref/IVA2025
              </code>
              <button className="glass-card p-2.5 rounded-lg hover:border-primary/40 transition-colors">
                <Icon name="Copy" size={16} className="text-primary" />
              </button>
            </div>
            <div className="flex gap-2 mt-3">
              <div className="flex-1 bg-muted rounded-xl p-3 text-center">
                <p className="text-xs text-muted-foreground">Промокод</p>
                <p className="font-bold text-foreground">IVA2025</p>
              </div>
              <button className="flex-1 bg-muted rounded-xl p-3 text-center hover:bg-muted/80 transition-colors flex items-center justify-center gap-2">
                <Icon name="QrCode" size={18} className="text-primary" />
                <span className="text-sm text-foreground font-medium">QR-код</span>
              </button>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-5">
            <h2 className="font-bold text-foreground mb-4 flex items-center gap-2">
              <Icon name="Users" size={18} className="text-primary" />
              Мои рефералы
            </h2>
            {referrals.map((r, i) => (
              <div key={i} className="flex items-center gap-3 py-3 border-b border-border/50 last:border-0">
                <div className="w-9 h-9 rounded-full gradient-blue-purple flex items-center justify-center text-white font-bold text-sm">
                  {r.name[0]}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{r.name}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${r.status === "Завершено" ? "bg-green-400" : "bg-amber-400"}`} />
                    <p className="text-xs text-muted-foreground">{r.status} · {r.date}</p>
                  </div>
                </div>
                <span className={`text-sm font-bold ${r.earned !== "—" ? "text-green-400" : "text-muted-foreground"}`}>
                  {r.earned}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-3 animate-fade-in-up">
          {[
            { icon: "📘", title: "Как рассказать о банкротстве", desc: "Скрипты разговора с другом", tag: "Читать" },
            { icon: "🎥", title: "Видеогид: 5 признаков банкротства", desc: "Помогите другу понять, нужна ли помощь", tag: "Смотреть" },
            { icon: "📋", title: "Частые вопросы клиентов", desc: "Ответы на типичные возражения", tag: "Читать" },
            { icon: "💬", title: "Шаблоны сообщений", desc: "Готовые тексты для отправки друзьям", tag: "Скопировать" },
          ].map((m, i) => (
            <div key={i} className="glass-card rounded-xl p-4 flex items-center gap-3 hover:border-primary/30 transition-colors cursor-pointer">
              <span className="text-2xl">{m.icon}</span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">{m.title}</p>
                <p className="text-xs text-muted-foreground">{m.desc}</p>
              </div>
              <span className="text-xs text-primary bg-primary/10 rounded-lg px-2.5 py-1 flex-shrink-0">{m.tag}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── PROFILE ──────────────────────────────────────────────────────────────────
export function ProfilePage({ theme, onToggleTheme }: { theme: Theme; onToggleTheme: () => void }) {
  const info = [
    { label: "ФИО", value: "Иванов Алексей Игоревич", icon: "User" },
    { label: "Телефон", value: "+7 (999) 123-45-67", icon: "Phone" },
    { label: "Email", value: "a.ivanov@mail.ru", icon: "Mail" },
    { label: "Дата рождения", value: "12.05.1985", icon: "Calendar" },
    { label: "ИНН", value: "7712345678", icon: "Hash" },
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
          АИ
        </div>
        <h2 className="text-xl font-bold text-foreground">Алексей Иванов</h2>
        <p className="text-muted-foreground text-sm">Клиент с ноября 2024</p>
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

      <button className="w-full glass-card rounded-2xl p-4 flex items-center justify-center gap-2 text-destructive border-destructive/20 hover:bg-destructive/10 transition-colors animate-fade-in-up stagger-4">
        <Icon name="LogOut" size={18} />
        <span className="font-medium">Выйти из аккаунта</span>
      </button>
    </div>
  );
}
