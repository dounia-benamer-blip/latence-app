"""
Notification Service for Latence App
Handles scheduled notifications for capsules and letters
"""

from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorDatabase
import httpx

async def send_expo_push(push_token: str, title: str, body: str, data: dict = None):
    """Send push notification via Expo Push Service"""
    if not push_token:
        return False
    
    message = {
        "to": push_token,
        "sound": "default",
        "title": title,
        "body": body,
        "badge": 1,
    }
    if data:
        message["data"] = data
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://exp.host/--/api/v2/push/send",
                json=message,
                headers={
                    "Accept": "application/json",
                    "Accept-encoding": "gzip, deflate",
                    "Content-Type": "application/json",
                }
            )
            return response.status_code == 200
    except Exception as e:
        print(f"Push notification error: {e}")
        return False

async def check_and_send_capsule_notifications(db: AsyncIOMotorDatabase):
    """Check for capsules ready to open and send notifications"""
    now = datetime.now(timezone.utc)
    
    # Find capsules that are ready to open but not yet notified
    capsules = await db.capsules.find({
        "unlock_date": {"$lte": now},
        "notified": {"$ne": True},
        "is_opened": {"$ne": True}
    }, {"_id": 0}).to_list(100)
    
    for capsule in capsules:
        user_id = capsule.get("user_id")
        if not user_id:
            continue
        
        # Get user's push token
        user = await db.users.find_one({"user_id": user_id}, {"_id": 0, "push_token": 1, "name": 1})
        if not user or not user.get("push_token"):
            continue
        
        # Send notification
        key_type = capsule.get("key_type", "")
        key_names = {
            "emerald": "Émeraude",
            "sapphire": "Saphir", 
            "amethyst": "Améthyste",
            "amber": "Ambre",
            "ruby": "Rubis",
            "gold": "Or"
        }
        key_name = key_names.get(key_type, key_type)
        
        await send_expo_push(
            user["push_token"],
            "Ta capsule est prête !",
            f"Ta capsule {key_name} peut maintenant être ouverte. Viens redécouvrir tes pensées passées.",
            {"type": "capsule_ready", "capsule_id": capsule.get("capsule_id", "")}
        )
        
        # Mark as notified
        await db.capsules.update_one(
            {"capsule_id": capsule.get("capsule_id")},
            {"$set": {"notified": True}}
        )
    
    return len(capsules)

async def check_and_send_letter_notifications(db: AsyncIOMotorDatabase):
    """Check for letters ready to be delivered and send notifications"""
    now = datetime.now(timezone.utc)
    
    # Find letters that are ready but not delivered
    letters = await db.letters.find({
        "delivery_date": {"$lte": now},
        "delivered": {"$ne": True}
    }, {"_id": 0}).to_list(100)
    
    for letter in letters:
        user_id = letter.get("user_id")
        if not user_id:
            continue
        
        # Get user's push token
        user = await db.users.find_one({"user_id": user_id}, {"_id": 0, "push_token": 1, "name": 1})
        if not user or not user.get("push_token"):
            continue
        
        # Send notification
        await send_expo_push(
            user["push_token"],
            "Une lettre pour toi",
            "Tu as reçu une lettre de ton passé. Viens la lire.",
            {"type": "letter_delivered", "letter_id": letter.get("letter_id", "")}
        )
        
        # Mark as delivered
        await db.letters.update_one(
            {"letter_id": letter.get("letter_id")},
            {"$set": {"delivered": True, "delivered_at": now}}
        )
    
    return len(letters)

async def send_daily_reminder(db: AsyncIOMotorDatabase, hour: int = 20):
    """Send daily journaling reminder (default 8 PM)"""
    now = datetime.now(timezone.utc)
    
    # Only run at the specified hour
    if now.hour != hour:
        return 0
    
    # Get users who haven't journaled today and have push tokens
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    
    # Find users with push tokens
    users = await db.users.find(
        {"push_token": {"$exists": True, "$ne": None}},
        {"_id": 0, "user_id": 1, "push_token": 1, "name": 1}
    ).to_list(10000)
    
    sent = 0
    for user in users:
        # Check if user has journaled today
        today_entry = await db.capsules.find_one({
            "user_id": user["user_id"],
            "created_at": {"$gte": today_start}
        })
        
        if not today_entry:
            messages = [
                "Prends un moment pour toi ce soir.",
                "Quelques mots avant de dormir ?",
                "La lune t'attend pour recevoir tes pensées.",
                "Un moment d'introspection avant la nuit.",
            ]
            import random
            message = random.choice(messages)
            
            await send_expo_push(
                user["push_token"],
                "Latence",
                message,
                {"type": "daily_reminder"}
            )
            sent += 1
    
    return sent
