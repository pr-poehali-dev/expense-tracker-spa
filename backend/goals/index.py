"""
Цели и настройки пользователя.
POST body {action: "get_goal"}                               + Authorization
POST body {action: "save_goal", name, target, current}       + Authorization
POST body {action: "fund_goal", amount}                      + Authorization
POST body {action: "get_settings"}                           + Authorization
POST body {action: "save_settings", currency, theme}         + Authorization
"""

import json
import os
import psycopg2

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "t_p83865015_expense_tracker_spa")

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
}


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def ok(data, status=200):
    return {"statusCode": status, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps(data, default=str, ensure_ascii=False)}


def err(msg, status=400):
    return {"statusCode": status, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps({"error": msg}, ensure_ascii=False)}


def get_user_id(conn, event: dict):
    headers = event.get("headers") or {}
    auth = headers.get("Authorization") or headers.get("X-Authorization") or ""
    session_id = auth[7:] if auth.startswith("Bearer ") else auth
    if not session_id:
        return None
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

    body = {}
    raw_body = event.get("body") or ""
    if raw_body:
        body = json.loads(raw_body)

    conn = get_conn()
    try:
        user_id = get_user_id(conn, event)
        if not user_id:
            return err("Не авторизован", 401)

        action = body.get("action") or ""

        # get_goal
        if action == "get_goal":
            cur = conn.cursor()
            cur.execute(f"SELECT name, target, current FROM {SCHEMA}.goals WHERE user_id = %s", (user_id,))
            row = cur.fetchone()
            cur.close()
            if not row:
                return ok({"goal": None})
            return ok({"goal": {"name": row[0], "target": float(row[1]), "current": float(row[2])}})

        # save_goal
        if action == "save_goal":
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

        # fund_goal
        if action == "fund_goal":
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
                "transaction": {
                    "id": tx_row[0],
                    "date": tx_row[1].isoformat(),
                    "amount": amount,
                    "category": "Перевод",
                    "comment": "Перевод между своими счетами",
                    "type": "transfer"
                }
            })

        # withdraw_goal
        if action == "withdraw_goal":
            amount = float(body.get("amount", 0))
            if amount <= 0:
                return err("Сумма должна быть больше нуля")

            cur = conn.cursor()
            cur.execute(f"SELECT id, current FROM {SCHEMA}.goals WHERE user_id = %s", (user_id,))
            row = cur.fetchone()
            if not row:
                cur.close()
                return err("Цель не найдена")

            goal_id, current = row
            current = float(current)
            if amount > current:
                cur.close()
                return err("Недостаточно средств на цели")

            new_current = current - amount
            cur.execute(
                f"UPDATE {SCHEMA}.goals SET current=%s, updated_at=NOW() WHERE user_id=%s",
                (new_current, user_id)
            )
            cur.execute(
                f"INSERT INTO {SCHEMA}.transactions (user_id, amount, category, comment, type) "
                f"VALUES (%s, %s, %s, %s, %s) RETURNING id, date",
                (user_id, amount, "Доход", "Вывод с финансовой цели", "income")
            )
            tx_row = cur.fetchone()
            conn.commit()
            cur.close()
            return ok({
                "ok": True,
                "new_current": new_current,
                "transaction": {
                    "id": tx_row[0],
                    "date": tx_row[1].isoformat(),
                    "amount": amount,
                    "category": "Доход",
                    "comment": "Вывод с финансовой цели",
                    "type": "income"
                }
            })

        # get_settings
        if action == "get_settings":
            cur = conn.cursor()
            cur.execute(f"SELECT currency, theme FROM {SCHEMA}.user_settings WHERE user_id = %s", (user_id,))
            row = cur.fetchone()
            cur.close()
            if not row:
                return ok({"settings": {"currency": "RUB", "theme": "dark"}})
            return ok({"settings": {"currency": row[0], "theme": row[1]}})

        # save_settings
        if action == "save_settings":
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

        return err("Unknown action", 400)
    finally:
        conn.close()