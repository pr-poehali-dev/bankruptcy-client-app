import { useState, useCallback } from "react";
import Icon from "@/components/ui/icon";

type ChatTab = "ai" | "lawyer";
export type Message = { from: string; text: string; time: string; isFile?: boolean };

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

// ─── CHAT ─────────────────────────────────────────────────────────────────────
export function ChatPage() {
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

type DocFile = { name: string; size: string; date: string; type: string; isNew?: boolean };

// ─── CASE ─────────────────────────────────────────────────────────────────────
export function CasePage({ stages, loading }: {
  stages: { title: string; done: boolean; active?: boolean; date: string; desc?: string; icon?: string }[];
  loading: boolean;
}) {
  const [docs, setDocs] = useState<DocFile[]>([
    { name: "Заявление о банкротстве.pdf", size: "1.2 MB", date: "01.11.2024", type: "pdf" },
    { name: "Решение суда.pdf", size: "0.8 MB", date: "15.12.2024", type: "pdf" },
    { name: "Список кредиторов.xlsx", size: "0.3 MB", date: "20.12.2024", type: "xls" },
    { name: "Опись имущества.pdf", size: "0.5 MB", date: "10.01.2025", type: "pdf" },
  ]);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    setTimeout(() => {
      const newDocs: DocFile[] = Array.from(files).map(f => ({
        name: f.name,
        size: f.size > 1024 * 1024 ? `${(f.size / 1024 / 1024).toFixed(1)} MB` : `${Math.round(f.size / 1024)} KB`,
        date: new Date().toLocaleDateString("ru-RU"),
        type: f.name.split(".").pop()?.toLowerCase() ?? "file",
        isNew: true,
      }));
      setDocs(prev => [...newDocs, ...prev]);
      setUploading(false);
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 3000);
    }, 1200);
    e.target.value = "";
  }

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
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-foreground flex items-center gap-2">
            <Icon name="FolderOpen" size={18} className="text-primary" />
            Документы по делу
          </h2>
          <label className="cursor-pointer">
            <input
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.xlsx,.xls,.jpg,.jpeg,.png"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="flex items-center gap-1.5 text-xs font-semibold text-white gradient-blue-purple px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity">
              {uploading ? (
                <div className="w-3 h-3 border border-white/50 border-t-white rounded-full animate-spin" />
              ) : (
                <Icon name="Upload" size={13} className="text-white" />
              )}
              {uploading ? "Загрузка..." : "Добавить"}
            </div>
          </label>
        </div>

        {uploadSuccess && (
          <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-xl px-3 py-2 mb-3">
            <Icon name="CheckCircle" size={15} className="text-green-400 flex-shrink-0" />
            <p className="text-xs text-green-400">Документы успешно добавлены</p>
          </div>
        )}

        <div className="space-y-2">
          {docs.map((d, i) => (
            <div key={i} className={`flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer group ${d.isNew ? "border border-primary/20 bg-primary/5" : ""}`}>
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                d.type === "pdf" ? "bg-red-500/15" :
                d.type === "xls" || d.type === "xlsx" ? "bg-green-500/15" :
                d.type === "jpg" || d.type === "jpeg" || d.type === "png" ? "bg-blue-500/15" :
                "bg-muted"
              }`}>
                <Icon
                  name={d.type === "jpg" || d.type === "jpeg" || d.type === "png" ? "Image" : "FileText"}
                  size={18}
                  className={
                    d.type === "pdf" ? "text-red-400" :
                    d.type === "xls" || d.type === "xlsx" ? "text-green-400" :
                    d.type === "jpg" || d.type === "jpeg" || d.type === "png" ? "text-blue-400" :
                    "text-muted-foreground"
                  }
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">{d.name}</p>
                  {d.isNew && <span className="text-[10px] text-primary bg-primary/10 rounded px-1.5 py-0.5 flex-shrink-0">Новый</span>}
                </div>
                <p className="text-xs text-muted-foreground">{d.size} · {d.date}</p>
              </div>
              <Icon name="Download" size={16} className="text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
            </div>
          ))}
        </div>

        <p className="text-xs text-muted-foreground mt-3 text-center">
          Поддерживаются: PDF, Word, Excel, изображения
        </p>
      </div>
    </div>
  );
}