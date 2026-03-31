"""
Управление рефералами клиента.
Возвращает список рефералов с актуальными статусами из Битрикс24.
Бонус 10 000 ₽ начисляется автоматически при переходе реферала на стадию CONTRACT_SIGNED в Битрикс24.
"""
import os
import json
import urllib.request
import urllib.parse

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-User-Id",
}

BONUS_AMOUNT = 10000

# Маппинг стадий Битрикс24 → статус реферала
REFERRAL_STAGE_MAP = {
    "NEW":              "thinking",
    "PREPARATION":      "thinking",
    "CONTRACT_SIGNED":  "contract_signed",
    "WON":              "contract_signed",
    "COMPLETED":        "contract_signed",
    "NOT_ELIGIBLE":     "not_eligible",
    "LOSE":             "declined",
}

# Демо-данные (используются когда BITRIX24_WEBHOOK_URL не задан)
DEMO_REFERRALS = [
    {
        "id": "ref_001",
        "name": "Дмитрий С.",
        "date": "15.01.2025",
        "bitrix_stage": "CONTRACT_SIGNED",
    },
    {
        "id": "ref_002",
        "name": "Мария К.",
        "date": "01.03.2025",
        "bitrix_stage": "NEW",
    },
    {
        "id": "ref_003",
        "name": "Андрей П.",
        "date": "20.02.2025",
        "bitrix_stage": "LOSE",
    },
    {
        "id": "ref_004",
        "name": "Светлана Р.",
        "date": "05.03.2025",
        "bitrix_stage": "NOT_ELIGIBLE",
    },
]


def _map_stage_to_status(bitrix_stage: str) -> str:
    return REFERRAL_STAGE_MAP.get(bitrix_stage, "thinking")


def _build_referral(raw: dict) -> dict:
    stage = raw.get("bitrix_stage", "NEW")
    status = _map_stage_to_status(stage)
    return {
        "id": raw.get("id", ""),
        "name": raw.get("name", ""),
        "date": raw.get("date", ""),
        "status": status,
        "earned": BONUS_AMOUNT if status == "contract_signed" else 0,
        "bitrix_stage": stage,
    }


def _fetch_referrals_from_bitrix(webhook_url: str, referrer_id: str) -> list:
    """Запрашивает сделки-рефералы из Битрикс24 по UF_REFERRER_ID."""
    encoded_id = urllib.parse.quote(str(referrer_id))
    url = (
        f"{webhook_url.rstrip('/')}/crm.deal.list"
        f"?filter[UF_REFERRER_ID]={encoded_id}"
        f"&select[]=ID&select[]=TITLE&select[]=STAGE_ID&select[]=DATE_CREATE&select[]=CONTACT_ID"
    )
    req = urllib.request.Request(url)
    with urllib.request.urlopen(req, timeout=10) as resp:
        data = json.loads(resp.read().decode())

    deals = data.get("result", [])
    result = []
    for deal in deals:
        stage = deal.get("STAGE_ID", "NEW")
        name = deal.get("TITLE", f"Клиент #{deal.get('ID', '')}")
        date_raw = deal.get("DATE_CREATE", "")
        date = date_raw[:10].replace("-", ".") if date_raw else "—"
        # Переставляем дату из YYYY.MM.DD в DD.MM.YYYY
        parts = date.split(".")
        if len(parts) == 3 and len(parts[0]) == 4:
            date = f"{parts[2]}.{parts[1]}.{parts[0]}"
        result.append({
            "id": str(deal.get("ID", "")),
            "name": name,
            "date": date,
            "bitrix_stage": stage,
        })
    return result


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    params = event.get("queryStringParameters") or {}
    referrer_id = params.get("referrer_id", "")

    webhook_url = os.environ.get("BITRIX24_WEBHOOK_URL", "")

    if not webhook_url:
        raw_list = DEMO_REFERRALS
        demo = True
    else:
        if not referrer_id:
            return {
                "statusCode": 400,
                "headers": {**CORS, "Content-Type": "application/json"},
                "body": json.dumps({"success": False, "error": "referrer_id обязателен"}, ensure_ascii=False),
            }
        raw_list = _fetch_referrals_from_bitrix(webhook_url, referrer_id)
        demo = False

    referrals = [_build_referral(r) for r in raw_list]
    total_earned = sum(r["earned"] for r in referrals)
    contract_count = sum(1 for r in referrals if r["status"] == "contract_signed")

    return {
        "statusCode": 200,
        "headers": {**CORS, "Content-Type": "application/json"},
        "body": json.dumps({
            "success": True,
            "demo": demo,
            "referrals": referrals,
            "summary": {
                "total": len(referrals),
                "contract_signed": contract_count,
                "total_earned": total_earned,
                "bonus_per_referral": BONUS_AMOUNT,
            },
        }, ensure_ascii=False),
    }
