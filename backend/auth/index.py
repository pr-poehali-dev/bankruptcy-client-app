"""
Универсальная авторизация для всех ролей: client, company, superadmin.
POST /login  — вход по телефону + паролю (или phone + code для клиентов)
POST /logout — выход (удаление сессии)
GET  /me     — проверка токена, возвращает профиль
"""
import os
import json
import hashlib
import secrets
import psycopg2

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Session-Token",
}

SCHEMA = "t_p32290594_bankruptcy_client_ap"


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


def make_token() -> str:
    return secrets.token_hex(32)


def json_response(data: dict, status: int = 200) -> dict:
    return {
        "statusCode": status,
        "headers": {**CORS, "Content-Type": "application/json"},
        "body": json.dumps(data, ensure_ascii=False, default=str),
    }


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    params = event.get("queryStringParameters") or {}
    action = params.get("action", "")
    body = {}
    if event.get("body"):
        body = json.loads(event["body"])

    # ── GET ?action=me — проверка сессии ──────────────────────────────────
    if method == "GET" and action == "me":
        token = (event.get("headers") or {}).get("X-Session-Token", "")
        if not token:
            return json_response({"success": False, "error": "Токен не передан"}, 401)
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            f"SELECT role, subject_id, expires_at FROM {SCHEMA}.sessions "
            f"WHERE token = %s AND expires_at > NOW()",
            (token,)
        )
        row = cur.fetchone()
        if not row:
            conn.close()
            return json_response({"success": False, "error": "Сессия не найдена или истекла"}, 401)
        role, subject_id, expires_at = row
        profile = _get_profile(cur, role, subject_id)
        conn.close()
        return json_response({"success": True, "role": role, "profile": profile})

    # ── POST ?action=login ─────────────────────────────────────────────────
    if method == "POST" and action == "login":
        phone = body.get("phone", "").strip()
        password = body.get("password", "").strip()
        role_hint = body.get("role", "")  # company | superadmin | client

        if not phone:
            return json_response({"success": False, "error": "Телефон обязателен"}, 400)

        conn = get_conn()
        cur = conn.cursor()

        subject_id = None
        role = None
        profile = {}

        # Проверяем суперадмина
        if role_hint in ("superadmin", "") and password:
            cur.execute(
                f"SELECT id, password_hash FROM {SCHEMA}.superadmins WHERE phone = %s",
                (phone,)
            )
            row = cur.fetchone()
            if row and (row[1] == hash_password(password) or row[1] == "CHANGE_ME_AFTER_FIRST_LOGIN"):
                subject_id, role = row[0], "superadmin"
                if row[1] == "CHANGE_ME_AFTER_FIRST_LOGIN":
                    cur.execute(
                        f"UPDATE {SCHEMA}.superadmins SET password_hash = %s WHERE id = %s",
                        (hash_password(password), row[0])
                    )
                    conn.commit()
                profile = {"phone": phone, "name": "Суперадмин"}

        # Проверяем компанию
        if not role and role_hint in ("company", "") and password:
            cur.execute(
                f"SELECT id, name, password_hash, brand_name, brand_color, brand_accent, brand_logo "
                f"FROM {SCHEMA}.companies WHERE phone = %s AND is_active = TRUE",
                (phone,)
            )
            row = cur.fetchone()
            if row and (row[2] == hash_password(password) or row[2] == "CHANGE_ME"):
                subject_id = row[0]
                role = "company"
                if row[2] == "CHANGE_ME":
                    cur.execute(
                        f"UPDATE {SCHEMA}.companies SET password_hash = %s WHERE id = %s",
                        (hash_password(password), row[0])
                    )
                    conn.commit()
                # Получаем подписку
                cur.execute(
                    f"SELECT plan, status, clients_limit, expires_at "
                    f"FROM {SCHEMA}.subscriptions WHERE company_id = %s ORDER BY id DESC LIMIT 1",
                    (row[0],)
                )
                sub = cur.fetchone()
                profile = {
                    "id": row[0],
                    "name": row[1],
                    "phone": phone,
                    "brand_name": row[3] or row[1],
                    "brand_color": row[4],
                    "brand_accent": row[5],
                    "brand_logo": row[6],
                    "subscription": {
                        "plan": sub[0] if sub else "trial",
                        "status": sub[1] if sub else "expired",
                        "clients_limit": sub[2] if sub else 0,
                        "expires_at": str(sub[3]) if sub else None,
                    } if sub else None,
                }

        # Проверяем клиента (вход по телефону — пароль не нужен, SMS-код)
        if not role and role_hint == "client":
            code = body.get("code", "")
            # В демо-режиме любой код 4 символа принимается
            if len(code) == 4:
                cur.execute(
                    f"SELECT c.id, c.name, c.company_id, c.deal_id, c.lawyer_name, c.tariff, "
                    f"co.brand_name, co.brand_color, co.brand_accent, co.brand_logo, co.name as company_name "
                    f"FROM {SCHEMA}.clients c "
                    f"JOIN {SCHEMA}.companies co ON co.id = c.company_id "
                    f"WHERE c.phone = %s AND c.is_active = TRUE",
                    (phone,)
                )
                row = cur.fetchone()
                if row:
                    subject_id = row[0]
                    role = "client"
                    profile = {
                        "id": row[0],
                        "name": row[1],
                        "phone": phone,
                        "company_id": row[2],
                        "deal_id": row[3],
                        "lawyer_name": row[4],
                        "tariff": row[5],
                        "brand": {
                            "name": row[6] or row[10],
                            "color": row[7],
                            "accent": row[8],
                            "logo": row[9],
                            "company_name": row[10],
                        },
                    }
                else:
                    # Клиент не найден — регистрируем по первому запросу
                    conn.close()
                    return json_response({"success": False, "error": "client_not_found"}, 404)

        if not role:
            conn.close()
            return json_response({"success": False, "error": "Неверный телефон или пароль"}, 401)

        # Создаём сессию
        token = make_token()
        cur.execute(
            f"INSERT INTO {SCHEMA}.sessions (token, role, subject_id) VALUES (%s, %s, %s)",
            (token, role, subject_id)
        )
        conn.commit()
        conn.close()
        return json_response({"success": True, "token": token, "role": role, "profile": profile})

    # ── POST ?action=logout ────────────────────────────────────────────────
    if method == "POST" and action == "logout":
        token = (event.get("headers") or {}).get("X-Session-Token", "")
        if token:
            conn = get_conn()
            cur = conn.cursor()
            cur.execute(f"UPDATE {SCHEMA}.sessions SET expires_at = NOW() WHERE token = %s", (token,))
            conn.commit()
            conn.close()
        return json_response({"success": True})

    return json_response({"success": False, "error": "Not found"}, 404)


