import { useState } from "react";
import Icon from "@/components/ui/icon";

export type User = {
  phone: string;
  name: string;
};

type Step = "phone" | "code" | "name";

export function AuthPage({ onLogin }: { onLogin: (user: User) => void }) {
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [isNew, setIsNew] = useState(false);

  function formatPhone(val: string) {
    const digits = val.replace(/\D/g, "").slice(0, 11);
    if (digits.length === 0) return "";
    let result = "+7";
    if (digits.length > 1) result += " (" + digits.slice(1, 4);
    if (digits.length >= 4) result += ") " + digits.slice(4, 7);
    if (digits.length >= 7) result += "-" + digits.slice(7, 9);
    if (digits.length >= 9) result += "-" + digits.slice(9, 11);
    return result;
  }

  function handlePhoneChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/\D/g, "");
    setPhone(formatPhone(raw.startsWith("7") ? raw : "7" + raw.replace(/^8/, "")));
    setError("");
  }

  function handleSendCode() {
    const digits = phone.replace(/\D/g, "");
    if (digits.length !== 11) {
      setError("Введите корректный номер телефона");
      return;
    }
    const stored = localStorage.getItem("user_" + digits);
    if (!stored) {
      setIsNew(true);
    }
    setStep("code");
    setError("");
  }

  function handleVerifyCode() {
    if (code.length !== 4) {
      setError("Введите 4-значный код");
      return;
    }
    if (code !== "1234") {
      setError("Неверный код. Попробуйте 1234");
      return;
    }
    const digits = phone.replace(/\D/g, "");
    const stored = localStorage.getItem("user_" + digits);
    if (stored) {
      const user = JSON.parse(stored) as User;
      onLogin(user);
    } else {
      setStep("name");
    }
    setError("");
  }

  function handleSetName() {
    if (name.trim().split(" ").length < 2) {
      setError("Введите фамилию и имя");
      return;
    }
    const digits = phone.replace(/\D/g, "");
    const user: User = { phone, name: name.trim() };
    localStorage.setItem("user_" + digits, JSON.stringify(user));
    onLogin(user);
  }

  const initials = name.trim().split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 font-golos">
      <div className="w-full max-w-sm space-y-8 animate-fade-in-up">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl gradient-blue-purple flex items-center justify-center mx-auto mb-4 glow-blue">
            <Icon name="Scale" size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold font-oswald text-foreground">Клиентский портал</h1>
          <p className="text-muted-foreground text-sm mt-1">Юридическое сопровождение</p>
        </div>

        <div className="glass-card rounded-2xl p-6 space-y-5">
          {step === "phone" && (
            <>
              <div>
                <p className="text-sm font-semibold text-foreground mb-1">Номер телефона</p>
                <p className="text-xs text-muted-foreground mb-3">Введите номер, на который придёт код подтверждения</p>
                <input
                  type="tel"
                  value={phone}
                  onChange={handlePhoneChange}
                  placeholder="+7 (___) ___-__-__"
                  className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-foreground text-base focus:outline-none focus:border-primary/60 transition-colors"
                />
                {error && <p className="text-destructive text-xs mt-2">{error}</p>}
              </div>
              <button
                onClick={handleSendCode}
                className="w-full gradient-blue-purple text-white font-semibold py-3 rounded-xl glow-blue hover:opacity-90 transition-opacity"
              >
                Получить код
              </button>
            </>
          )}

          {step === "code" && (
            <>
              <div>
                <p className="text-sm font-semibold text-foreground mb-1">Код подтверждения</p>
                <p className="text-xs text-muted-foreground mb-3">
                  Отправили на <span className="text-primary">{phone}</span>
                </p>
                <input
                  type="number"
                  value={code}
                  onChange={e => { setCode(e.target.value.slice(0, 4)); setError(""); }}
                  placeholder="1234"
                  maxLength={4}
                  className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-foreground text-2xl text-center tracking-[0.5em] focus:outline-none focus:border-primary/60 transition-colors"
                />
                {error && <p className="text-destructive text-xs mt-2">{error}</p>}
                <p className="text-xs text-muted-foreground mt-2 text-center">Для демо используйте код: 1234</p>
              </div>
              <button
                onClick={handleVerifyCode}
                className="w-full gradient-blue-purple text-white font-semibold py-3 rounded-xl glow-blue hover:opacity-90 transition-opacity"
              >
                Войти
              </button>
              <button
                onClick={() => { setStep("phone"); setCode(""); setError(""); }}
                className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                ← Изменить номер
              </button>
            </>
          )}

          {step === "name" && (
            <>
              <div>
                <p className="text-sm font-semibold text-foreground mb-1">Как вас зовут?</p>
                <p className="text-xs text-muted-foreground mb-3">Введите ФИО для идентификации в системе</p>
                {name.trim() && (
                  <div className="w-16 h-16 rounded-full gradient-blue-purple flex items-center justify-center text-white text-xl font-bold mx-auto mb-4">
                    {initials || "??"}
                  </div>
                )}
                <input
                  type="text"
                  value={name}
                  onChange={e => { setName(e.target.value); setError(""); }}
                  placeholder="Иванов Алексей Игоревич"
                  className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-foreground text-base focus:outline-none focus:border-primary/60 transition-colors"
                />
                {error && <p className="text-destructive text-xs mt-2">{error}</p>}
              </div>
              <button
                onClick={handleSetName}
                className="w-full gradient-blue-purple text-white font-semibold py-3 rounded-xl glow-blue hover:opacity-90 transition-opacity"
              >
                Продолжить
              </button>
            </>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Нажимая «Войти», вы соглашаетесь с{" "}
          <span className="text-primary cursor-pointer hover:underline">политикой конфиденциальности</span>
        </p>
      </div>
    </div>
  );
}
