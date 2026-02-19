"""
Authentication and Subscription Management for Latence App
Supports: Email/Password, Google OAuth, Apple Sign-In
Subscription tiers: Free, Essentiel (4.99€), Premium (14.99€), Lifetime
"""

from fastapi import APIRouter, HTTPException, Request, Response, Depends
from fastapi.security import HTTPBearer
from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List
from datetime import datetime, timedelta, timezone
from motor.motor_asyncio import AsyncIOMotorDatabase
import uuid
import hashlib
import secrets
import httpx
import qrcode
import io
import base64

auth_router = APIRouter(prefix="/api/auth", tags=["Authentication"])
subscription_router = APIRouter(prefix="/api/subscription", tags=["Subscription"])
admin_router = APIRouter(prefix="/api/admin", tags=["Admin"])

# ==================== MODELS ====================

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    subscription_tier: str = "free"  # free, essentiel, premium, lifetime
    subscription_expires: Optional[datetime] = None
    is_founder: bool = False
    usage_this_month: dict = Field(default_factory=lambda: {"journal_entries": 0, "dreams": 0, "mirror_queries": 0})
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserSession(BaseModel):
    session_id: str
    user_id: str
    session_token: str
    expires_at: datetime
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class LifetimeCode(BaseModel):
    code: str
    is_used: bool = False
    used_by_email: Optional[str] = None
    used_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    batch_name: Optional[str] = None

class PaymentTransaction(BaseModel):
    transaction_id: str
    user_id: str
    amount: float
    currency: str = "eur"
    plan: str  # essentiel, premium
    session_id: str
    payment_status: str = "pending"  # pending, paid, failed, expired
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# ==================== SUBSCRIPTION TIERS ====================

SUBSCRIPTION_TIERS = {
    "free": {
        "name": "Essai Gratuit",
        "price": 0,
        "trial_days": 2,  # 2 jours d'essai
        "limits": {
            "journal_entries": -1,  # unlimited during trial
            "dreams": -1,
            "mirror_queries": -1,
            "astrology": True,
            "oracle": True,
            "advanced_analysis": True,
            "statistics": True,
            "cosmic_tree": True,
            "lunar_cycles": True,
            "unlimited_archive": True,
            "seal_permanent": True,
            "cadence": True,
            "sagesse": True,
            "lettre": True,
        }
    },
    "essentiel": {
        "name": "Essentiel",
        "price": 9.99,
        "description": "Écriture complète, sans approfondissement",
        "limits": {
            "journal_entries": -1,  # Écriture illimitée
            "dreams": -1,  # Carnet des rêves (ÉCRITURE)
            "seal": True,  # Sceller
            "cadence": True,
            "sagesse": True,
            "lettre": True,
            "lunar_cycles": True,
            "unlimited_archive": True,
            "seal_permanent": True,
            "statistics": True,
            # PAS D'APPROFONDISSEMENT:
            "mirror_queries": False,  # PAS d'IA Miroir
            "oracle": False,  # PAS d'Oracle des rêves
            "advanced_analysis": False,  # PAS d'analyse approfondie
            "astrology": False,  # PAS d'Astrologie
            "cosmic_tree": False,  # PAS d'Arbre cosmique
            "dream_interpretation": False,  # PAS d'interprétation IA des rêves
        }
    },
    "premium": {
        "name": "Premium",
        "price": 18.99,
        "description": "Accès complet avec approfondissement IA",
        "limits": {
            "journal_entries": -1,
            "dreams": -1,  # Rêves illimités
            "mirror_queries": -1,  # IA Miroir illimitée
            "astrology": True,  # Astro inclus
            "oracle": True,
            "advanced_analysis": True,
            "statistics": True,
            "cosmic_tree": True,
            "lunar_cycles": True,
            "unlimited_archive": True,
            "seal_permanent": True,
            "health_sync": True,
            "cadence": True,
            "sagesse": True,
            "lettre": True,
        }
    },
    "lifetime": {
        "name": "Accès à Vie",
        "price": 0,  # via code
        "limits": {
            "journal_entries": -1,
            "dreams": -1,
            "mirror_queries": -1,
            "astrology": True,
            "oracle": True,
            "advanced_analysis": True,
            "statistics": True,
            "cosmic_tree": True,
            "lunar_cycles": True,
            "unlimited_archive": True,
            "seal_permanent": True,
            "health_sync": True,
            "cadence": True,
            "sagesse": True,
            "lettre": True,
        }
    }
}

