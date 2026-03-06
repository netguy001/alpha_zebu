from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime, timedelta, timezone
from database.connection import get_db
from models.user import User, TwoFactorAuth, UserSession, FailedLoginAttempt
from models.portfolio import Portfolio
from services.auth_service import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
    generate_2fa_secret,
    get_2fa_uri,
    verify_2fa_code,
    generate_2fa_qr_base64,
    generate_verification_token,
    verify_verification_token,
)
from core.event_bus import event_bus, Event, EventType
from config.settings import settings

router = APIRouter(prefix="/api/auth", tags=["Authentication"])
security = HTTPBearer(auto_error=False)

# --- Account Lockout Settings ---
MAX_FAILED_ATTEMPTS = 5
LOCKOUT_WINDOW_MINUTES = 15


async def _track_failed_login(user_id, db: AsyncSession):
    """Record a failed login attempt."""
    db.add(FailedLoginAttempt(user_id=user_id))


async def _is_account_locked(user_id, db: AsyncSession) -> bool:
    """Check if account has too many recent failed attempts."""
    cutoff = datetime.now(timezone.utc) - timedelta(minutes=LOCKOUT_WINDOW_MINUTES)
    result = await db.execute(
        select(func.count())
        .select_from(FailedLoginAttempt)
        .where(
            FailedLoginAttempt.user_id == user_id,
            FailedLoginAttempt.attempted_at >= cutoff,
        )
    )
    count = result.scalar()
    return count >= MAX_FAILED_ATTEMPTS


async def _clear_failed_logins(user_id, db: AsyncSession):
    """Clear failed attempts after a successful login."""
    from sqlalchemy import delete as sa_delete

    await db.execute(
        sa_delete(FailedLoginAttempt).where(FailedLoginAttempt.user_id == user_id)
    )


# --- Schemas ---


class RegisterRequest(BaseModel):
    email: EmailStr
    username: str
    password: str
    full_name: str

    @classmethod
    def validate_password_strength(cls, password: str) -> None:
        """Enforce password complexity: min 8 chars, 1 upper, 1 lower, 1 digit, 1 special."""
        import re

        if len(password) < 8:
            raise HTTPException(
                status_code=400, detail="Password must be at least 8 characters"
            )
        if not re.search(r"[A-Z]", password):
            raise HTTPException(
                status_code=400,
                detail="Password must contain at least one uppercase letter",
            )
        if not re.search(r"[a-z]", password):
            raise HTTPException(
                status_code=400,
                detail="Password must contain at least one lowercase letter",
            )
        if not re.search(r"\d", password):
            raise HTTPException(
                status_code=400, detail="Password must contain at least one digit"
            )
        if not re.search(r'[!@#$%^&*(),.?":{}|<>\-_=+\[\]\'`~/\\]', password):
            raise HTTPException(
                status_code=400,
                detail="Password must contain at least one special character",
            )


class LoginRequest(BaseModel):
    email: str
    password: str
    totp_code: Optional[str] = None


class TwoFactorSetupResponse(BaseModel):
    secret: str
    qr_code: str
    uri: str


class TwoFactorVerifyRequest(BaseModel):
    code: str


class PasswordResetRequest(BaseModel):
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str


# --- Helper ---


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> User:
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")

    payload = decode_token(credentials.credentials)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")

    # Validate session is still active (not revoked)
    jti = payload.get("jti")
    if jti:
        session_result = await db.execute(
            select(UserSession).where(UserSession.token_jti == jti)
        )
        session = session_result.scalar_one_or_none()
        if session and not session.is_active:
            raise HTTPException(status_code=401, detail="Session has been revoked")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found or inactive")

    return user


# --- Routes ---


