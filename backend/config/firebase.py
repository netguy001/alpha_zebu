"""
Firebase Admin SDK initialization for AlphaSync backend.

Verifies Firebase ID tokens sent by the frontend.

Setup:
    1. Go to Firebase Console → Project Settings → Service Accounts
    2. Click "Generate New Private Key" → download the JSON file
    3. Either:
       a) Set FIREBASE_CREDENTIALS_JSON env var to the JSON string, OR
       b) Set GOOGLE_APPLICATION_CREDENTIALS env var to the file path

The Firebase Admin SDK is used ONLY for token verification —
all user sign-in/sign-up happens on the client via Firebase JS SDK.
"""

import json
import logging
from typing import Optional

import firebase_admin
from firebase_admin import auth as firebase_auth, credentials

from config.settings import settings

logger = logging.getLogger(__name__)

_initialized = False


def init_firebase() -> None:
    """Initialize Firebase Admin SDK (idempotent)."""
    global _initialized
    if _initialized:
        return

    # Clean up any previous failed initialization attempt
    try:
        firebase_admin.get_app()
        # App exists from a failed init — delete it so we can retry
        firebase_admin.delete_app(firebase_admin.get_app())
    except ValueError:
        pass  # No existing app — good

    try:
        if settings.FIREBASE_CREDENTIALS_JSON:
            cred_dict = json.loads(settings.FIREBASE_CREDENTIALS_JSON)
            cred = credentials.Certificate(cred_dict)
            firebase_admin.initialize_app(cred)
            logger.info("Firebase Admin initialized from FIREBASE_CREDENTIALS_JSON")
        elif settings.FIREBASE_CREDENTIALS_PATH:
            import os

            path = settings.FIREBASE_CREDENTIALS_PATH
            if not os.path.isfile(path):
                raise FileNotFoundError(f"Credentials file not found: {path}")
            if not os.access(path, os.R_OK):
                raise PermissionError(
                    f"Cannot read credentials file: {path} — "
                    f"check file permissions (current uid={os.getuid()}, "
                    f"file owner={os.stat(path).st_uid}, "
                    f"mode={oct(os.stat(path).st_mode)})"
                )
            cred = credentials.Certificate(path)
            firebase_admin.initialize_app(cred)
            logger.info(f"Firebase Admin initialized from file: {path}")
        else:
            logger.error(
                "⚠️  No Firebase credentials configured! "
                "Set FIREBASE_CREDENTIALS_JSON or FIREBASE_CREDENTIALS_PATH in .env. "
                "Token verification will FAIL until this is fixed."
            )
            firebase_admin.initialize_app()
            logger.info(
                "Firebase Admin initialized from GOOGLE_APPLICATION_CREDENTIALS"
            )
        _initialized = True
    except Exception as e:
        logger.error(f"Firebase Admin initialization failed: {e}")
        raise


def verify_firebase_token(id_token: str) -> Optional[dict]:
    """
    Verify a Firebase ID token and return the decoded claims.

    Returns None if the token is invalid or expired.
    Claims include: uid, email, name, picture, email_verified, etc.
    """
    if not _initialized:
        try:
            init_firebase()
        except Exception as e:
            logger.error(f"Cannot verify token — Firebase init failed: {e}")
            return None

    try:
        decoded = firebase_auth.verify_id_token(id_token, check_revoked=True)
        return decoded
    except firebase_auth.RevokedIdTokenError:
        logger.warning("Firebase token has been revoked")
        return None
    except firebase_auth.ExpiredIdTokenError:
        logger.debug("Firebase token expired")
        return None
    except firebase_auth.InvalidIdTokenError as e:
        logger.warning(f"Invalid Firebase token: {e}")
        return None
    except Exception as e:
        logger.error(f"Firebase token verification error: {e}")
        return None
        return None
        return None