# ==================== HELPER FUNCTIONS ====================

def hash_password(password: str) -> str:
    """Hash password with salt"""
    salt = "latence_cosmic_salt_2024"
    return hashlib.sha256(f"{password}{salt}".encode()).hexdigest()

def generate_session_token() -> str:
    """Generate a secure session token"""
    return secrets.token_urlsafe(32)

def generate_lifetime_code() -> str:
    """Generate a unique lifetime access code"""
    prefix = "LATENCE"
    unique_part = secrets.token_hex(6).upper()
    return f"{prefix}-{unique_part[:4]}-{unique_part[4:8]}-{unique_part[8:]}"

def generate_qr_code_base64(data: str) -> str:
    """Generate QR code as base64 string"""
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(data)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    
    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    buffer.seek(0)
    return base64.b64encode(buffer.getvalue()).decode()

async def get_current_user(request: Request, db: AsyncIOMotorDatabase) -> Optional[User]:
    """Get current user from session token"""
    # Check cookie first
    session_token = request.cookies.get("session_token")
    
    # Fallback to Authorization header
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header[7:]
    
    if not session_token:
        return None
    
    # Find session
    session_doc = await db.user_sessions.find_one(
        {"session_token": session_token},
        {"_id": 0}
    )
    
    if not session_doc:
        return None
    
    # Check expiry
    expires_at = session_doc["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    
    if expires_at < datetime.now(timezone.utc):
        return None
    
    # Get user
    user_doc = await db.users.find_one(
        {"user_id": session_doc["user_id"]},
        {"_id": 0}
    )
    
    if not user_doc:
        return None
    
    return User(**user_doc)

def check_feature_access(user: Optional[User], feature: str) -> bool:
    """Check if user has access to a feature"""
    if not user:
        tier = "free"
    else:
        tier = user.subscription_tier
        # Check if subscription is expired
        if user.subscription_expires:
            exp = user.subscription_expires
            if isinstance(exp, str):
                exp = datetime.fromisoformat(exp)
            if exp.tzinfo is None:
                exp = exp.replace(tzinfo=timezone.utc)
            if exp < datetime.now(timezone.utc) and tier not in ["free", "lifetime"]:
                tier = "free"
    
    tier_config = SUBSCRIPTION_TIERS.get(tier, SUBSCRIPTION_TIERS["free"])
    return tier_config["limits"].get(feature, False)

def check_usage_limit(user: Optional[User], feature: str) -> tuple[bool, int]:
    """Check if user is within usage limits. Returns (allowed, remaining)"""
    if not user:
        tier = "free"
        usage = {"journal_entries": 0, "dreams": 0, "mirror_queries": 0}
    else:
        tier = user.subscription_tier
        usage = user.usage_this_month or {"journal_entries": 0, "dreams": 0, "mirror_queries": 0}
    
    tier_config = SUBSCRIPTION_TIERS.get(tier, SUBSCRIPTION_TIERS["free"])
    limit = tier_config["limits"].get(feature, 0)
    
    if limit == -1:  # unlimited
        return True, -1
    
    current_usage = usage.get(feature, 0)
    remaining = limit - current_usage
    
    return remaining > 0, remaining

# ==================== AUTH ROUTES ====================

def register_auth_routes(app, db: AsyncIOMotorDatabase):
    """Register all auth routes with database dependency"""
    
    @auth_router.post("/register")
    async def register(user_data: UserCreate, response: Response):
        """Register a new user with email/password"""
        # Check if email exists
        existing = await db.users.find_one({"email": user_data.email})
        if existing:
            raise HTTPException(status_code=400, detail="Email déjà utilisé")
        
        # Create user
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        user = User(
            user_id=user_id,
            email=user_data.email,
            name=user_data.name,
            subscription_tier="free"
        )
        
        # Store with hashed password
        user_dict = user.dict()
        user_dict["password_hash"] = hash_password(user_data.password)
        await db.users.insert_one(user_dict)
        
        # Create session
        session_token = generate_session_token()
        session = UserSession(
            session_id=str(uuid.uuid4()),
            user_id=user_id,
            session_token=session_token,
            expires_at=datetime.now(timezone.utc) + timedelta(days=7)
        )
        await db.user_sessions.insert_one(session.dict())
        
        # Set cookie
        response.set_cookie(
            key="session_token",
            value=session_token,
            httponly=True,
            secure=True,
            samesite="none",
            path="/",
            max_age=7 * 24 * 60 * 60
        )
        
        return {"success": True, "user": user.dict()}
    
    @auth_router.post("/login")
    async def login(credentials: UserLogin, response: Response):
        """Login with email/password"""
        user_doc = await db.users.find_one(
            {"email": credentials.email},
            {"_id": 0}
        )
        
        if not user_doc:
            raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect")
        
        if user_doc.get("password_hash") != hash_password(credentials.password):
            raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect")
        
        # Create session
        session_token = generate_session_token()
        session = UserSession(
            session_id=str(uuid.uuid4()),
            user_id=user_doc["user_id"],
            session_token=session_token,
            expires_at=datetime.now(timezone.utc) + timedelta(days=7)
        )
        await db.user_sessions.insert_one(session.dict())
        
        # Set cookie
        response.set_cookie(
            key="session_token",
            value=session_token,
            httponly=True,
            secure=True,
            samesite="none",
            path="/",
            max_age=7 * 24 * 60 * 60
        )
        
        user = User(**{k: v for k, v in user_doc.items() if k != "password_hash"})
        return {"success": True, "user": user.dict()}
    
    @auth_router.post("/session")
    async def process_oauth_session(request: Request, response: Response):
        """Process OAuth session from Emergent Auth"""
        body = await request.json()
        session_id = body.get("session_id")
        
        if not session_id:
            raise HTTPException(status_code=400, detail="Session ID manquant")
        
        # Call Emergent Auth API
        async with httpx.AsyncClient() as client:
            auth_response = await client.get(
                "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
                headers={"X-Session-ID": session_id}
            )
        
        if auth_response.status_code != 200:
            raise HTTPException(status_code=401, detail="Session invalide")
        
        auth_data = auth_response.json()
        email = auth_data.get("email")
        name = auth_data.get("name")
        picture = auth_data.get("picture")
        
        # Check if user exists
        user_doc = await db.users.find_one({"email": email}, {"_id": 0})
        
        if user_doc:
            # Update existing user
            user_id = user_doc["user_id"]
            await db.users.update_one(
                {"user_id": user_id},
                {"$set": {"name": name, "picture": picture}}
            )
            user = User(**{k: v for k, v in user_doc.items() if k != "password_hash"})
            user.name = name
            user.picture = picture
        else:
            # Create new user
            user_id = f"user_{uuid.uuid4().hex[:12]}"
            user = User(
                user_id=user_id,
                email=email,
                name=name,
                picture=picture,
                subscription_tier="free"
            )
            await db.users.insert_one(user.dict())
        
        # Create session
        session_token = generate_session_token()
        session = UserSession(
            session_id=str(uuid.uuid4()),
            user_id=user_id,
            session_token=session_token,
            expires_at=datetime.now(timezone.utc) + timedelta(days=7)
        )
        await db.user_sessions.insert_one(session.dict())
        
        # Set cookie
        response.set_cookie(
            key="session_token",
            value=session_token,
            httponly=True,
            secure=True,
            samesite="none",
            path="/",
            max_age=7 * 24 * 60 * 60
        )
        
        return {"success": True, "user": user.dict(), "session_token": session_token}
    
    @auth_router.get("/me")
    async def get_me(request: Request):
        """Get current user info"""
        user = await get_current_user(request, db)
        if not user:
            raise HTTPException(status_code=401, detail="Non authentifié")
        return user.dict()
    
    @auth_router.post("/logout")
    async def logout(request: Request, response: Response):
        """Logout user"""
        session_token = request.cookies.get("session_token")
        if session_token:
            await db.user_sessions.delete_many({"session_token": session_token})
        
        response.delete_cookie(key="session_token", path="/")
        return {"success": True}
    
    @auth_router.get("/subscription-status")
    async def get_subscription_status(request: Request):
        """Get user's subscription status and usage"""
        user = await get_current_user(request, db)
        
        if not user:
            tier = "free"
            usage = {"journal_entries": 0, "dreams": 0, "mirror_queries": 0}
            expires = None
            is_founder = False
        else:
            tier = user.subscription_tier
            usage = user.usage_this_month or {}
            expires = user.subscription_expires
            is_founder = user.is_founder
        
        tier_config = SUBSCRIPTION_TIERS.get(tier, SUBSCRIPTION_TIERS["free"])
        
        return {
            "tier": tier,
            "tier_name": tier_config["name"],
            "is_founder": is_founder,
            "limits": tier_config["limits"],
            "usage": usage,
            "expires_at": expires,
            "features": {
                "oracle": check_feature_access(user, "oracle"),
                "advanced_analysis": check_feature_access(user, "advanced_analysis"),
                "statistics": check_feature_access(user, "statistics"),
                "cosmic_tree": check_feature_access(user, "cosmic_tree"),
                "lunar_cycles": check_feature_access(user, "lunar_cycles"),
            }
        }
    
    # ==================== SUBSCRIPTION ROUTES ====================
    
    @subscription_router.get("/plans")
    async def get_subscription_plans():
        """Get available subscription plans"""
        plans = []
        for tier_id, tier_data in SUBSCRIPTION_TIERS.items():
            if tier_id not in ["free", "lifetime"]:
                plans.append({
                    "id": tier_id,
                    "name": tier_data["name"],
                    "price": tier_data["price"],
                    "currency": "EUR",
                    "features": tier_data["limits"]
                })
        return {"plans": plans}
    
    @subscription_router.post("/create-checkout")
    async def create_checkout_session(request: Request):
        """Create Stripe checkout session for subscription"""
        import os
        from emergentintegrations.payments.stripe.checkout import (
            StripeCheckout, CheckoutSessionRequest
        )
        
        body = await request.json()
        plan = body.get("plan")  # essentiel or premium
        origin_url = body.get("origin_url")
        
        if plan not in ["essentiel", "premium"]:
            raise HTTPException(status_code=400, detail="Plan invalide")
        
        if not origin_url:
            raise HTTPException(status_code=400, detail="URL d'origine manquante")
        
        user = await get_current_user(request, db)
        if not user:
            raise HTTPException(status_code=401, detail="Authentification requise")
        
        # Get price from server-side config (NEVER from frontend)
        amount = SUBSCRIPTION_TIERS[plan]["price"]
        
        # Initialize Stripe
        api_key = os.environ.get("STRIPE_API_KEY")
        host_url = str(request.base_url).rstrip("/")
        webhook_url = f"{host_url}/api/webhook/stripe"
        
        stripe_checkout = StripeCheckout(api_key=api_key, webhook_url=webhook_url)
        
        # Create checkout session
        success_url = f"{origin_url}/subscription/success?session_id={{CHECKOUT_SESSION_ID}}"
        cancel_url = f"{origin_url}/subscription"
        
        checkout_request = CheckoutSessionRequest(
            amount=float(amount),
            currency="eur",
            success_url=success_url,
            cancel_url=cancel_url,
            metadata={
                "user_id": user.user_id,
                "plan": plan,
                "user_email": user.email
            }
        )
        
        session = await stripe_checkout.create_checkout_session(checkout_request)
        
        # Create transaction record
        transaction = PaymentTransaction(
            transaction_id=str(uuid.uuid4()),
            user_id=user.user_id,
            amount=float(amount),
            currency="eur",
            plan=plan,
            session_id=session.session_id,
            payment_status="pending"
        )
        await db.payment_transactions.insert_one(transaction.dict())
        
        return {"checkout_url": session.url, "session_id": session.session_id}
    
    @subscription_router.get("/checkout-status/{session_id}")
    async def get_checkout_status(session_id: str, request: Request):
        """Check payment status and update subscription if successful"""
        import os
        from emergentintegrations.payments.stripe.checkout import StripeCheckout
        
        api_key = os.environ.get("STRIPE_API_KEY")
        host_url = str(request.base_url).rstrip("/")
        webhook_url = f"{host_url}/api/webhook/stripe"
        
        stripe_checkout = StripeCheckout(api_key=api_key, webhook_url=webhook_url)
        
        status = await stripe_checkout.get_checkout_status(session_id)
        
        # Find transaction
        transaction = await db.payment_transactions.find_one(
            {"session_id": session_id},
            {"_id": 0}
        )
        
        if not transaction:
            raise HTTPException(status_code=404, detail="Transaction non trouvée")
        
        # Update transaction status
        if status.payment_status == "paid" and transaction["payment_status"] != "paid":
            # Update transaction
            await db.payment_transactions.update_one(
                {"session_id": session_id},
                {"$set": {"payment_status": "paid"}}
            )
            
            # Upgrade user subscription
            plan = transaction["plan"]
            expires_at = datetime.now(timezone.utc) + timedelta(days=30)
            
            await db.users.update_one(
                {"user_id": transaction["user_id"]},
                {"$set": {
                    "subscription_tier": plan,
                    "subscription_expires": expires_at
                }}
            )
        elif status.status == "expired":
            await db.payment_transactions.update_one(
                {"session_id": session_id},
                {"$set": {"payment_status": "expired"}}
            )
        
        return {
            "status": status.status,
            "payment_status": status.payment_status,
            "plan": transaction["plan"]
        }
    
    @subscription_router.post("/activate-lifetime")
    async def activate_lifetime_code(request: Request):
        """Activate a lifetime access code"""
        body = await request.json()
        code = body.get("code", "").strip().upper()
        
        user = await get_current_user(request, db)
        if not user:
            raise HTTPException(status_code=401, detail="Authentification requise")
        
        # Find code
        code_doc = await db.lifetime_codes.find_one(
            {"code": code},
            {"_id": 0}
        )
        
        if not code_doc:
            raise HTTPException(status_code=404, detail="Code invalide")
        
        if code_doc.get("is_used"):
            raise HTTPException(status_code=400, detail="Ce code a déjà été utilisé")
        
        # Activate code
        await db.lifetime_codes.update_one(
            {"code": code},
            {"$set": {
                "is_used": True,
                "used_by_email": user.email,
                "used_at": datetime.now(timezone.utc)
            }}
        )
        
        # Upgrade user
        await db.users.update_one(
            {"user_id": user.user_id},
            {"$set": {
                "subscription_tier": "lifetime",
                "is_founder": True,
                "subscription_expires": None  # Never expires
            }}
        )
        
        return {
            "success": True,
            "message": "Bienvenue parmi les Membres Fondateurs !",
            "tier": "lifetime"
        }
    
    # ==================== ADMIN ROUTES ====================
    
    ADMIN_PASSWORD = "latence_admin_2024"  # Should be in env in production
    
    @admin_router.post("/login")
    async def admin_login(request: Request, response: Response):
        """Admin login"""
        body = await request.json()
        password = body.get("password")
        
        if password != ADMIN_PASSWORD:
            raise HTTPException(status_code=401, detail="Mot de passe incorrect")
        
        admin_token = generate_session_token()
        
        # Store admin session
        await db.admin_sessions.insert_one({
            "token": admin_token,
            "expires_at": datetime.now(timezone.utc) + timedelta(hours=8),
            "created_at": datetime.now(timezone.utc)
        })
        
        response.set_cookie(
            key="admin_token",
            value=admin_token,
            httponly=True,
            secure=True,
            samesite="none",
            path="/",
            max_age=8 * 60 * 60
        )
        
        return {"success": True}
    
    async def verify_admin(request: Request) -> bool:
        """Verify admin session"""
        admin_token = request.cookies.get("admin_token")
        if not admin_token:
            return False
        
        session = await db.admin_sessions.find_one({"token": admin_token})
        if not session:
            return False
        
        expires_at = session["expires_at"]
        if isinstance(expires_at, str):
            expires_at = datetime.fromisoformat(expires_at)
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        
        return expires_at > datetime.now(timezone.utc)
    
    @admin_router.get("/stats")
    async def get_admin_stats(request: Request):
        """Get admin dashboard statistics"""
        if not await verify_admin(request):
            raise HTTPException(status_code=401, detail="Accès non autorisé")
        
        total_users = await db.users.count_documents({})
        free_users = await db.users.count_documents({"subscription_tier": "free"})
        essentiel_users = await db.users.count_documents({"subscription_tier": "essentiel"})
        premium_users = await db.users.count_documents({"subscription_tier": "premium"})
        lifetime_users = await db.users.count_documents({"subscription_tier": "lifetime"})
        
        total_codes = await db.lifetime_codes.count_documents({})
        used_codes = await db.lifetime_codes.count_documents({"is_used": True})
        
        total_revenue = 0
        transactions = await db.payment_transactions.find(
            {"payment_status": "paid"},
            {"_id": 0, "amount": 1}
        ).to_list(1000)
        for t in transactions:
            total_revenue += t.get("amount", 0)
        
        return {
            "users": {
                "total": total_users,
                "free": free_users,
                "essentiel": essentiel_users,
                "premium": premium_users,
                "lifetime": lifetime_users
            },
            "codes": {
                "total": total_codes,
                "used": used_codes,
                "available": total_codes - used_codes
            },
            "revenue": {
                "total": round(total_revenue, 2),
                "currency": "EUR"
            }
        }
    
    @admin_router.post("/generate-codes")
    async def generate_lifetime_codes(request: Request):
        """Generate lifetime access codes"""
        if not await verify_admin(request):
            raise HTTPException(status_code=401, detail="Accès non autorisé")
        
        body = await request.json()
        count = min(body.get("count", 10), 100)  # Max 100 at a time
        batch_name = body.get("batch_name", f"Batch_{datetime.now().strftime('%Y%m%d_%H%M')}")
        
        codes = []
        for _ in range(count):
            code = generate_lifetime_code()
            code_obj = LifetimeCode(
                code=code,
                batch_name=batch_name
            )
            await db.lifetime_codes.insert_one(code_obj.dict())
            
            # Generate QR code
            qr_data = f"latence://activate?code={code}"
            qr_base64 = generate_qr_code_base64(qr_data)
            
            codes.append({
                "code": code,
                "qr_code": qr_base64
            })
        
        return {"success": True, "codes": codes, "batch_name": batch_name}
    
    @admin_router.get("/codes")
    async def list_lifetime_codes(request: Request):
        """List all lifetime codes"""
        if not await verify_admin(request):
            raise HTTPException(status_code=401, detail="Accès non autorisé")
        
        codes = await db.lifetime_codes.find({}, {"_id": 0}).to_list(1000)
        return {"codes": codes}
    
    @admin_router.get("/users")
    async def list_users(request: Request):
        """List all users"""
        if not await verify_admin(request):
            raise HTTPException(status_code=401, detail="Accès non autorisé")
        
        users = await db.users.find(
            {},
            {"_id": 0, "password_hash": 0}
        ).sort("created_at", -1).to_list(1000)
        return {"users": users}
    
    @admin_router.get("/transactions")
    async def list_transactions(request: Request):
        """List all transactions"""
        if not await verify_admin(request):
            raise HTTPException(status_code=401, detail="Accès non autorisé")
        
        transactions = await db.payment_transactions.find(
            {},
            {"_id": 0}
        ).sort("created_at", -1).to_list(1000)
        return {"transactions": transactions}
    
    # Register routers
    app.include_router(auth_router)
    app.include_router(subscription_router)
    app.include_router(admin_router)
