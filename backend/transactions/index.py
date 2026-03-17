"""
Транзакции пользователя (требует X-Session-Id).
GET    /       — все транзакции
POST   /       — {amount, category, comment, type, date?}
PUT    /{id}   — {amount, category, comment, type}
DELETE /{id}   — мягкое скрытие (hidden=true)
"""

import json
import os
import psycopg2

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "t_p83865015_expense_tracker_spa")

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
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

        parts = [p for p in path.split("/") if p]
        tx_id = None
        if len(parts) >= 2 and parts[-1].isdigit():
            tx_id = int(parts[-1])

        # GET /
        if method == "GET" and not tx_id:
            cur = conn.cursor()
            cur.execute(
                f"SELECT id, amount, category, comment, type, date FROM {SCHEMA}.transactions "
                f"WHERE user_id = %s AND hidden = FALSE ORDER BY date DESC",
                (user_id,)
            )
            rows = cur.fetchall()
            cur.close()
            txs = [{"id": r[0], "amount": float(r[1]), "category": r[2], "comment": r[3], "type": r[4], "date": r[5].isoformat()} for r in rows]
            return ok({"transactions": txs})

        # POST /
        if method == "POST" and not tx_id:
            amount = body.get("amount")
            category = body.get("category", "")
            comment = body.get("comment", "")
            tx_type = body.get("type", "expense")
            date = body.get("date")

            if amount is None or float(amount) <= 0:
                return err("Некорректная сумма")
            if tx_type not in ("income", "expense", "transfer"):
                return err("Неверный тип транзакции")

            cur = conn.cursor()
            if date:
                cur.execute(
                    f"INSERT INTO {SCHEMA}.transactions (user_id, amount, category, comment, type, date) "
                    f"VALUES (%s, %s, %s, %s, %s, %s) RETURNING id, date",
                    (user_id, float(amount), category, comment, tx_type, date)
                )
            else:
                cur.execute(
                    f"INSERT INTO {SCHEMA}.transactions (user_id, amount, category, comment, type) "
                    f"VALUES (%s, %s, %s, %s, %s) RETURNING id, date",
                    (user_id, float(amount), category, comment, tx_type)
                )
            row = cur.fetchone()
            conn.commit()
            cur.close()
            return ok({"id": row[0], "date": row[1].isoformat(), "amount": float(amount), "category": category, "comment": comment, "type": tx_type}, 201)

        # PUT /{id}
        if method == "PUT" and tx_id:
            amount = body.get("amount")
            category = body.get("category", "")
            comment = body.get("comment", "")
            tx_type = body.get("type", "expense")

            cur = conn.cursor()
            cur.execute(
                f"UPDATE {SCHEMA}.transactions SET amount=%s, category=%s, comment=%s, type=%s "
                f"WHERE id=%s AND user_id=%s AND hidden=FALSE RETURNING id",
                (float(amount), category, comment, tx_type, tx_id, user_id)
            )
            if not cur.fetchone():
                cur.close()
                return err("Транзакция не найдена", 404)
            conn.commit()
            cur.close()
            return ok({"ok": True})

        # DELETE /{id}
        if method == "DELETE" and tx_id:
            cur = conn.cursor()
            cur.execute(
                f"UPDATE {SCHEMA}.transactions SET hidden=TRUE WHERE id=%s AND user_id=%s AND hidden=FALSE RETURNING id",
                (tx_id, user_id)
            )
            if not cur.fetchone():
                cur.close()
                return err("Транзакция не найдена", 404)
            conn.commit()
            cur.close()
            return ok({"ok": True})

        return err("Not found", 404)
    finally:
        conn.close()
