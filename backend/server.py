from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timedelta
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# LLM Key
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')

app = FastAPI()
api_router = APIRouter(prefix="/api")

# ==================== MODELS ====================

class MoodEntry(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    mood: str
    energy_level: int  # 1-5
    notes: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class MoodCreate(BaseModel):
    mood: str
    energy_level: int
    notes: Optional[str] = None

class TimeCapsule(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    content: str
    prompt_used: Optional[str] = None
    duration_days: int
    created_at: datetime = Field(default_factory=datetime.utcnow)
    unlock_at: datetime
    is_sealed: bool = True
    share_link: Optional[str] = None

class TimeCapsuleCreate(BaseModel):
    title: str
    content: str
    prompt_used: Optional[str] = None
    duration_days: int  # 7, 30, 90, 180, 365

class DreamEntry(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    content: str
    dream_type: str  # reve, cauchemar, lucide, recurrent
    emotions: List[str]
    symbols: List[str] = []
    interpretation: Optional[str] = None
    date: datetime = Field(default_factory=datetime.utcnow)

class DreamCreate(BaseModel):
    title: str
    content: str
    dream_type: str
    emotions: List[str]

class DreamInterpretRequest(BaseModel):
    dream_content: str
    dream_type: str
    emotions: List[str]

# ==================== WRITING PROMPTS ====================

WRITING_PROMPTS = [
    "Qu'est-ce qui t'a fait sourire aujourd'hui ?",
    "Si tu pouvais envoyer un message à ton toi du futur, que dirais-tu ?",
    "Décris un moment où tu t'es senti(e) vraiment en paix.",
    "Quelle leçon la vie t'a-t-elle apprise récemment ?",
    "Qu'est-ce que tu aimerais lâcher prise aujourd'hui ?",
    "Écris une lettre à quelqu'un que tu ne peux pas contacter.",
    "Quel rêve secret portes-tu en toi ?",
    "Décris ton endroit de paix idéal.",
    "Qu'est-ce qui te rend unique ?",
    "Si la lune pouvait t'écouter ce soir, que lui confierais-tu ?",
    "Quel souvenir voudrais-tu préserver pour toujours ?",
    "Qu'est-ce que tu te pardonnes aujourd'hui ?",
]

# ==================== CELTIC ASTROLOGY DATA ====================

CELTIC_TREE_ZODIAC = [
    {"tree": "Bouleau", "dates": "24 déc - 20 jan", "symbol": "🌳", "meaning": "Renouveau, purification, nouveaux départs", "personality": "Ambitieux, motivé, leader naturel"},
    {"tree": "Sorbier", "dates": "21 jan - 17 fév", "symbol": "🍃", "meaning": "Vision, protection, transformation", "personality": "Visionnaire, original, penseur profond"},
    {"tree": "Frêne", "dates": "18 fév - 17 mars", "symbol": "🌿", "meaning": "Connexion, intuition, imagination", "personality": "Artistique, intuitif, rêveur"},
    {"tree": "Aulne", "dates": "18 mars - 14 avril", "symbol": "🌲", "meaning": "Courage, passion, force", "personality": "Courageux, confiant, charismatique"},
    {"tree": "Saule", "dates": "15 avril - 12 mai", "symbol": "🌾", "meaning": "Cycles lunaires, émotions, intuition", "personality": "Sensible, patient, résilient"},
    {"tree": "Aubépine", "dates": "13 mai - 9 juin", "symbol": "🌸", "meaning": "Contraste, dualité, adaptabilité", "personality": "Curieux, créatif, adaptable"},
    {"tree": "Chêne", "dates": "10 juin - 7 juil", "symbol": "🌳", "meaning": "Force, stabilité, sagesse", "personality": "Protecteur, généreux, optimiste"},
    {"tree": "Houx", "dates": "8 juil - 4 août", "symbol": "🍀", "meaning": "Royauté, défis, persévérance", "personality": "Noble, ambitieux, compétitif"},
    {"tree": "Noisetier", "dates": "5 août - 1 sept", "symbol": "🥜", "meaning": "Sagesse, connaissance, inspiration", "personality": "Intelligent, analytique, efficace"},
    {"tree": "Vigne", "dates": "2 sept - 29 sept", "symbol": "🍇", "meaning": "Raffinement, équilibre, harmonie", "personality": "Raffiné, charmant, indécis"},
    {"tree": "Lierre", "dates": "30 sept - 27 oct", "symbol": "🌿", "meaning": "Transformation, survie, détermination", "personality": "Loyal, compassionné, spirituel"},
    {"tree": "Roseau", "dates": "28 oct - 24 nov", "symbol": "🌾", "meaning": "Secret, vérité, complexité", "personality": "Mystérieux, courageux, fier"},
    {"tree": "Sureau", "dates": "25 nov - 23 déc", "symbol": "🌺", "meaning": "Fin et commencement, liberté", "personality": "Libre-esprit, extraverti, philosophe"},
]

# ==================== WESTERN ASTROLOGY HOUSES ====================

ASTROLOGY_HOUSES = [
    {
        "number": 1,
        "name": "Maison I - L'Ascendant",
        "theme": "Le Moi",
        "description": "Représente votre personnalité, apparence physique et la façon dont les autres vous perçoivent. C'est le masque que vous portez face au monde.",
        "governs": ["Apparence", "Première impression", "Identité", "Vitalité"]
    },
    {
        "number": 2,
        "name": "Maison II - Les Possessions",
        "theme": "Les Ressources",
        "description": "Liée à vos valeurs matérielles, vos finances et ce que vous possédez. Elle révèle votre rapport à l'argent et à la sécurité.",
        "governs": ["Argent", "Possessions", "Valeurs", "Estime de soi"]
    },
    {
        "number": 3,
        "name": "Maison III - La Communication",
        "theme": "L'Expression",
        "description": "Gouverne la communication, l'apprentissage, les frères et sœurs et l'environnement proche. Elle montre comment vous pensez et communiquez.",
        "governs": ["Communication", "Éducation", "Voyages courts", "Fratrie"]
    },
    {
        "number": 4,
        "name": "Maison IV - Le Foyer",
        "theme": "Les Racines",
        "description": "Représente la famille, le foyer, les racines et la vie privée. C'est le fondement émotionnel de votre être.",
        "governs": ["Famille", "Maison", "Héritage", "Fin de vie"]
    },
    {
        "number": 5,
        "name": "Maison V - La Créativité",
        "theme": "L'Expression Créative",
        "description": "Liée à la créativité, les plaisirs, les enfants et les romances. Elle révèle ce qui vous apporte de la joie.",
        "governs": ["Créativité", "Romance", "Enfants", "Loisirs"]
    },
    {
        "number": 6,
        "name": "Maison VI - Le Service",
        "theme": "La Santé & le Travail",
        "description": "Gouverne le travail quotidien, la santé et les routines. Elle montre votre approche du service et du bien-être.",
        "governs": ["Santé", "Travail quotidien", "Routines", "Animaux"]
    },
    {
        "number": 7,
        "name": "Maison VII - Les Partenariats",
        "theme": "Les Relations",
        "description": "Représente le mariage, les associations et les contrats. C'est le miroir de votre Maison I - comment vous vous reliez aux autres.",
        "governs": ["Mariage", "Partenariats", "Contrats", "Ennemis déclarés"]
    },
    {
        "number": 8,
        "name": "Maison VIII - La Transformation",
        "theme": "La Renaissance",
        "description": "Liée à la mort, la renaissance, la sexualité et les ressources partagées. Elle gouverne les transformations profondes.",
        "governs": ["Transformation", "Héritage", "Sexualité", "Mystères"]
    },
    {
        "number": 9,
        "name": "Maison IX - La Philosophie",
        "theme": "L'Expansion",
        "description": "Gouverne les voyages lointains, l'enseignement supérieur et la spiritualité. Elle représente votre quête de sens.",
        "governs": ["Voyages", "Philosophie", "Religion", "Études supérieures"]
    },
    {
        "number": 10,
        "name": "Maison X - La Carrière",
        "theme": "La Destinée",
        "description": "Représente la carrière, la réputation et le statut social. C'est votre place dans le monde et vos ambitions.",
        "governs": ["Carrière", "Réputation", "Ambition", "Figure d'autorité"]
    },
    {
        "number": 11,
        "name": "Maison XI - Les Espoirs",
        "theme": "Les Aspirations",
        "description": "Liée aux amis, aux groupes et aux idéaux. Elle révèle vos espoirs pour le futur et votre place dans la communauté.",
        "governs": ["Amitiés", "Groupes", "Espoirs", "Idéaux humanitaires"]
    },
    {
        "number": 12,
        "name": "Maison XII - L'Inconscient",
        "theme": "Le Caché",
        "description": "Gouverne l'inconscient, les secrets et la spiritualité profonde. C'est le royaume du karma et des vies passées.",
        "governs": ["Inconscient", "Secrets", "Karma", "Retraite spirituelle"]
    }
]

# ==================== DREAM INTERPRETATION SYSTEM ====================

DREAM_SYMBOLS_DATABASE = {
    "eau": "Émotions, inconscient, purification, changement",
    "vol": "Liberté, ambition, désir d'évasion, transcendance",
    "chute": "Perte de contrôle, anxiété, insécurité, lâcher-prise",
    "mort": "Transformation, fin d'un cycle, renouveau, changement profond",
    "maison": "Le soi, la psyché, sécurité, aspects de la personnalité",
    "animal": "Instincts, nature sauvage, qualités spécifiques selon l'animal",
    "serpent": "Transformation, guérison, sagesse cachée, peurs primales",
    "enfant": "Innocence, nouveau projet, vulnérabilité, potentiel",
    "poursuite": "Évitement, fuite de problèmes, anxiété, confrontation nécessaire",
    "dent": "Image de soi, vieillissement, communication, pouvoir",
    "feu": "Passion, colère, transformation, purification, énergie",
    "forêt": "Inconscient, exploration intérieure, confusion, mystère",
    "lune": "Féminin, intuition, cycles, émotions cachées",
    "soleil": "Conscience, vitalité, succès, masculin, clarté",
    "miroir": "Réflexion sur soi, vérité, identité, introspection",
    "porte": "Nouvelles opportunités, transitions, choix, passages",
    "escalier": "Progression, évolution spirituelle, ascension ou descente",
    "véhicule": "Direction de vie, contrôle, voyage personnel",
    "examen": "Auto-évaluation, peur de l'échec, préparation",
    "nudité": "Vulnérabilité, authenticité, peur du jugement"
}

async def interpret_dream_with_ai(dream_content: str, dream_type: str, emotions: List[str]) -> str:
    """Use AI to interpret a dream based on multiple dream analysis traditions"""
    
    system_prompt = """Tu es un expert en interprétation des rêves, formé dans plusieurs traditions :

1. **Psychanalyse Freudienne** : Les rêves comme réalisation de désirs inconscients
2. **Psychologie Jungienne** : Archétypes, inconscient collectif, individuation
3. **Tradition Onirique Celtique** : Connexion aux mondes invisibles, messages des ancêtres
4. **Interprétation Symbolique Universelle** : Symboles transculturels et leur signification
5. **Approche Gestalt** : Chaque élément du rêve comme partie du rêveur

Analyse le rêve de manière bienveillante et perspicace. Fournis :
- Les symboles clés identifiés et leur signification
- L'interprétation selon différentes écoles
- Un message ou conseil personnel
- Les thèmes émotionnels sous-jacents

Réponds en français avec empathie et sagesse."""

    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"dream-{uuid.uuid4()}",
        system_message=system_prompt
    ).with_model("openai", "gpt-4o")

    user_prompt = f"""Voici le rêve à interpréter :

**Type de rêve** : {dream_type}
**Émotions ressenties** : {', '.join(emotions)}

**Description du rêve** :
{dream_content}

Merci de fournir une interprétation complète et éclairante."""

    try:
        response = await chat.send_message(UserMessage(text=user_prompt))
        return response
    except Exception as e:
        logging.error(f"Dream interpretation error: {e}")
        return "Désolé, l'interprétation n'a pas pu être générée. Veuillez réessayer."

# ==================== API ROUTES ====================

@api_router.get("/")
async def root():
    return {"message": "Astro Journal API"}

# --- Mood Routes ---
@api_router.post("/mood", response_model=MoodEntry)
async def create_mood(input: MoodCreate):
    mood_obj = MoodEntry(**input.dict())
    await db.moods.insert_one(mood_obj.dict())
    return mood_obj

@api_router.get("/mood", response_model=List[MoodEntry])
async def get_moods():
    moods = await db.moods.find().sort("timestamp", -1).to_list(100)
    return [MoodEntry(**m) for m in moods]

@api_router.get("/mood/latest", response_model=Optional[MoodEntry])
async def get_latest_mood():
    mood = await db.moods.find_one(sort=[("timestamp", -1)])
    return MoodEntry(**mood) if mood else None

# --- Writing Prompts ---
@api_router.get("/prompts")
async def get_prompts():
    return {"prompts": WRITING_PROMPTS}

# --- Time Capsule Routes ---
@api_router.post("/capsule", response_model=TimeCapsule)
async def create_capsule(input: TimeCapsuleCreate):
    unlock_date = datetime.utcnow() + timedelta(days=input.duration_days)
    capsule_id = str(uuid.uuid4())
    share_link = f"capsule/{capsule_id}"
    
    capsule = TimeCapsule(
        id=capsule_id,
        title=input.title,
        content=input.content,
        prompt_used=input.prompt_used,
        duration_days=input.duration_days,
        unlock_at=unlock_date,
        share_link=share_link
    )
    await db.capsules.insert_one(capsule.dict())
    return capsule

@api_router.get("/capsules", response_model=List[TimeCapsule])
async def get_capsules():
    capsules = await db.capsules.find().sort("created_at", -1).to_list(100)
    return [TimeCapsule(**c) for c in capsules]

@api_router.get("/capsule/{capsule_id}")
async def get_capsule(capsule_id: str):
    capsule = await db.capsules.find_one({"id": capsule_id})
    if not capsule:
        raise HTTPException(status_code=404, detail="Capsule not found")
    
    capsule_obj = TimeCapsule(**capsule)
    now = datetime.utcnow()
    
    if now < capsule_obj.unlock_at:
        # Return limited info if still sealed
        return {
            "id": capsule_obj.id,
            "title": capsule_obj.title,
            "is_sealed": True,
            "unlock_at": capsule_obj.unlock_at,
            "created_at": capsule_obj.created_at,
            "days_remaining": (capsule_obj.unlock_at - now).days
        }
    
    # Return full content if unlocked
    return {**capsule_obj.dict(), "is_sealed": False}

# --- Dream Journal Routes ---
@api_router.post("/dream", response_model=DreamEntry)
async def create_dream(input: DreamCreate):
    dream = DreamEntry(**input.dict())
    await db.dreams.insert_one(dream.dict())
    return dream

@api_router.get("/dreams", response_model=List[DreamEntry])
async def get_dreams():
    dreams = await db.dreams.find().sort("date", -1).to_list(100)
    return [DreamEntry(**d) for d in dreams]

@api_router.get("/dream/{dream_id}", response_model=DreamEntry)
async def get_dream(dream_id: str):
    dream = await db.dreams.find_one({"id": dream_id})
    if not dream:
        raise HTTPException(status_code=404, detail="Dream not found")
    return DreamEntry(**dream)

@api_router.post("/dream/interpret")
async def interpret_dream(request: DreamInterpretRequest):
    interpretation = await interpret_dream_with_ai(
        request.dream_content,
        request.dream_type,
        request.emotions
    )
    return {"interpretation": interpretation}

@api_router.put("/dream/{dream_id}/interpretation")
async def save_dream_interpretation(dream_id: str, interpretation: str):
    result = await db.dreams.update_one(
        {"id": dream_id},
        {"$set": {"interpretation": interpretation}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Dream not found")
    return {"success": True}

# --- Astrology Routes ---
@api_router.get("/astrology/houses")
async def get_astrology_houses():
    return {"houses": ASTROLOGY_HOUSES}

@api_router.get("/astrology/celtic")
async def get_celtic_zodiac():
    return {"trees": CELTIC_TREE_ZODIAC}

@api_router.get("/astrology/celtic/{birth_date}")
async def get_celtic_sign(birth_date: str):
    """Get Celtic tree sign based on birth date (format: MM-DD)"""
    try:
        month, day = map(int, birth_date.split("-"))
        
        # Celtic tree zodiac date ranges
        date_ranges = [
            ((12, 24), (1, 20), 0),   # Bouleau
            ((1, 21), (2, 17), 1),    # Sorbier
            ((2, 18), (3, 17), 2),    # Frêne
            ((3, 18), (4, 14), 3),    # Aulne
            ((4, 15), (5, 12), 4),    # Saule
            ((5, 13), (6, 9), 5),     # Aubépine
            ((6, 10), (7, 7), 6),     # Chêne
            ((7, 8), (8, 4), 7),      # Houx
            ((8, 5), (9, 1), 8),      # Noisetier
            ((9, 2), (9, 29), 9),     # Vigne
            ((9, 30), (10, 27), 10),  # Lierre
            ((10, 28), (11, 24), 11), # Roseau
            ((11, 25), (12, 23), 12), # Sureau
        ]
        
        for start, end, index in date_ranges:
            if start[0] <= end[0]:  # Same year range
                if (month == start[0] and day >= start[1]) or \
                   (month == end[0] and day <= end[1]) or \
                   (start[0] < month < end[0]):
                    return CELTIC_TREE_ZODIAC[index]
            else:  # Cross-year range (Dec-Jan)
                if (month == start[0] and day >= start[1]) or \
                   (month == end[0] and day <= end[1]):
                    return CELTIC_TREE_ZODIAC[index]
        
        return {"error": "Date not found in Celtic zodiac"}
    except:
        raise HTTPException(status_code=400, detail="Invalid date format. Use MM-DD")

@api_router.get("/symbols")
async def get_dream_symbols():
    return {"symbols": DREAM_SYMBOLS_DATABASE}

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
