"""
Аутентификация через единый endpoint (action в body/params).
POST body {action: "register", login, email, password}
POST body {action: "login", login, password}
POST body {action: "logout"}         + Authorization: Bearer <session>
POST body {action: "me"}             + Authorization: Bearer <session>
POST body {action: "reset-request", email}
POST body {action: "reset-confirm", token, new_password}
"""

import json
import os
import hashlib
import secrets
import smtplib
import psycopg2
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timezone

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "t_p83865015_expense_tracker_spa")

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
}


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


def ok(data: dict, status: int = 200):
    return {"statusCode": status, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps(data, ensure_ascii=False)}


def err(msg: str, status: int = 400):
    return {"statusCode": status, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps({"error": msg}, ensure_ascii=False)}


def get_session_id(event: dict) -> str:
    headers = event.get("headers") or {}
    auth = headers.get("Authorization") or headers.get("X-Authorization") or ""
    if auth.startswith("Bearer "):
        return auth[7:]
    return auth


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


def send_reset_email(to_email: str, token: str):
    smtp_host = os.environ.get("SMTP_HOST", "")
    smtp_port = int(os.environ.get("SMTP_PORT", "465"))
    smtp_user = os.environ.get("SMTP_USER", "")
    smtp_pass = os.environ.get("SMTP_PASS", "")

    if not smtp_host or not smtp_user:
        return False

    msg = MIMEMultipart("alternative")
    msg["Subject"] = "Сброс пароля — ФинКонтроль"
    msg["From"] = smtp_user
    msg["To"] = to_email

    text_body = (
        "Здравствуйте!\n\n"
        "Вы запросили сброс пароля в приложении ФинКонтроль.\n\n"
        f"Ваш токен для сброса пароля:\n{token}\n\n"
        "Введите этот токен на странице 'Новый пароль' в приложении.\n"
        "Токен действует 1 час.\n\n"
        "Если вы не запрашивали сброс пароля — просто проигнорируйте это письмо."
    )
    html_body = (
        "<html><body style='font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:24px;background:#f9fafb;'>"
        "<div style='background:#1E3A8A;border-radius:16px;padding:32px;color:#fff;text-align:center;margin-bottom:24px;'>"
        "<h2 style='margin:0;font-size:22px;'>ФинКонтроль</h2>"
        "<p style='margin:8px 0 0;opacity:0.7;font-size:14px;'>Сброс пароля</p></div>"
        "<div style='background:#fff;border-radius:12px;padding:28px;box-shadow:0 2px 12px rgba(0,0,0,0.06);'>"
        "<p style='color:#374151;font-size:15px;'>Вы запросили сброс пароля.</p>"
        "<p style='color:#374151;font-size:14px;'>Ваш токен:</p>"
        "<div style='background:#F3F4F6;border-radius:8px;padding:16px;text-align:center;margin:16px 0;'>"
        f"<code style='font-size:16px;font-weight:bold;color:#1E3A8A;letter-spacing:2px;word-break:break-all;'>{token}</code>"
        "</div>"
        "<p style='color:#6B7280;font-size:13px;'>Введите токен на странице «Новый пароль» в приложении.<br>"
        "Токен действует <strong>1 час</strong>.</p>"
        "<p style='color:#9CA3AF;font-size:12px;margin-top:24px;'>Если вы не запрашивали сброс — проигнорируйте письмо.</p>"
        "</div></body></html>"
    )

    msg.attach(MIMEText(text_body, "plain", "utf-8"))
    msg.attach(MIMEText(html_body, "html", "utf-8"))

    if smtp_port == 465:
        import ssl
        ctx = ssl.create_default_context()
        with smtplib.SMTP_SSL(smtp_host, smtp_port, context=ctx) as server:
            server.login(smtp_user, smtp_pass)
            server.sendmail(smtp_user, to_email, msg.as_string())
    else:
        with smtplib.SMTP(smtp_host, smtp_port) as server:
            server.starttls()
            server.login(smtp_user, smtp_pass)
            server.sendmail(smtp_user, to_email, msg.as_string())
    return True


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    body = {}
    raw_body = event.get("body") or ""
    if raw_body:
        body = json.loads(raw_body)

    action = body.get("action") or ""

    conn = get_conn()
    try:
        # ── me ─────────────────────────────────────────────────────────────────
        if action == "me":
            session_id = get_session_id(event)
            user = get_user_by_session(conn, session_id)
            if not user:
                return err("Сессия недействительна", 401)
            cur = conn.cursor()
            cur.execute(f"SELECT currency, theme FROM {SCHEMA}.user_settings WHERE user_id = %s", (user["id"],))
            row = cur.fetchone()
            cur.close()
            settings = {"currency": row[0], "theme": row[1]} if row else {"currency": "RUB", "theme": "dark"}
            return ok({"user": user, "settings": settings})

        # ── register ───────────────────────────────────────────────────────────
        if action == "register":
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

        # ── login ──────────────────────────────────────────────────────────────
        if action == "login":
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

        # ── logout ─────────────────────────────────────────────────────────────
        if action == "logout":
            session_id = get_session_id(event)
            cur = conn.cursor()
            cur.execute(f"UPDATE {SCHEMA}.sessions SET expires_at = NOW() WHERE id = %s", (session_id,))
            conn.commit()
            cur.close()
            return ok({"ok": True})

        # ── reset-request ──────────────────────────────────────────────────────
        if action == "reset-request":
            email = (body.get("email") or "").strip().lower()
            if not email:
                return err("Введите email")
            cur = conn.cursor()
            cur.execute(f"SELECT id FROM {SCHEMA}.users WHERE email = %s", (email,))
            row = cur.fetchone()
            cur.close()
            if not row:
                return ok({"ok": True, "message": "Если email зарегистрирован — на него отправлено письмо"})

            user_id = row[0]
            token = secrets.token_hex(24)
            cur = conn.cursor()
            cur.execute(
                f"INSERT INTO {SCHEMA}.password_resets (user_id, token) VALUES (%s, %s)",
                (user_id, token)
            )
            conn.commit()
            cur.close()

            email_sent = False
            try:
                email_sent = send_reset_email(email, token)
            except Exception:
                pass

            if email_sent:
                return ok({"ok": True, "message": "Письмо с токеном отправлено на ваш email"})
            else:
                return ok({"ok": True, "token": token, "message": "Токен сброса (SMTP не настроен — показываем напрямую):"})

        # ── reset-confirm ──────────────────────────────────────────────────────
        if action == "reset-confirm":
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

        return err("Unknown action", 400)

    finally:
        conn.close()