def _get_profile(cur, role: str, subject_id: int) -> dict:
    if role == "superadmin":
        cur.execute(f"SELECT phone FROM {SCHEMA}.superadmins WHERE id = %s", (subject_id,))
        row = cur.fetchone()
        return {"phone": row[0] if row else "", "name": "Суперадмин"}

    if role == "company":
        cur.execute(
            f"SELECT id, name, phone, brand_name, brand_color, brand_accent, brand_logo "
            f"FROM {SCHEMA}.companies WHERE id = %s",
            (subject_id,)
        )
        row = cur.fetchone()
        if not row:
            return {}
        cur.execute(
            f"SELECT plan, status, clients_limit, expires_at "
            f"FROM {SCHEMA}.subscriptions WHERE company_id = %s ORDER BY id DESC LIMIT 1",
            (subject_id,)
        )
        sub = cur.fetchone()
        return {
            "id": row[0], "name": row[1], "phone": row[2],
            "brand_name": row[3] or row[1],
            "brand_color": row[4], "brand_accent": row[5], "brand_logo": row[6],
            "subscription": {
                "plan": sub[0], "status": sub[1],
                "clients_limit": sub[2], "expires_at": str(sub[3]),
            } if sub else None,
        }

    if role == "client":
        cur.execute(
            f"SELECT c.id, c.name, c.phone, c.company_id, c.deal_id, c.lawyer_name, c.tariff, "
            f"co.brand_name, co.brand_color, co.brand_accent, co.brand_logo, co.name "
            f"FROM {SCHEMA}.clients c JOIN {SCHEMA}.companies co ON co.id = c.company_id "
            f"WHERE c.id = %s",
            (subject_id,)
        )
        row = cur.fetchone()
        if not row:
            return {}
        return {
            "id": row[0], "name": row[1], "phone": row[2],
            "company_id": row[3], "deal_id": row[4],
            "lawyer_name": row[5], "tariff": row[6],
            "brand": {
                "name": row[7] or row[11], "color": row[8],
                "accent": row[9], "logo": row[10], "company_name": row[11],
            },
        }
    return {}