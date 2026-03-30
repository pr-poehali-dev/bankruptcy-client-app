import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";

type Page = "home" | "finance" | "chat" | "case" | "referral" | "profile";
type ChatTab = "ai" | "lawyer";
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

// ─── AI KNOWLEDGE BASE ────────────────────────────────────────────────────────
const AI_KB: { keywords: string[]; answer: string }[] = [
  {
    keywords: ["работ", "официально", "устроюсь", "занятость", "зарплат", "доход", "заработ"],
    answer: "Да, вы можете официально работать во время процедуры банкротства — это абсолютно законно. Прожиточный минимум всегда остаётся у вас. Из зарплаты удерживается только сумма сверх прожиточного минимума (регионального). Дополнительные доходы — премии, подработки — также учитываются, но минимум гарантирован.",
  },
  {
    keywords: ["зарплату заберут", "всю зарплату", "забирать зарплату"],
    answer: "Нет, всю зарплату не забирают. Вам гарантирован прожиточный минимум на вас и каждого иждивенца. Только сумма сверх этого минимума поступает в конкурсную массу. Финансовый управляющий открывает специальный счёт, на который перечисляется ваша «живая» часть зарплаты.",
  },
  {
    keywords: ["банк", "уведомлен", "когда узнает", "коллектор", "звонить", "звонки"],
    answer: "После вынесения судебного решения о признании вас банкротом финансовый управляющий в течение 5 рабочих дней уведомляет все банки и кредиторов. С этого момента все звонки коллекторов и банков — незаконны. Любые требования можно предъявлять только через арбитражный суд. Если кто-то всё равно звонит — сообщите нам.",
  },
  {
    keywords: ["сколько длится", "срок", "сколько времени", "когда закончится", "когда признают", "когда спишут"],
    answer: "Стандартная процедура банкротства физического лица занимает от 6 до 12 месяцев. В вашем случае — ориентировочно до июня 2025 года. Этапы: подача заявления → 1–2 мес., суд → 2–3 мес., реализация имущества → 4–6 мес., завершение и списание долгов.",
  },
  {
    keywords: ["стоит", "цена", "стоимость", "рассрочк", "платёж", "платить", "что входит", "второй платёж", "сбор"],
    answer: "Стоимость нашего сопровождения — 90 000 ₽, доступна рассрочка на 6 месяцев по 15 000 ₽/мес. В стоимость входит: полное юридическое сопровождение, подготовка всех документов, представительство в суде, работа финансового управляющего. Второй платёж — это вознаграждение арбитражного управляющего, установленное законом (25 000 ₽), оплачивается отдельно.",
  },
  {
    keywords: ["машин", "автомобил", "транспорт", "авто"],
    answer: "Если автомобиль — единственный источник дохода (такси, доставка), есть шанс его сохранить. В остальных случаях автомобиль входит в конкурсную массу и реализуется. Продавать машину перед банкротством не рекомендуем: сделки за последние 3 года проверяются судом, и сделка может быть оспорена.",
  },
  {
    keywords: ["квартир", "жильё", "единственное жильё", "недвижимост"],
    answer: "Единственное жильё (если оно не в ипотеке) не может быть изъято по закону — это ваш иммунитет. Ипотечная квартира, к сожалению, входит в конкурсную массу. Дача, вторая квартира, доля в недвижимости — реализуются. Обсудите детали с вашим юристом Еленой.",
  },
  {
    keywords: ["сделк", "продал", "3 года", "проверяют", "оспорят"],
    answer: "Да, все сделки за последние 3 года анализируются финансовым управляющим. Особое внимание — к сделкам с родственниками и продаже имущества по заниженной цене. Такие сделки могут быть оспорены судом. Поэтому важно сообщить нашим юристам обо всех крупных сделках заранее.",
  },
];

function getAiAnswer(question: string): string {
  const q = question.toLowerCase();
  for (const item of AI_KB) {
    if (item.keywords.some(kw => q.includes(kw))) {
      return item.answer;
    }
  }
  return "Это хороший вопрос! К сожалению, у меня нет точного ответа в базе знаний. Рекомендую написать вашему персональному юристу Елене через вкладку «Мой юрист» — она ответит в течение рабочего дня.";
}

