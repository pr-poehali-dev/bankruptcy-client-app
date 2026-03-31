/**
 * Центральный API-клиент платформы.
 * Все URL берутся из func2url.json (автогенерация при деплое).
 */

export const API = {
  auth:         "https://functions.poehali.dev/58401716-d4f7-46b8-8315-fd4aa2d6b444",
  companyAdmin: "https://functions.poehali.dev/e6d8a27b-cfe8-41e0-9ae4-73e77b651c9a",
  superAdmin:   "https://functions.poehali.dev/e1b14b1a-9ea8-4fce-8ec2-333399ffa424",
  bitrix:       "https://functions.poehali.dev/d8cffbef-28c9-4cbc-9574-d1dabb3929f2",
  referrals:    "https://functions.poehali.dev/1ce06022-c1f9-481a-a21e-f5d7c0f1de78",
};

function getToken(): string {
  return localStorage.getItem("session_token") || "";
}

function authHeaders(): Record<string, string> {
  const t = getToken();
  return t ? { "X-Session-Token": t } : {};
}

export async function apiGet(url: string, params: Record<string, string> = {}) {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${url}/?${qs}`, { headers: authHeaders() });
  return res.json();
}

export async function apiPost(url: string, action: string, body: unknown) {
  const res = await fetch(`${url}/?action=${action}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(body),
  });
  return res.json();
}

export async function apiPut(url: string, action: string, body: unknown) {
  const res = await fetch(`${url}/?action=${action}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(body),
  });
  return res.json();
}

export type SessionRole = "client" | "company" | "superadmin";

export interface SessionProfile {
  id?: number;
  name: string;
  phone: string;
  company_id?: number;
  deal_id?: string;
  lawyer_name?: string;
  tariff?: string;
  brand?: {
    name: string;
    color: string;
    accent: string;
    logo: string;
    company_name: string;
  };
  brand_name?: string;
  brand_color?: string;
  brand_accent?: string;
  brand_logo?: string;
  subscription?: {
    plan: string;
    status: string;
    clients_limit: number;
    expires_at: string;
  };
}

export async function login(phone: string, password: string, role: SessionRole, code?: string) {
  return apiPost(API.auth, "login", { phone, password, role, code });
}

export async function logout() {
  return apiPost(API.auth, "logout", {});
}

export async function getMe(): Promise<{ success: boolean; role: SessionRole; profile: SessionProfile } | null> {
  const token = getToken();
  if (!token) return null;
  const res = await apiGet(API.auth, { action: "me" });
  return res.success ? res : null;
}

export function saveSession(token: string, role: SessionRole, profile: SessionProfile) {
  localStorage.setItem("session_token", token);
  localStorage.setItem("session_role", role);
  localStorage.setItem("session_profile", JSON.stringify(profile));
}

export function clearSession() {
  localStorage.removeItem("session_token");
  localStorage.removeItem("session_role");
  localStorage.removeItem("session_profile");
}

export function getStoredRole(): SessionRole | null {
  return (localStorage.getItem("session_role") as SessionRole) || null;
}

export function getStoredProfile(): SessionProfile | null {
  const p = localStorage.getItem("session_profile");
  return p ? JSON.parse(p) : null;
}
