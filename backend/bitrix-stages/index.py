"""
Получает стадии сделки из Битрикс24 по ID сделки.
Используется для отображения текущей стадии дела клиента.
"""
import os
import json
import urllib.request
import urllib.parse


STAGE_MAP = {
    "NEW":                  {"title": "Новая заявка",              "order": 1},
    "PREPARATION":          {"title": "Подготовка документов",     "order": 2},
    "COURT_FILING":         {"title": "Подача заявления в суд",    "order": 3},
    "COURT_HEARING":        {"title": "Судебное заседание",        "order": 4},
    "BANKRUPTCY_GRANTED":   {"title": "Признание банкротом",       "order": 5},
    "PROPERTY_REALIZATION": {"title": "Реализация имущества",      "order": 6},
    "CREDITOR_SETTLEMENT":  {"title": "Расчёт с кредиторами",      "order": 7},
    "COMPLETED":            {"title": "Завершено. Долги списаны",  "order": 8},
    "WON":                  {"title": "Завершено. Долги списаны",  "order": 8},
    "LOSE":                 {"title": "Дело закрыто",              "order": 9},
}

ALL_STAGES = [
    {"id": "COURT_FILING",         "title": "Подача заявления в суд"},
    {"id": "BANKRUPTCY_GRANTED",   "title": "Признание банкротом"},
    {"id": "PROPERTY_REALIZATION", "title": "Реализация имущества"},
    {"id": "CREDITOR_SETTLEMENT",  "title": "Расчёт с кредиторами"},
    {"id": "COMPLETED",            "title": "Завершение. Долги списаны"},
]

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-User-Id",
}


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    params = event.get("queryStringParameters") or {}
    deal_id = params.get("deal_id", "")

    webhook_url = os.environ.get("BITRIX24_WEBHOOK_URL", "")

    if not webhook_url:
        return {
            "statusCode": 200,
            "headers": {**CORS, "Content-Type": "application/json"},
            "body": json.dumps({
                "success": True,
                "demo": True,
                "current_stage": {
                    "id": "PROPERTY_REALIZATION",
                    "title": "Реализация имущества",
                    "order": 6,
                },
                "stages": _build_stages_list("PROPERTY_REALIZATION"),
            }, ensure_ascii=False),
        }

    if not deal_id:
        return {
            "statusCode": 400,
            "headers": {**CORS, "Content-Type": "application/json"},
            "body": json.dumps({"success": False, "error": "deal_id обязателен"}, ensure_ascii=False),
        }

    url = f"{webhook_url.rstrip('/')}/crm.deal.get?id={urllib.parse.quote(str(deal_id))}"
    req = urllib.request.Request(url)
    with urllib.request.urlopen(req, timeout=10) as resp:
        data = json.loads(resp.read().decode())

    deal = data.get("result", {})
    stage_id = deal.get("STAGE_ID", "NEW")
    stage_info = STAGE_MAP.get(stage_id, {"title": stage_id, "order": 0})

    return {
        "statusCode": 200,
        "headers": {**CORS, "Content-Type": "application/json"},
        "body": json.dumps({
            "success": True,
            "demo": False,
            "deal_id": deal_id,
            "current_stage": {
                "id": stage_id,
                "title": stage_info["title"],
                "order": stage_info["order"],
            },
            "stages": _build_stages_list(stage_id),
        }, ensure_ascii=False),
    }


def _build_stages_list(current_stage_id: str) -> list:
    current_order = STAGE_MAP.get(current_stage_id, {}).get("order", 0)
    result = []
    for s in ALL_STAGES:
        stage_order = STAGE_MAP.get(s["id"], {}).get("order", 0)
        result.append({
            "id": s["id"],
            "title": s["title"],
            "done": stage_order < current_order,
            "active": s["id"] == current_stage_id,
        })
    return result