// ─── HOME ─────────────────────────────────────────────────────────────────────
function HomePage({ onNavigate, caseStages, loadingStages }: {
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
function FinancePage() {
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

// ─── CHAT ─────────────────────────────────────────────────────────────────────
type Message = { from: string; text: string; time: string; isFile?: boolean };

function ChatPage() {
  const [tab, setTab] = useState<ChatTab>("ai");
  const [input, setInput] = useState("");
  const [aiMessages, setAiMessages] = useState<Message[]>([
    { from: "ai", text: "Привет! Я ваш ИИ-ассистент по вопросам банкротства. Задайте любой вопрос — отвечу быстро и точно 🤖\n\nЧасто спрашивают:\n• Сколько длится процедура?\n• Что будет с квартирой?\n• Зарплату полностью заберут?\n• Когда перестанут звонить банки?", time: "10:00" },
  ]);
  const [lawyerMessages] = useState<Message[]>([
    { from: "lawyer", text: "Добрый день! Это Елена, ваш персональный юрист. Готова ответить на вопросы по делу.", time: "09:30" },
    { from: "user", text: "Елена, когда будет следующее заседание?", time: "09:45" },
    { from: "lawyer", text: "Следующее заседание назначено на 18 апреля в 11:00. Я пришлю напоминание за 2 дня.", time: "09:46" },
    { from: "lawyer", text: "📎 Определение_суда_18.04.pdf", time: "09:46", isFile: true },
  ]);
  const [isTyping, setIsTyping] = useState(false);

  const messages = tab === "ai" ? aiMessages : lawyerMessages;

  const now = () => new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });

  const sendAiMessage = useCallback(() => {
    if (!input.trim()) return;
    const userMsg: Message = { from: "user", text: input.trim(), time: now() };
    setAiMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);
    const answer = getAiAnswer(input);
    setTimeout(() => {
      setIsTyping(false);
      setAiMessages(prev => [...prev, { from: "ai", text: answer, time: now() }]);
    }, 900 + Math.random() * 600);
  }, [input]);

  return (
    <div className="flex flex-col h-[calc(100vh-130px)]">
      <div className="p-4 md:px-6 animate-fade-in-up">
        <h1 className="text-2xl font-bold font-oswald gradient-text mb-3">Чаты</h1>
        <div className="flex gap-2">
          {(["ai", "lawyer"] as ChatTab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${
                tab === t ? "gradient-blue-purple text-white glow-blue" : "glass-card text-muted-foreground hover:text-foreground"
              }`}
            >
              {t === "ai" ? <><span>🤖</span> ИИ-Ассистент</> : <><span>⚖️</span> Мой юрист</>}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 md:px-6 pb-3">
        <div className="glass-card rounded-xl p-3 flex items-center gap-3">
          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-lg ${tab === "ai" ? "bg-primary/20" : "bg-purple-500/20"}`}>
            {tab === "ai" ? "🤖" : "👩‍⚖️"}
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{tab === "ai" ? "ИИ-Ассистент" : "Елена Смирнова"}</p>
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <p className="text-xs text-green-400">{tab === "ai" ? "Онлайн 24/7" : "Онлайн"}</p>
            </div>
          </div>
          {tab === "lawyer" && (
            <button className="ml-auto glass-card rounded-lg p-2 hover:border-primary/40 transition-colors">
              <Icon name="Paperclip" size={16} className="text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 md:px-6 space-y-3 pb-2">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.from === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[82%] px-4 py-3 ${
              m.from === "user" ? "chat-bubble-out" : "chat-bubble-in"
            } ${m.isFile ? "flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity" : ""}`}>
              {m.isFile ? (
                <>
                  <Icon name="FileText" size={18} className="text-primary flex-shrink-0" />
                  <span className="text-sm text-primary underline">{m.text}</span>
                </>
              ) : (
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">{m.text}</p>
              )}
              <p className={`text-xs text-muted-foreground mt-1.5 ${m.from === "user" ? "text-right" : ""}`}>{m.time}</p>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="chat-bubble-in px-4 py-3 flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "0ms" }} />
              <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "150ms" }} />
              <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        )}
      </div>

      <div className="p-4 md:px-6">
        <div className="glass-card rounded-2xl p-2 flex items-center gap-2 border border-border/60 focus-within:border-primary/50 transition-colors">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => tab === "ai" && e.key === "Enter" && sendAiMessage()}
            placeholder={tab === "ai" ? "Задайте вопрос ИИ-ассистенту..." : "Написать юристу..."}
            className="flex-1 bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none"
          />
          {tab === "lawyer" && (
            <button className="p-2 rounded-xl hover:bg-muted transition-colors">
              <Icon name="Paperclip" size={18} className="text-muted-foreground" />
            </button>
          )}
          <button
            onClick={tab === "ai" ? sendAiMessage : undefined}
            className="gradient-blue-purple w-10 h-10 rounded-xl flex items-center justify-center hover:opacity-90 transition-opacity flex-shrink-0"
          >
            <Icon name="Send" size={16} className="text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── CASE ─────────────────────────────────────────────────────────────────────
function CasePage({ stages, loading }: {
  stages: { title: string; done: boolean; active?: boolean; date: string; desc?: string; icon?: string }[];
  loading: boolean;
}) {
  const docs = [
    { name: "Заявление о банкротстве.pdf", size: "1.2 MB", date: "01.11.2024", type: "pdf" },
    { name: "Решение суда.pdf", size: "0.8 MB", date: "15.12.2024", type: "pdf" },
    { name: "Список кредиторов.xlsx", size: "0.3 MB", date: "20.12.2024", type: "xls" },
    { name: "Опись имущества.pdf", size: "0.5 MB", date: "10.01.2025", type: "pdf" },
  ];

  const activeStage = stages.find(s => s.active);

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="animate-fade-in-up">
        <h1 className="text-2xl font-bold font-oswald gradient-text mb-1">Моё дело</h1>
        <p className="text-muted-foreground text-sm">Дело № А40-12345/2024 · Арбитражный суд г. Москвы</p>
      </div>

      <div className="glass-card neon-border-blue rounded-2xl p-5 animate-fade-in-up stagger-1 mesh-bg">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center">
            <Icon name="Scale" size={28} className="text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-sm text-muted-foreground">Текущая стадия</p>
              {loading && <div className="w-3 h-3 border border-primary/40 border-t-primary rounded-full animate-spin" />}
            </div>
            <p className="text-xl font-bold text-primary">{activeStage?.title ?? "Загрузка..."}</p>
            <p className="text-sm text-muted-foreground">Финансовый управляющий: Петров А.В.</p>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-5 animate-fade-in-up stagger-2">
        <h2 className="font-bold text-foreground mb-5 flex items-center gap-2">
          <Icon name="ListChecks" size={18} className="text-primary" />
          Этапы процедуры
          <span className="ml-auto text-xs text-muted-foreground font-normal flex items-center gap-1">
            <Icon name="RefreshCw" size={12} />
            Битрикс24
          </span>
        </h2>
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
          <div className="space-y-5">
            {stages.map((s, i) => (
              <div key={i} className="flex gap-4 relative">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 ${
                  s.done ? "bg-green-500/20 border-2 border-green-500/50" :
                  s.active ? "bg-primary/20 border-2 border-primary animate-pulse" :
                  "bg-muted border-2 border-border"
                }`}>
                  <Icon
                    name={s.done ? "Check" : (s.icon ?? "Circle")}
                    size={14}
                    className={s.done ? "text-green-400" : s.active ? "text-primary" : "text-muted-foreground"}
                  />
                </div>
                <div className="flex-1 pb-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`font-medium text-sm ${s.active ? "text-primary" : s.done ? "text-foreground" : "text-muted-foreground"}`}>
                      {s.title}
                    </p>
                    <span className={`text-xs flex-shrink-0 ${s.active ? "text-primary" : s.done ? "text-green-400" : "text-muted-foreground"}`}>
                      {s.date}
                    </span>
                  </div>
                  {s.desc && <p className="text-xs text-muted-foreground mt-0.5">{s.desc}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-5 animate-fade-in-up stagger-3">
        <h2 className="font-bold text-foreground mb-4 flex items-center gap-2">
          <Icon name="FolderOpen" size={18} className="text-primary" />
          Документы по делу
        </h2>
        <div className="space-y-2">
          {docs.map((d, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer group">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${d.type === "pdf" ? "bg-red-500/15" : "bg-green-500/15"}`}>
                <Icon name="FileText" size={18} className={d.type === "pdf" ? "text-red-400" : "text-green-400"} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">{d.name}</p>
                <p className="text-xs text-muted-foreground">{d.size} · {d.date}</p>
              </div>
              <Icon name="Download" size={16} className="text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── REFERRAL ─────────────────────────────────────────────────────────────────
function ReferralPage() {
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
function ProfilePage({ theme, onToggleTheme }: { theme: Theme; onToggleTheme: () => void }) {
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

      {/* Theme Toggle */}
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

// ─── APP ──────────────────────────────────────────────────────────────────────
const DEFAULT_STAGES = [
  { title: "Подача заявления в суд", done: true, date: "01.11.2024", desc: "Заявление принято к производству", icon: "FileText" },
  { title: "Признание банкротом", done: true, date: "15.12.2024", desc: "Вынесено решение суда", icon: "Gavel" },
  { title: "Реализация имущества", done: false, active: true, date: "В процессе", desc: "Финансовый управляющий формирует массу", icon: "Package" },
  { title: "Расчёт с кредиторами", done: false, date: "~май 2025", desc: "Распределение средств", icon: "DollarSign" },
  { title: "Завершение. Долги списаны", done: false, date: "~июнь 2025", desc: "Списание оставшихся долгов", icon: "Trophy" },
];

export default function App() {
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
  }, []);

  const toggleTheme = useCallback(() => setTheme(t => t === "dark" ? "light" : "dark"), []);

  return (
    <div className="min-h-screen bg-background font-golos max-w-md mx-auto relative">
      <header className="sticky top-0 z-50 glass-card border-b border-border/50 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg gradient-blue-purple flex items-center justify-center">
            <Icon name="Scale" size={14} className="text-white" />
          </div>
          <span className="font-bold font-oswald text-foreground tracking-wide text-sm">Клиентское приложение</span>
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
          <button className="w-8 h-8 rounded-full gradient-blue-purple flex items-center justify-center text-white text-xs font-bold">
            АИ
          </button>
        </div>
      </header>

      <main className="pb-24 min-h-[calc(100vh-120px)] overflow-y-auto">
        {page === "home" && <HomePage onNavigate={setPage} caseStages={caseStages} loadingStages={loadingStages} />}
        {page === "finance" && <FinancePage />}
        {page === "chat" && <ChatPage />}
        {page === "case" && <CasePage stages={caseStages} loading={loadingStages} />}
        {page === "referral" && <ReferralPage />}
        {page === "profile" && <ProfilePage theme={theme} onToggleTheme={toggleTheme} />}
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
