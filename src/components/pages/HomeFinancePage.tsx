import Icon from "@/components/ui/icon";

type Page = "home" | "finance" | "chat" | "case" | "referral" | "profile";

// ─── HOME ─────────────────────────────────────────────────────────────────────
export function HomePage({ onNavigate, caseStages, loadingStages }: {
  onNavigate: (p: Page) => void;
  caseStages: { title: string; done: boolean; active?: boolean; date: string }[];
  loadingStages: boolean;
}) {
  const stats = [
    { label: "Тариф", value: "Стандарт", sub: "Полное сопровождение", icon: "Star", color: "blue" },
    { label: "Оплачено", value: "45 000 ₽", sub: "из 90 000 ₽", icon: "CheckCircle", color: "green" },
    { label: "К оплате", value: "45 000 ₽", sub: "до 15 апреля", icon: "AlertCircle", color: "amber" },
    { label: "Стадия дела", value: caseStages.find(s => s.active)?.title ?? "—", sub: "актуально", icon: "Scale", color: "purple" },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="glass-card rounded-2xl p-6 mesh-bg relative overflow-hidden animate-fade-in-up">
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-primary/5 blur-3xl" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-full gradient-blue-purple flex items-center justify-center text-white font-bold text-lg">
              АИ
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Добро пожаловать,</p>
              <h1 className="text-xl font-bold text-foreground">Алексей Иванов</h1>
            </div>
            <div className="ml-auto flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-full px-3 py-1">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-green-400 text-xs font-medium">Дело активно</span>
            </div>
          </div>
          <p className="text-muted-foreground text-sm">
            Ваше дело ведёт <span className="text-primary font-medium">Елена Смирнова</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {stats.map((s, i) => (
          <div
            key={s.label}
            className={`glass-card rounded-2xl p-4 animate-fade-in-up stagger-${i + 1} cursor-pointer hover:scale-[1.02] transition-transform`}
          >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${
              s.color === "blue" ? "bg-primary/15" :
              s.color === "green" ? "bg-green-500/15" :
              s.color === "amber" ? "bg-amber-500/15" : "bg-purple-500/15"
            }`}>
              <Icon name={s.icon} size={18} className={
                s.color === "blue" ? "text-primary" :
                s.color === "green" ? "text-green-400" :
                s.color === "amber" ? "text-amber-400" : "text-purple-400"
              } />
            </div>
            <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
            <p className="text-base font-bold text-foreground leading-tight">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="glass-card rounded-2xl p-5 animate-fade-in-up stagger-3">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-foreground flex items-center gap-2">
            <Icon name="GitBranch" size={18} className="text-primary" />
            Ход дела
          </h2>
          <button onClick={() => onNavigate("case")} className="text-xs text-primary hover:text-primary/80 transition-colors">
            Подробнее →
          </button>
        </div>
        {loadingStages ? (
          <div className="flex items-center gap-2 text-muted-foreground text-sm py-2">
            <div className="w-4 h-4 border-2 border-primary/40 border-t-primary rounded-full animate-spin" />
            Загружаем стадии из Битрикс24...
          </div>
        ) : (
          <div className="space-y-3">
            {caseStages.map((stage, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                  stage.done ? "bg-green-500/20 border border-green-500/40" :
                  stage.active ? "bg-primary/20 border border-primary/50 animate-pulse" :
                  "bg-muted border border-border"
                }`}>
                  {stage.done ? (
                    <Icon name="Check" size={13} className="text-green-400" />
                  ) : stage.active ? (
                    <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-muted-foreground/40" />
                  )}
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-medium ${stage.active ? "text-primary" : stage.done ? "text-foreground" : "text-muted-foreground"}`}>
                    {stage.title}
                  </p>
                </div>
                <span className={`text-xs ${stage.active ? "text-primary" : "text-muted-foreground"}`}>{stage.date}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 animate-fade-in-up stagger-4">
        <button
          onClick={() => onNavigate("chat")}
          className="glass-card rounded-2xl p-4 flex items-center gap-3 hover:border-primary/40 transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center group-hover:bg-primary/25 transition-colors">
            <span className="text-xl">🤖</span>
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-foreground">ИИ-Ассистент</p>
            <p className="text-xs text-muted-foreground">Задать вопрос</p>
          </div>
        </button>
        <button
          onClick={() => onNavigate("referral")}
          className="glass-card rounded-2xl p-4 flex items-center gap-3 hover:border-purple-500/40 transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-500/15 flex items-center justify-center group-hover:bg-purple-500/25 transition-colors">
            <span className="text-xl">🎁</span>
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-foreground">Рефералы</p>
            <p className="text-xs text-purple-400">10 000 ₽ за друга</p>
          </div>
        </button>
      </div>
    </div>
  );
}

// ─── FINANCE ──────────────────────────────────────────────────────────────────
export function FinancePage() {
  const payments = [
    { date: "01.03.2025", amount: "15 000 ₽", status: "paid", desc: "Ежемесячный платёж" },
    { date: "01.02.2025", amount: "15 000 ₽", status: "paid", desc: "Ежемесячный платёж" },
    { date: "01.01.2025", amount: "15 000 ₽", status: "paid", desc: "Первоначальный взнос" },
    { date: "15.04.2025", amount: "15 000 ₽", status: "upcoming", desc: "Следующий платёж" },
    { date: "15.05.2025", amount: "15 000 ₽", status: "pending", desc: "Запланировано" },
    { date: "15.06.2025", amount: "15 000 ₽", status: "pending", desc: "Запланировано" },
  ];
  const progress = (45000 / 90000) * 100;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="animate-fade-in-up">
        <h1 className="text-2xl font-bold font-oswald gradient-text mb-1">Финансы</h1>
        <p className="text-muted-foreground text-sm">Тариф «Стандарт» — рассрочка 6 месяцев</p>
      </div>

      <div className="glass-card neon-border-blue rounded-2xl p-6 animate-fade-in-up stagger-1">
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-muted-foreground text-sm mb-1">Стоимость сопровождения</p>
            <p className="text-4xl font-bold font-oswald neon-text-blue">90 000 ₽</p>
          </div>
          <div className="bg-primary/10 border border-primary/30 rounded-xl px-3 py-2 text-center">
            <p className="text-xs text-muted-foreground">Тариф</p>
            <p className="text-primary font-bold text-sm">Стандарт</p>
          </div>
        </div>
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Оплачено</span>
            <span className="text-green-400 font-semibold">45 000 ₽</span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div className="h-full rounded-full gradient-blue-purple progress-glow" style={{ width: `${progress}%` }} />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0 ₽</span>
            <span className="text-primary font-medium">{progress.toFixed(0)}% оплачено</span>
            <span>90 000 ₽</span>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-5 border border-amber-500/30 bg-amber-500/5 animate-fade-in-up stagger-2">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-amber-500/20 flex items-center justify-center">
            <Icon name="Calendar" size={20} className="text-amber-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">Следующий платёж</p>
            <p className="font-bold text-foreground">15 апреля 2025 года</p>
          </div>
          <div className="text-right">
            <p className="text-xl font-bold text-amber-400">15 000 ₽</p>
            <p className="text-xs text-muted-foreground">осталось 16 дней</p>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-5 animate-fade-in-up stagger-3">
        <h2 className="font-bold text-foreground mb-4 flex items-center gap-2">
          <Icon name="Receipt" size={18} className="text-primary" />
          История платежей
        </h2>
        <div className="space-y-2">
          {payments.map((p, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                p.status === "paid" ? "bg-green-500/15" : p.status === "upcoming" ? "bg-amber-500/15" : "bg-muted"
              }`}>
                <Icon
                  name={p.status === "paid" ? "CheckCircle" : p.status === "upcoming" ? "Clock" : "Circle"}
                  size={16}
                  className={p.status === "paid" ? "text-green-400" : p.status === "upcoming" ? "text-amber-400" : "text-muted-foreground"}
                />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{p.desc}</p>
                <p className="text-xs text-muted-foreground">{p.date}</p>
              </div>
              <span className={`text-sm font-bold ${p.status === "paid" ? "text-green-400" : p.status === "upcoming" ? "text-amber-400" : "text-muted-foreground"}`}>
                {p.amount}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
