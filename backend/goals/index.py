"""
Цели и настройки пользователя (требует X-Session-Id).
GET  /goal         — получить цель
POST /goal         — создать/обновить {name, target, current}
POST /goal/fund    — пополнить цель {amount} (спишет с баланса как transfer-транзакция)
GET  /settings     — получить настройки
POST /settings     — сохранить {currency, theme}
"""

import json
import os
import psycopg2

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "t_p83865015_expense_tracker_spa")

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Session-Id",
}


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def ok(data, status=200):
    return {"statusCode": status, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps(data, default=str)}


def err(msg, status=400):
    return {"statusCode": status, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps({"error": msg})}


def get_user_id(conn, session_id: str):
    cur = conn.cursor()
    cur.execute(
        f"SELECT user_id FROM {SCHEMA}.sessions WHERE id = %s AND expires_at > NOW()",
        (session_id,)
    )
    row = cur.fetchone()
    cur.close()
    return row[0] if row else None


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    path = event.get("path", "/")
    headers = event.get("headers") or {}
    session_id = headers.get("X-Session-Id", "")

    body = {}
    if event.get("body"):
        try:
            body = json.loads(event["body"])
        except Exception:
            pass

    conn = get_conn()
    try:
        user_id = get_user_id(conn, session_id)
        if not user_id:
            return err("Не авторизован", 401)

        # GET /goal
        if method == "GET" and path.endswith("/goal"):
            cur = conn.cursor()
            cur.execute(f"SELECT name, target, current FROM {SCHEMA}.goals WHERE user_id = %s", (user_id,))
            row = cur.fetchone()
            cur.close()
            if not row:
                return ok({"goal": None})
            return ok({"goal": {"name": row[0], "target": float(row[1]), "current": float(row[2])}})

        # POST /goal
        if method == "POST" and path.endswith("/goal"):
            name = body.get("name", "Моя цель")
            target = float(body.get("target", 0))
            current = float(body.get("current", 0))

            cur = conn.cursor()
            cur.execute(f"SELECT id FROM {SCHEMA}.goals WHERE user_id = %s", (user_id,))
            exists = cur.fetchone()
            if exists:
                cur.execute(
                    f"UPDATE {SCHEMA}.goals SET name=%s, target=%s, current=%s, updated_at=NOW() WHERE user_id=%s",
                    (name, target, current, user_id)
                )
            else:
                cur.execute(
                    f"INSERT INTO {SCHEMA}.goals (user_id, name, target, current) VALUES (%s, %s, %s, %s)",
                    (user_id, name, target, current)
                )
            conn.commit()
            cur.close()
            return ok({"ok": True, "goal": {"name": name, "target": target, "current": current}})

        # POST /goal/fund  — пополнение цели
        if method == "POST" and path.endswith("/goal/fund"):
            amount = float(body.get("amount", 0))
            if amount <= 0:
                return err("Сумма должна быть больше нуля")

            cur = conn.cursor()
            cur.execute(f"SELECT id, current FROM {SCHEMA}.goals WHERE user_id = %s", (user_id,))
            row = cur.fetchone()
            if not row:
                cur.close()
                return err("Сначала создайте цель")

            goal_id, current = row
            new_current = float(current) + amount
            cur.execute(
                f"UPDATE {SCHEMA}.goals SET current=%s, updated_at=NOW() WHERE user_id=%s",
                (new_current, user_id)
            )
            # Записываем нейтральную транзакцию-перевод
            cur.execute(
                f"INSERT INTO {SCHEMA}.transactions (user_id, amount, category, comment, type) "
                f"VALUES (%s, %s, %s, %s, %s) RETURNING id, date",
                (user_id, amount, "Перевод", "Перевод между своими счетами", "transfer")
            )
            tx_row = cur.fetchone()
            conn.commit()
            cur.close()
            return ok({
                "ok": True,
                "new_current": new_current,
                "transaction": {"id": tx_row[0], "date": tx_row[1].isoformat(), "amount": amount, "category": "Перевод", "comment": "Перевод между своими счетами", "type": "transfer"}
            })

        # GET /settings
        if method == "GET" and path.endswith("/settings"):
            cur = conn.cursor()
            cur.execute(f"SELECT currency, theme FROM {SCHEMA}.user_settings WHERE user_id = %s", (user_id,))
            row = cur.fetchone()
            cur.close()
            if not row:
                return ok({"settings": {"currency": "RUB", "theme": "dark"}})
            return ok({"settings": {"currency": row[0], "theme": row[1]}})

        # POST /settings
        if method == "POST" and path.endswith("/settings"):
            currency = body.get("currency", "RUB")
            theme = body.get("theme", "dark")

            cur = conn.cursor()
            cur.execute(f"SELECT user_id FROM {SCHEMA}.user_settings WHERE user_id = %s", (user_id,))
            exists = cur.fetchone()
            if exists:
                cur.execute(
                    f"UPDATE {SCHEMA}.user_settings SET currency=%s, theme=%s WHERE user_id=%s",
                    (currency, theme, user_id)
                )
            else:
                cur.execute(
                    f"INSERT INTO {SCHEMA}.user_settings (user_id, currency, theme) VALUES (%s, %s, %s)",
                    (user_id, currency, theme)
                )
            conn.commit()
            cur.close()
            return ok({"ok": True})

        return err("Not found", 404)
    finally:
        conn.close()
