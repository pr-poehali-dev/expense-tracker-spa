"""
Аутентификация: регистрация, вход, выход, сброс пароля.
POST /register  — {login, email, password}
POST /login     — {login, password}
POST /logout    — header X-Session-Id
GET  /me        — header X-Session-Id
POST /reset-request  — {email}
POST /reset-confirm  — {token, new_password}
"""

import json
import os
import hashlib
import secrets
import psycopg2
from datetime import datetime, timezone

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "t_p83865015_expense_tracker_spa")

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Session-Id",
}


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


def ok(data: dict, status: int = 200):
    return {"statusCode": status, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps(data)}


def err(msg: str, status: int = 400):
    return {"statusCode": status, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps({"error": msg})}


def get_user_by_session(conn, session_id: str):
    cur = conn.cursor()
    cur.execute(
        f"SELECT u.id, u.login, u.email FROM {SCHEMA}.sessions s "
        f"JOIN {SCHEMA}.users u ON u.id = s.user_id "
        f"WHERE s.id = %s AND s.expires_at > NOW()",
        (session_id,)
    )
    row = cur.fetchone()
    cur.close()
    if not row:
        return None
    return {"id": row[0], "login": row[1], "email": row[2]}


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    path = event.get("path", "/").rstrip("/")
    method = event.get("httpMethod", "GET")
    body = {}
    if event.get("body"):
        try:
            body = json.loads(event["body"])
        except Exception:
            pass

    conn = get_conn()
    try:
        # ── GET /me ────────────────────────────────────────────────────────────
        if method == "GET" and path.endswith("/me"):
            session_id = event.get("headers", {}).get("X-Session-Id", "")
            user = get_user_by_session(conn, session_id)
            if not user:
                return err("Сессия недействительна", 401)
            # load settings
            cur = conn.cursor()
            cur.execute(f"SELECT currency, theme FROM {SCHEMA}.user_settings WHERE user_id = %s", (user["id"],))
            row = cur.fetchone()
            cur.close()
            settings = {"currency": row[0], "theme": row[1]} if row else {"currency": "RUB", "theme": "dark"}
            return ok({"user": user, "settings": settings})

        # ── POST /register ─────────────────────────────────────────────────────
        if method == "POST" and path.endswith("/register"):
            login = (body.get("login") or "").strip()
            email = (body.get("email") or "").strip().lower()
            password = body.get("password") or ""
            if not login or not email or not password:
                return err("Заполните все поля")
            if len(password) < 6:
                return err("Пароль должен быть не менее 6 символов")
            if "@" not in email:
                return err("Некорректный email")

            cur = conn.cursor()
            cur.execute(f"SELECT id FROM {SCHEMA}.users WHERE login = %s OR email = %s", (login, email))
            if cur.fetchone():
                cur.close()
                return err("Логин или email уже занят")

            pw_hash = hash_password(password)
            cur.execute(
                f"INSERT INTO {SCHEMA}.users (login, email, password_hash) VALUES (%s, %s, %s) RETURNING id",
                (login, email, pw_hash)
            )
            user_id = cur.fetchone()[0]
            cur.execute(f"INSERT INTO {SCHEMA}.user_settings (user_id) VALUES (%s)", (user_id,))
            conn.commit()
            cur.close()

            session_id = secrets.token_hex(32)
            cur = conn.cursor()
            cur.execute(f"INSERT INTO {SCHEMA}.sessions (id, user_id) VALUES (%s, %s)", (session_id, user_id))
            conn.commit()
            cur.close()

            return ok({"session_id": session_id, "user": {"id": user_id, "login": login, "email": email}}, 201)

        # ── POST /login ────────────────────────────────────────────────────────
        if method == "POST" and path.endswith("/login"):
            login = (body.get("login") or "").strip()
            password = body.get("password") or ""
            if not login or not password:
                return err("Заполните все поля")

            pw_hash = hash_password(password)
            cur = conn.cursor()
            cur.execute(
                f"SELECT id, login, email FROM {SCHEMA}.users WHERE login = %s AND password_hash = %s",
                (login, pw_hash)
            )
            row = cur.fetchone()
            cur.close()
            if not row:
                return err("Неверный логин или пароль", 401)

            user_id, ulogin, uemail = row
            session_id = secrets.token_hex(32)
            cur = conn.cursor()
            cur.execute(f"INSERT INTO {SCHEMA}.sessions (id, user_id) VALUES (%s, %s)", (session_id, user_id))
            conn.commit()
            cur.close()

            cur = conn.cursor()
            cur.execute(f"SELECT currency, theme FROM {SCHEMA}.user_settings WHERE user_id = %s", (user_id,))
            srow = cur.fetchone()
            cur.close()
            settings = {"currency": srow[0], "theme": srow[1]} if srow else {"currency": "RUB", "theme": "dark"}

            return ok({"session_id": session_id, "user": {"id": user_id, "login": ulogin, "email": uemail}, "settings": settings})

        # ── POST /logout ───────────────────────────────────────────────────────
        if method == "POST" and path.endswith("/logout"):
            session_id = event.get("headers", {}).get("X-Session-Id", "")
            cur = conn.cursor()
            cur.execute(f"UPDATE {SCHEMA}.sessions SET expires_at = NOW() WHERE id = %s", (session_id,))
            conn.commit()
            cur.close()
            return ok({"ok": True})

        # ── POST /reset-request ────────────────────────────────────────────────
        if method == "POST" and path.endswith("/reset-request"):
            email = (body.get("email") or "").strip().lower()
            if not email:
                return err("Введите email")
            cur = conn.cursor()
            cur.execute(f"SELECT id FROM {SCHEMA}.users WHERE email = %s", (email,))
            row = cur.fetchone()
            cur.close()
            if not row:
                # не раскрываем, есть ли такой email
                return ok({"ok": True, "message": "Если email зарегистрирован, на него отправлен токен сброса"})
            user_id = row[0]
            token = secrets.token_hex(24)
            cur = conn.cursor()
            cur.execute(
                f"INSERT INTO {SCHEMA}.password_resets (user_id, token) VALUES (%s, %s)",
                (user_id, token)
            )
            conn.commit()
            cur.close()
            return ok({"ok": True, "token": token, "message": "Токен сброса пароля (в демо-режиме отображается напрямую)"})

        # ── POST /reset-confirm ────────────────────────────────────────────────
        if method == "POST" and path.endswith("/reset-confirm"):
            token = (body.get("token") or "").strip()
            new_password = body.get("new_password") or ""
            if not token or not new_password:
                return err("Заполните все поля")
            if len(new_password) < 6:
                return err("Пароль должен быть не менее 6 символов")

            cur = conn.cursor()
            cur.execute(
                f"SELECT id, user_id, used, expires_at FROM {SCHEMA}.password_resets WHERE token = %s",
                (token,)
            )
            row = cur.fetchone()
            cur.close()
            if not row:
                return err("Неверный токен", 400)
            reset_id, user_id, used, expires_at = row
            if used:
                return err("Токен уже использован")
            if expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
                return err("Токен истёк")

            pw_hash = hash_password(new_password)
            cur = conn.cursor()
            cur.execute(f"UPDATE {SCHEMA}.users SET password_hash = %s WHERE id = %s", (pw_hash, user_id))
            cur.execute(f"UPDATE {SCHEMA}.password_resets SET used = TRUE WHERE id = %s", (reset_id,))
            conn.commit()
            cur.close()
            return ok({"ok": True, "message": "Пароль успешно изменён"})

        return err("Not found", 404)

    finally:
        conn.close()
