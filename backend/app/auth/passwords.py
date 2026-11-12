"""Hash y verificación de contraseñas con bcrypt."""

from __future__ import annotations

import bcrypt

# bcrypt solo considera los primeros 72 bytes; más largo se rechaza en vez de truncar.
MAX_PASSWORD_BYTES = 72


def hash_password(password: str) -> str:
    """Devuelve el hash bcrypt (`$2b$...`) de la contraseña."""
    raw = password.encode("utf-8")
    if len(raw) > MAX_PASSWORD_BYTES:
        raise ValueError(f"La contraseña supera los {MAX_PASSWORD_BYTES} bytes que admite bcrypt.")
    return bcrypt.hashpw(raw, bcrypt.gensalt()).decode("ascii")


def verify_password(password: str, password_hash: str) -> bool:
    """`True` si la contraseña corresponde al hash."""
    try:
        return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("ascii"))
    except ValueError:
        return False