@router.post("/register")
async def register(
    req: RegisterRequest, request: Request, db: AsyncSession = Depends(get_db)
):
    # Validate password strength
    RegisterRequest.validate_password_strength(req.password)

    # Check existing
    result = await db.execute(select(User).where(User.email == req.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    result = await db.execute(select(User).where(User.username == req.username))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Username already taken")

    # Create user
    user = User(
        email=req.email,
        username=req.username,
        password_hash=hash_password(req.password),
        full_name=req.full_name,
        virtual_capital=settings.DEFAULT_VIRTUAL_CAPITAL,
        is_verified=settings.AUTO_VERIFY_EMAIL,
    )
    db.add(user)
    await db.flush()

    # Create portfolio
    portfolio = Portfolio(
        user_id=user.id,
        available_capital=settings.DEFAULT_VIRTUAL_CAPITAL,
    )
    db.add(portfolio)

    # Generate tokens
    uid = str(user.id)
    access_token = create_access_token({"sub": uid, "email": user.email})
    refresh_token = create_refresh_token({"sub": uid})

    # Track session
    access_payload = decode_token(access_token)
    if access_payload:
        session = UserSession(
            user_id=user.id,
            token_jti=access_payload.get("jti", ""),
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent", "")[:500],
            expires_at=datetime.now(timezone.utc)
            + timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES),
        )
        db.add(session)

    event_bus.emit_nowait(
        Event(
            type=EventType.USER_LOGIN,
            data={"user_id": uid, "email": user.email, "action": "register"},
            user_id=uid,
            source="auth",
        )
    )

    return {
        "message": "Registration successful",
        "user": {
            "id": uid,
            "email": user.email,
            "username": user.username,
            "full_name": user.full_name,
        },
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
    }


@router.post("/login")
async def login(
    req: LoginRequest, request: Request, db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(User).where(User.email == req.email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(req.password, user.password_hash):
        # Track failed login for account lockout
        if user:
            await _track_failed_login(user.id, db)
            if await _is_account_locked(user.id, db):
                raise HTTPException(
                    status_code=423,
                    detail="Account temporarily locked due to too many failed attempts. Try again in 15 minutes.",
                )
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is deactivated")

    # Check account lockout before proceeding
    if await _is_account_locked(user.id, db):
        raise HTTPException(
            status_code=423,
            detail="Account temporarily locked due to too many failed attempts. Try again in 15 minutes.",
        )

    # Clear failed attempts on successful login
    await _clear_failed_logins(user.id, db)

    # Check 2FA
    result = await db.execute(
        select(TwoFactorAuth).where(TwoFactorAuth.user_id == user.id)
    )
    tfa = result.scalar_one_or_none()

    if tfa and tfa.is_enabled:
        if not req.totp_code:
            return {"requires_2fa": True, "message": "2FA code required"}
        if not verify_2fa_code(tfa.secret, req.totp_code):
            raise HTTPException(status_code=401, detail="Invalid 2FA code")

    uid = str(user.id)
    access_token = create_access_token({"sub": uid, "email": user.email})
    refresh_token = create_refresh_token({"sub": uid})

    # Track session
    access_payload = decode_token(access_token)
    if access_payload:
        session = UserSession(
            user_id=user.id,
            token_jti=access_payload.get("jti", ""),
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent", "")[:500],
            expires_at=datetime.now(timezone.utc)
            + timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES),
        )
        db.add(session)

    event_bus.emit_nowait(
        Event(
            type=EventType.USER_LOGIN,
            data={"user_id": uid, "email": user.email},
            user_id=uid,
            source="auth",
        )
    )

    return {
        "message": "Login successful",
        "user": {
            "id": uid,
            "email": user.email,
            "username": user.username,
            "full_name": user.full_name,
            "role": user.role,
            "virtual_capital": float(user.virtual_capital),
        },
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
    }


@router.get("/me")
async def get_me(user: User = Depends(get_current_user)):
    return {
        "id": str(user.id),
        "email": user.email,
        "username": user.username,
        "full_name": user.full_name,
        "role": user.role,
        "virtual_capital": float(user.virtual_capital),
        "is_verified": user.is_verified,
        "created_at": user.created_at.isoformat() if user.created_at else None,
    }


@router.post("/2fa/setup")
async def setup_2fa(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(TwoFactorAuth).where(TwoFactorAuth.user_id == user.id)
    )
    existing = result.scalar_one_or_none()

    secret = generate_2fa_secret()
    uri = get_2fa_uri(secret, user.email)
    qr_base64 = generate_2fa_qr_base64(uri)

    if existing:
        existing.secret = secret
        existing.is_enabled = False
    else:
        tfa = TwoFactorAuth(user_id=user.id, secret=secret)
        db.add(tfa)

    return {"secret": secret, "qr_code": qr_base64, "uri": uri}


@router.post("/2fa/verify")
async def verify_2fa(
    req: TwoFactorVerifyRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(TwoFactorAuth).where(TwoFactorAuth.user_id == user.id)
    )
    tfa = result.scalar_one_or_none()

    if not tfa:
        raise HTTPException(status_code=400, detail="2FA not set up")

    if not verify_2fa_code(tfa.secret, req.code):
        raise HTTPException(status_code=400, detail="Invalid verification code")

    tfa.is_enabled = True
    return {"message": "2FA enabled successfully"}


@router.post("/2fa/disable")
async def disable_2fa(
    req: TwoFactorVerifyRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(TwoFactorAuth).where(TwoFactorAuth.user_id == user.id)
    )
    tfa = result.scalar_one_or_none()

    if not tfa or not tfa.is_enabled:
        raise HTTPException(status_code=400, detail="2FA is not enabled")

    if not verify_2fa_code(tfa.secret, req.code):
        raise HTTPException(status_code=400, detail="Invalid verification code")

    tfa.is_enabled = False
    return {"message": "2FA disabled successfully"}


@router.post("/refresh")
async def refresh_token(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    request: Request = None,
    db: AsyncSession = Depends(get_db),
):
    if not credentials:
        raise HTTPException(status_code=401, detail="Token required")

    payload = decode_token(credentials.credentials)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    user_id = payload.get("sub")
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    # Revoke the old refresh token's JTI (token rotation)
    old_jti = payload.get("jti")
    if old_jti:
        old_session = await db.execute(
            select(UserSession).where(UserSession.token_jti == old_jti)
        )
        old_sess = old_session.scalar_one_or_none()
        if old_sess:
            old_sess.is_active = False

    uid = str(user.id)
    new_access = create_access_token({"sub": uid, "email": user.email})
    new_refresh = create_refresh_token({"sub": uid})

    # Track the new access token session
    access_payload = decode_token(new_access)
    if access_payload:
        session = UserSession(
            user_id=user.id,
            token_jti=access_payload.get("jti", ""),
            ip_address=request.client.host if request and request.client else None,
            user_agent=request.headers.get("user-agent", "")[:500] if request else "",
            expires_at=datetime.now(timezone.utc)
            + timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES),
        )
        db.add(session)

    return {
        "access_token": new_access,
        "refresh_token": new_refresh,
        "token_type": "bearer",
    }


@router.post("/logout")
async def logout(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db),
):
    """Revoke current session by deactivating the token's JTI."""
    if not credentials:
        raise HTTPException(status_code=401, detail="Token required")

    payload = decode_token(credentials.credentials)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")

    jti = payload.get("jti")
    user_id = payload.get("sub")

    if jti:
        result = await db.execute(
            select(UserSession).where(UserSession.token_jti == jti)
        )
        session = result.scalar_one_or_none()
        if session:
            session.is_active = False

    if user_id:
        event_bus.emit_nowait(
            Event(
                type=EventType.USER_LOGOUT,
                data={"user_id": user_id},
                user_id=user_id,
                source="auth",
            )
        )

    return {"message": "Logged out successfully"}
