"""
API кабинета юридической компании.
Все запросы требуют X-Session-Token с ролью company.
GET  /stats    — статистика (клиенты, активные, рефералы)
GET  /clients  — список клиентов
POST /clients  — добавить клиента
PUT  /clients  — обновить клиента
GET  /brand    — настройки бренда
PUT  /brand    — сохранить настройки бренда
"""
import os
import json
import psycopg2

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Session-Token",
}

SCHEMA = "t_p32290594_bankruptcy_client_ap"


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def json_response(data: dict, status: int = 200) -> dict:
    return {
        "statusCode": status,
        "headers": {**CORS, "Content-Type": "application/json"},
        "body": json.dumps(data, ensure_ascii=False, default=str),
    }


def auth_company(cur, token: str):
    """Проверяет токен и возвращает company_id или None."""
    if not token:
        return None
    cur.execute(
        f"SELECT subject_id FROM {SCHEMA}.sessions "
        f"WHERE token = %s AND role = 'company' AND expires_at > NOW()",
        (token,)
    )
    row = cur.fetchone()
    return row[0] if row else None


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    params_qs = event.get("queryStringParameters") or {}
    action = params_qs.get("action", "")
    token = (event.get("headers") or {}).get("X-Session-Token", "")
    body = {}
    if event.get("body"):
        body = json.loads(event["body"])
    params = params_qs

    conn = get_conn()
    cur = conn.cursor()
    company_id = auth_company(cur, token)
    if not company_id:
        conn.close()
        return json_response({"success": False, "error": "Нет доступа"}, 401)

    # ── GET ?action=stats ──────────────────────────────────────────────────
    if method == "GET" and action == "stats":
        cur.execute(
            f"SELECT COUNT(*) FROM {SCHEMA}.clients WHERE company_id = %s", (company_id,)
        )
        total = cur.fetchone()[0]
        cur.execute(
            f"SELECT COUNT(*) FROM {SCHEMA}.clients WHERE company_id = %s AND is_active = TRUE",
            (company_id,)
        )
        active = cur.fetchone()[0]
        cur.execute(
            f"SELECT COUNT(*) FROM {SCHEMA}.clients "
            f"WHERE company_id = %s AND created_at >= NOW() - INTERVAL '30 days'",
            (company_id,)
        )
        new_month = cur.fetchone()[0]
        # Подписка
        cur.execute(
            f"SELECT plan, status, clients_limit, expires_at "
            f"FROM {SCHEMA}.subscriptions WHERE company_id = %s ORDER BY id DESC LIMIT 1",
            (company_id,)
        )
        sub = cur.fetchone()
        conn.close()
        return json_response({
            "success": True,
            "stats": {
                "total_clients": total,
                "active_clients": active,
                "new_this_month": new_month,
                "inactive_clients": total - active,
            },
            "subscription": {
                "plan": sub[0], "status": sub[1],
                "clients_limit": sub[2], "expires_at": str(sub[3]),
                "used": total,
                "available": max(0, sub[2] - total),
            } if sub else None,
        })

    # ── GET ?action=clients ────────────────────────────────────────────────
    if method == "GET" and action == "clients":
        search = params.get("search", "")
        limit = int(params.get("limit", 50))
        offset = int(params.get("offset", 0))
        where = f"WHERE company_id = %s"
        args = [company_id]
        if search:
            where += " AND (name ILIKE %s OR phone ILIKE %s)"
            args += [f"%{search}%", f"%{search}%"]
        cur.execute(
            f"SELECT id, name, phone, deal_id, lawyer_name, tariff, is_active, created_at "
            f"FROM {SCHEMA}.clients {where} ORDER BY created_at DESC LIMIT %s OFFSET %s",
            args + [limit, offset]
        )
        rows = cur.fetchall()
        cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.clients {where}", args)
        total = cur.fetchone()[0]
        conn.close()
        clients = [
            {
                "id": r[0], "name": r[1], "phone": r[2],
                "deal_id": r[3], "lawyer_name": r[4],
                "tariff": r[5], "is_active": r[6], "created_at": str(r[7]),
            }
            for r in rows
        ]
        return json_response({"success": True, "clients": clients, "total": total})

    # ── POST ?action=clients ───────────────────────────────────────────────
    if method == "POST" and action == "clients":
        phone = body.get("phone", "").strip()
        name = body.get("name", "").strip()
        if not phone or not name:
            conn.close()
            return json_response({"success": False, "error": "Телефон и имя обязательны"}, 400)
        # Проверка лимита
        cur.execute(
            f"SELECT COUNT(*), s.clients_limit FROM {SCHEMA}.clients c "
            f"JOIN {SCHEMA}.subscriptions s ON s.company_id = c.company_id "
            f"WHERE c.company_id = %s GROUP BY s.clients_limit ORDER BY s.id DESC LIMIT 1",
            (company_id,)
        )
        row = cur.fetchone()
        if row and row[0] >= row[1]:
            conn.close()
            return json_response({"success": False, "error": "Достигнут лимит клиентов по тарифу"}, 403)
        cur.execute(
            f"INSERT INTO {SCHEMA}.clients (company_id, phone, name, deal_id, lawyer_name, tariff) "
            f"VALUES (%s, %s, %s, %s, %s, %s) RETURNING id",
            (company_id, phone, name, body.get("deal_id"), body.get("lawyer_name"), body.get("tariff", "Стандарт"))
        )
        client_id = cur.fetchone()[0]
        conn.commit()
        conn.close()
        return json_response({"success": True, "client_id": client_id})

    # ── PUT ?action=clients ────────────────────────────────────────────────
    if method == "PUT" and action == "clients":
        client_id = body.get("id")
        if not client_id:
            conn.close()
            return json_response({"success": False, "error": "id обязателен"}, 400)
        fields = []
        vals = []
        for key in ("name", "phone", "deal_id", "lawyer_name", "tariff", "is_active"):
            if key in body:
                fields.append(f"{key} = %s")
                vals.append(body[key])
        if not fields:
            conn.close()
            return json_response({"success": False, "error": "Нет полей для обновления"}, 400)
        vals += [client_id, company_id]
        cur.execute(
            f"UPDATE {SCHEMA}.clients SET {', '.join(fields)} "
            f"WHERE id = %s AND company_id = %s",
            vals
        )
        conn.commit()
        conn.close()
        return json_response({"success": True})

    # ── GET ?action=brand ──────────────────────────────────────────────────
    if method == "GET" and action == "brand":
        cur.execute(
            f"SELECT brand_name, brand_logo, brand_color, brand_accent, name, email, website "
            f"FROM {SCHEMA}.companies WHERE id = %s",
            (company_id,)
        )
        row = cur.fetchone()
        conn.close()
        if not row:
            return json_response({"success": False, "error": "Компания не найдена"}, 404)
        return json_response({
            "success": True,
            "brand": {
                "brand_name": row[0], "brand_logo": row[1],
                "brand_color": row[2], "brand_accent": row[3],
                "name": row[4], "email": row[5], "website": row[6],
            },
        })

    # ── PUT ?action=brand ──────────────────────────────────────────────────
    if method == "PUT" and action == "brand":
        fields = []
        vals = []
        for key in ("brand_name", "brand_logo", "brand_color", "brand_accent", "email", "website"):
            if key in body:
                fields.append(f"{key} = %s")
                vals.append(body[key])
        if fields:
            vals.append(company_id)
            cur.execute(
                f"UPDATE {SCHEMA}.companies SET {', '.join(fields)} WHERE id = %s", vals
            )
            conn.commit()
        conn.close()
        return json_response({"success": True})

    conn.close()
    return json_response({"success": False, "error": "Not found"}, 404)