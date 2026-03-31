"""
API супер-администратора платформы.
Все запросы требуют X-Session-Token с ролью superadmin.
GET  ?action=stats      — общая статистика платформы
GET  ?action=companies  — список всех компаний
POST ?action=companies  — создать компанию
PUT  ?action=companies  — обновить компанию / подписку
GET  ?action=clients    — все клиенты (с фильтром по company_id)
"""
import os
import json
import hashlib
import psycopg2

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Session-Token",
}

SCHEMA = "t_p32290594_bankruptcy_client_ap"

PLANS = {
    "trial": {"label": "Пробный", "clients_limit": 5,   "days": 14},
    "basic": {"label": "Базовый", "clients_limit": 50,  "days": 30},
    "pro":   {"label": "Про",     "clients_limit": 500, "days": 30},
}


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def hash_password(p: str) -> str:
    return hashlib.sha256(p.encode()).hexdigest()


def json_response(data: dict, status: int = 200) -> dict:
    return {
        "statusCode": status,
        "headers": {**CORS, "Content-Type": "application/json"},
        "body": json.dumps(data, ensure_ascii=False, default=str),
    }


def auth_super(cur, token: str) -> bool:
    if not token:
        return False
    cur.execute(
        f"SELECT id FROM {SCHEMA}.sessions "
        f"WHERE token = %s AND role = 'superadmin' AND expires_at > NOW()",
        (token,)
    )
    return cur.fetchone() is not None


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    token = (event.get("headers") or {}).get("X-Session-Token", "")
    body = {}
    if event.get("body"):
        body = json.loads(event["body"])
    params = event.get("queryStringParameters") or {}
    action = params.get("action", "")

    conn = get_conn()
    cur = conn.cursor()
    if not auth_super(cur, token):
        conn.close()
        return json_response({"success": False, "error": "Нет доступа"}, 401)

    # ── GET ?action=stats ──────────────────────────────────────────────────
    if method == "GET" and action == "stats":
        cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.companies WHERE is_active = TRUE")
        total_companies = cur.fetchone()[0]
        cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.clients WHERE is_active = TRUE")
        total_clients = cur.fetchone()[0]
        cur.execute(
            f"SELECT COUNT(*) FROM {SCHEMA}.subscriptions "
            f"WHERE status = 'active' AND expires_at > NOW()"
        )
        active_subs = cur.fetchone()[0]
        cur.execute(
            f"SELECT COUNT(*) FROM {SCHEMA}.companies "
            f"WHERE created_at >= NOW() - INTERVAL '30 days'"
        )
        new_companies = cur.fetchone()[0]
        cur.execute(
            f"SELECT plan, COUNT(*) FROM {SCHEMA}.subscriptions "
            f"WHERE status = 'active' GROUP BY plan"
        )
        by_plan = {row[0]: row[1] for row in cur.fetchall()}
        conn.close()
        return json_response({
            "success": True,
            "stats": {
                "total_companies": total_companies,
                "total_clients": total_clients,
                "active_subscriptions": active_subs,
                "new_companies_month": new_companies,
                "by_plan": by_plan,
            },
        })

    # ── GET ?action=companies ──────────────────────────────────────────────
    if method == "GET" and action == "companies":
        search = params.get("search", "")
        limit = int(params.get("limit", 50))
        offset = int(params.get("offset", 0))
        where = "WHERE 1=1"
        args = []
        if search:
            where += " AND (co.name ILIKE %s OR co.phone ILIKE %s)"
            args += [f"%{search}%", f"%{search}%"]
        cur.execute(
            f"""SELECT co.id, co.name, co.phone, co.is_active, co.created_at,
                       s.plan, s.status, s.clients_limit, s.expires_at,
                       COUNT(cl.id) as client_count
                FROM {SCHEMA}.companies co
                LEFT JOIN {SCHEMA}.subscriptions s ON s.company_id = co.id
                LEFT JOIN {SCHEMA}.clients cl ON cl.company_id = co.id
                {where}
                GROUP BY co.id, co.name, co.phone, co.is_active, co.created_at,
                         s.plan, s.status, s.clients_limit, s.expires_at
                ORDER BY co.created_at DESC LIMIT %s OFFSET %s""",
            args + [limit, offset]
        )
        rows = cur.fetchall()
        cur.execute(
            f"SELECT COUNT(*) FROM {SCHEMA}.companies co {where.replace('co.name', 'co.name').replace('co.phone', 'co.phone')}",
            args
        )
        total = cur.fetchone()[0]
        conn.close()
        companies = [
            {
                "id": r[0], "name": r[1], "phone": r[2],
                "is_active": r[3], "created_at": str(r[4]),
                "subscription": {
                    "plan": r[5], "status": r[6],
                    "clients_limit": r[7], "expires_at": str(r[8]),
                } if r[5] else None,
                "client_count": r[9],
            }
            for r in rows
        ]
        return json_response({"success": True, "companies": companies, "total": total})

    # ── POST ?action=companies ─────────────────────────────────────────────
    if method == "POST" and action == "companies":
        phone = body.get("phone", "").strip()
        name = body.get("name", "").strip()
        password = body.get("password", "").strip()
        plan = body.get("plan", "trial")
        if not phone or not name or not password:
            conn.close()
            return json_response({"success": False, "error": "Телефон, название и пароль обязательны"}, 400)
        cur.execute(
            f"INSERT INTO {SCHEMA}.companies (name, phone, password_hash, brand_name) "
            f"VALUES (%s, %s, %s, %s) RETURNING id",
            (name, phone, hash_password(password), name)
        )
        company_id = cur.fetchone()[0]
        plan_cfg = PLANS.get(plan, PLANS["trial"])
        days = plan_cfg["days"]
        cur.execute(
            f"INSERT INTO {SCHEMA}.subscriptions "
            f"(company_id, plan, status, clients_limit, expires_at) "
            f"VALUES (%s, %s, 'active', %s, NOW() + INTERVAL '{days} days')",
            (company_id, plan, plan_cfg["clients_limit"])
        )
        conn.commit()
        conn.close()
        return json_response({"success": True, "company_id": company_id})

    # ── PUT ?action=companies ──────────────────────────────────────────────
    if method == "PUT" and action == "companies":
        company_id = body.get("id")
        if not company_id:
            conn.close()
            return json_response({"success": False, "error": "id обязателен"}, 400)
        co_fields, co_vals = [], []
        for key in ("name", "is_active"):
            if key in body:
                co_fields.append(f"{key} = %s")
                co_vals.append(body[key])
        if co_fields:
            co_vals.append(company_id)
            cur.execute(
                f"UPDATE {SCHEMA}.companies SET {', '.join(co_fields)} WHERE id = %s", co_vals
            )
        if "plan" in body or "subscription_status" in body or "clients_limit" in body:
            plan = body.get("plan")
            sub_fields, sub_vals = [], []
            if plan:
                plan_cfg = PLANS.get(plan, PLANS["basic"])
                sub_fields += ["plan = %s", "clients_limit = %s",
                               "expires_at = NOW() + INTERVAL '30 days'"]
                sub_vals += [plan, plan_cfg["clients_limit"]]
            if "subscription_status" in body:
                sub_fields.append("status = %s")
                sub_vals.append(body["subscription_status"])
            if "clients_limit" in body:
                sub_fields.append("clients_limit = %s")
                sub_vals.append(body["clients_limit"])
            if sub_fields:
                sub_vals.append(company_id)
                cur.execute(
                    f"UPDATE {SCHEMA}.subscriptions SET {', '.join(sub_fields)} "
                    f"WHERE company_id = %s",
                    sub_vals
                )
        conn.commit()
        conn.close()
        return json_response({"success": True})

    # ── GET ?action=clients ────────────────────────────────────────────────
    if method == "GET" and action == "clients":
        company_id = params.get("company_id")
        limit = int(params.get("limit", 100))
        if company_id:
            cur.execute(
                f"""SELECT c.id, c.name, c.phone, c.deal_id, c.is_active, c.created_at,
                           co.name as company_name
                    FROM {SCHEMA}.clients c
                    JOIN {SCHEMA}.companies co ON co.id = c.company_id
                    WHERE c.company_id = %s ORDER BY c.created_at DESC LIMIT %s""",
                [company_id, limit]
            )
        else:
            cur.execute(
                f"""SELECT c.id, c.name, c.phone, c.deal_id, c.is_active, c.created_at,
                           co.name as company_name
                    FROM {SCHEMA}.clients c
                    JOIN {SCHEMA}.companies co ON co.id = c.company_id
                    ORDER BY c.created_at DESC LIMIT %s""",
                [limit]
            )
        rows = cur.fetchall()
        conn.close()
        return json_response({
            "success": True,
            "clients": [
                {
                    "id": r[0], "name": r[1], "phone": r[2],
                    "deal_id": r[3], "is_active": r[4],
                    "created_at": str(r[5]), "company_name": r[6],
                }
                for r in rows
            ],
        })

    conn.close()
    return json_response({"success": False, "error": "Not found"}, 404)
