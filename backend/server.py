from fastapi import FastAPI, APIRouter, HTTPException
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import random
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

# ==================== SACRED TEXTS DATABASE ====================
# Texts from various wisdom traditions - presented without religious labels

SACRED_TEXTS = {
    "serein": [
        {"text": "L'eau qui reste immobile devient claire.", "source": "Lao Tseu"},
        {"text": "La paix vient de l'intérieur. Ne la cherchez pas à l'extérieur.", "source": "Sagesse ancienne"},
        {"text": "Sois comme l'eau qui trouve toujours son chemin.", "source": "Proverbe"},
        {"text": "Le calme est la clé de toute clarté.", "source": "Marc Aurèle"},
        {"text": "Dans le silence, l'âme trouve ses réponses.", "source": "Rumi"},
        {"text": "La sérénité n'est pas d'être à l'abri de la tempête, mais de trouver la paix au cœur de celle-ci.", "source": "Sagesse soufie"},
    ],
    "joyeux": [
        {"text": "La joie est la forme la plus simple de la gratitude.", "source": "Karl Barth"},
        {"text": "Le bonheur n'est pas une destination, c'est une manière de voyager.", "source": "Proverbe"},
        {"text": "Celui qui sourit au lieu de s'emporter est toujours le plus fort.", "source": "Sagesse japonaise"},
        {"text": "La joie est un filet d'amour par lequel tu peux attraper les âmes.", "source": "Mère Teresa"},
        {"text": "Chaque jour est un don, chaque instant une grâce.", "source": "Khalil Gibran"},
        {"text": "Le sourire que tu envoies revient vers toi.", "source": "Proverbe hindou"},
    ],
    "reveur": [
        {"text": "Tous ceux qui errent ne sont pas perdus.", "source": "J.R.R. Tolkien"},
        {"text": "Les rêves sont les lettres que l'inconscient nous écrit.", "source": "Carl Jung"},
        {"text": "L'imagination est plus importante que le savoir.", "source": "Albert Einstein"},
        {"text": "Le monde n'est qu'un pont, traverse-le mais n'y construis pas ta demeure.", "source": "Sagesse ancienne"},
        {"text": "Celui qui rêve marche à la lumière des étoiles.", "source": "Proverbe berbère"},
        {"text": "Les rêves sont la porte vers l'âme.", "source": "Sagesse mystique"},
    ],
    "melancolique": [
        {"text": "La blessure est l'endroit par où la lumière entre en vous.", "source": "Rumi"},
        {"text": "Même la nuit la plus longue prendra fin avec l'aube.", "source": "Proverbe"},
        {"text": "Dans les profondeurs de l'hiver, j'appris enfin qu'il y avait en moi un été invincible.", "source": "Albert Camus"},
        {"text": "Les larmes sont la pluie de l'âme.", "source": "Sagesse ancienne"},
        {"text": "Ce qui te manque t'enseigne ce qui compte.", "source": "Khalil Gibran"},
        {"text": "La mélancolie est le bonheur d'être triste.", "source": "Victor Hugo"},
    ],
    "fatigue": [
        {"text": "Le repos fait partie du travail.", "source": "Proverbe"},
        {"text": "Comme un champ, l'esprit doit se reposer pour donner une bonne récolte.", "source": "Sénèque"},
        {"text": "Le silence est un ami qui ne trahit jamais.", "source": "Confucius"},
        {"text": "Dieu a fait le sommeil pour guérir les blessures de l'âme.", "source": "Sagesse ancienne"},
        {"text": "Celui qui dort ouvre la porte aux rêves.", "source": "Proverbe arabe"},
        {"text": "Le repos est la clé de la force retrouvée.", "source": "Marc Aurèle"},
    ],
    "inspire": [
        {"text": "Ce que tu cherches te cherche aussi.", "source": "Rumi"},
        {"text": "L'inspiration existe, mais elle doit te trouver au travail.", "source": "Pablo Picasso"},
        {"text": "Tu dois être le changement que tu veux voir dans le monde.", "source": "Gandhi"},
        {"text": "L'âme qui a contemplé une beauté reste marquée à jamais.", "source": "Platon"},
        {"text": "La créativité, c'est l'intelligence qui s'amuse.", "source": "Albert Einstein"},
        {"text": "Chaque pensée est une graine qui peut devenir forêt.", "source": "Sagesse bouddhiste"},
    ],
    "anxieux": [
        {"text": "Ne te soucie pas du lendemain, car le lendemain aura soin de lui-même.", "source": "Sagesse ancienne"},
        {"text": "La peur frappe à la porte, la foi ouvre, il n'y a personne.", "source": "Proverbe"},
        {"text": "Ce sur quoi tu portes ton attention grandit.", "source": "Sagesse amérindienne"},
        {"text": "L'anxiété ne vide pas demain de ses soucis, elle vide aujourd'hui de sa force.", "source": "Corrie ten Boom"},
        {"text": "Respire. Laisse aller. Et rappelle-toi que ce moment est le seul que tu sais avoir.", "source": "Oprah Winfrey"},
        {"text": "La patience est un arbre dont la racine est amère mais le fruit très doux.", "source": "Proverbe persan"},
    ],
    "nostalgique": [
        {"text": "Les souvenirs sont les parfums de l'âme.", "source": "George Sand"},
        {"text": "Ce que nous gardons dans notre mémoire est à nous pour toujours.", "source": "Sagesse ancienne"},
        {"text": "Le passé est un prologue.", "source": "Shakespeare"},
        {"text": "Nous ne regardons pas en arrière avec regret, mais avec gratitude.", "source": "Khalil Gibran"},
        {"text": "Chaque souvenir est un trésor que le temps ne peut voler.", "source": "Proverbe"},
        {"text": "Le cœur se souvient de ce que l'esprit oublie.", "source": "Sagesse celte"},
    ],
    "perdu": [
        {"text": "C'est en se perdant qu'on se retrouve.", "source": "Proverbe"},
        {"text": "Parfois, le chemin le plus long est le raccourci vers soi-même.", "source": "Sagesse soufie"},
        {"text": "Au milieu de la difficulté se trouve l'opportunité.", "source": "Albert Einstein"},
        {"text": "Quand tu ne sais pas où tu vas, regarde d'où tu viens.", "source": "Proverbe africain"},
        {"text": "La confusion précède la clarté comme la nuit précède l'aube.", "source": "Sagesse ancienne"},
        {"text": "Se perdre est le premier pas pour se trouver.", "source": "Rumi"},
    ],
    "reconnaissant": [
        {"text": "La gratitude transforme ce que nous avons en suffisance.", "source": "Melody Beattie"},
        {"text": "Celui qui ne remercie pas pour peu ne remerciera pas pour beaucoup.", "source": "Proverbe"},
        {"text": "La reconnaissance est la mémoire du cœur.", "source": "Hans Christian Andersen"},
        {"text": "Béni soit celui qui a appris à admirer mais pas à envier.", "source": "Sagesse ancienne"},
        {"text": "Le secret du bonheur est de compter ses bénédictions pendant que d'autres comptent leurs problèmes.", "source": "William Penn"},
        {"text": "Un cœur reconnaissant est un aimant à miracles.", "source": "Proverbe"},
    ],
    "contemplatif": [
        {"text": "Connais-toi toi-même.", "source": "Oracle de Delphes"},
        {"text": "L'œil par lequel je vois Dieu est le même œil par lequel Dieu me voit.", "source": "Maître Eckhart"},
        {"text": "La méditation n'est pas une évasion mais une rencontre sereine avec la réalité.", "source": "Thich Nhat Hanh"},
        {"text": "Regarde en toi-même. Tout ce dont tu as besoin s'y trouve.", "source": "Rumi"},
        {"text": "Le silence est le langage de Dieu, tout le reste n'est que traduction.", "source": "Rumi"},
        {"text": "L'univers est un livre dont nous sommes les lettres.", "source": "Ibn Arabi"},
    ],
    "eveille": [
        {"text": "S'éveiller, c'est voir le miracle dans l'ordinaire.", "source": "Sagesse zen"},
        {"text": "La conscience est le premier pas vers la transformation.", "source": "Carl Jung"},
        {"text": "Chaque matin est une nouvelle naissance.", "source": "Sagesse hindoue"},
        {"text": "L'éveil n'est pas de devenir quelqu'un d'autre, mais de devenir vraiment soi-même.", "source": "Thich Nhat Hanh"},
        {"text": "Celui qui s'éveille à lui-même s'éveille au monde.", "source": "Proverbe"},
        {"text": "La vraie vision commence quand les yeux se ferment.", "source": "Sagesse soufie"},
    ],
}

# Book recommendations by mood
BOOK_RECOMMENDATIONS = {
    "serein": [
        {"title": "L'Art de la simplicité", "author": "Dominique Loreau", "why": "Pour cultiver la paix intérieure"},
        {"title": "Le Prophète", "author": "Khalil Gibran", "why": "Poésie sur la vie et l'âme"},
        {"title": "Méditations", "author": "Marc Aurèle", "why": "Sagesse stoïcienne pour l'équilibre"},
    ],
    "melancolique": [
        {"title": "Les Fleurs du Mal", "author": "Charles Baudelaire", "why": "La beauté dans la mélancolie"},
        {"title": "Le Livre de l'intranquillité", "author": "Fernando Pessoa", "why": "Compagnon des âmes rêveuses"},
        {"title": "La Nuit", "author": "Elie Wiesel", "why": "Traverser l'obscurité vers la lumière"},
    ],
    "inspire": [
        {"title": "Lettres à un jeune poète", "author": "Rainer Maria Rilke", "why": "Nourrir ta flamme créatrice"},
        {"title": "Le Pouvoir du moment présent", "author": "Eckhart Tolle", "why": "Ancrage dans l'instant créatif"},
        {"title": "L'Alchimiste", "author": "Paulo Coelho", "why": "Suivre ta légende personnelle"},
    ],
    "anxieux": [
        {"title": "L'Art de la méditation", "author": "Matthieu Ricard", "why": "Techniques pour apaiser l'esprit"},
        {"title": "Siddhartha", "author": "Hermann Hesse", "why": "Voyage vers la paix intérieure"},
        {"title": "Autobiography of a Yogi", "author": "Paramahansa Yogananda", "why": "Trouver le calme dans le chaos"},
    ],
    "reveur": [
        {"title": "Les Rêves et les moyens de les diriger", "author": "Léon d'Hervey de Saint-Denys", "why": "Explorer tes rêves lucides"},
        {"title": "Le Petit Prince", "author": "Antoine de Saint-Exupéry", "why": "Voir avec les yeux de l'âme"},
        {"title": "Cent ans de solitude", "author": "Gabriel García Márquez", "why": "Voyage dans le réalisme magique"},
    ],
    "default": [
        {"title": "Le Prophète", "author": "Khalil Gibran", "why": "Sagesse universelle pour toutes les humeurs"},
        {"title": "Ainsi parlait Zarathoustra", "author": "Friedrich Nietzsche", "why": "Réflexion profonde sur l'existence"},
        {"title": "L'Étranger", "author": "Albert Camus", "why": "Méditation sur le sens de la vie"},
    ],
}

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

# --- Sacred Texts and Poetic AI Routes ---

class SacredTextRequest(BaseModel):
    mood: str

class CompanionRequest(BaseModel):
    mood: str
    energy_level: int
    message: Optional[str] = None

class LunarReadingRequest(BaseModel):
    moon_phase: str
    mansion: Optional[str] = None
    question: Optional[str] = None

class JournalEntry(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    content: str
    date: datetime = Field(default_factory=datetime.utcnow)
    mood: Optional[str] = None
    energy_level: Optional[int] = None

class JournalCreate(BaseModel):
    content: str
    date: Optional[str] = None

class AstrologyProfileCreate(BaseModel):
    name: str
    birth_date: str  # DD/MM/YYYY
    birth_place: str
    birth_hour: Optional[str] = None  # HH:MM (24h format)

class AstrologyProfileResponse(BaseModel):
    id: str
    name: str
    birth_date: str
    birth_place: str
    birth_hour: Optional[str] = None
    zodiac_sign: Optional[dict] = None
    ascendant: Optional[dict] = None
    celtic_tree: Optional[dict] = None
    arabic_mansion: Optional[dict] = None
    lunar_house: Optional[dict] = None
    moon_phase_at_birth: Optional[dict] = None
    ai_interpretation: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class JournalInterpretRequest(BaseModel):
    content: str
    mood: Optional[str] = None

@api_router.get("/sacred-text/{mood}")
async def get_sacred_text(mood: str):
    """Get a random sacred text based on current mood"""
    texts = SACRED_TEXTS.get(mood, SACRED_TEXTS.get("serein", []))
    if not texts:
        texts = SACRED_TEXTS["serein"]
    selected = random.choice(texts)
    return {"text": selected["text"], "source": selected["source"]}

@api_router.get("/book-recommendations/{mood}")
async def get_book_recommendations(mood: str):
    """Get book recommendations based on mood"""
    books = BOOK_RECOMMENDATIONS.get(mood, BOOK_RECOMMENDATIONS["default"])
    return {"recommendations": books}

@api_router.post("/companion/chat")
async def companion_chat(request: CompanionRequest):
    """AI companion that chats poetically about feelings - never medical"""
    
    system_prompt = """Tu es un compagnon poétique et bienveillant. Tu accompagnes les âmes dans leur voyage intérieur avec douceur et sagesse.

RÈGLES ABSOLUES :
- Tu n'es JAMAIS un thérapeute ou médecin
- Tu ne donnes JAMAIS de conseils médicaux
- Tu parles de manière poétique, métaphorique, comme un sage ou un poète
- Tu poses des questions ouvertes qui invitent à l'introspection
- Tu utilises des images de la nature, des étoiles, de la lune
- Tu es comme un ami sage qui écoute sans juger
- Tes réponses sont courtes et évocatrices (2-4 phrases)
- Tu vouvoies avec respect mais chaleur

STYLE :
- Poétique mais accessible
- Mystérieux mais réconfortant
- Profond mais léger
- Comme une conversation au clair de lune

Tu accompagnes, tu écoutes, tu inspires - jamais tu ne soignes."""

    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"companion-{uuid.uuid4()}",
        system_message=system_prompt
    ).with_model("openai", "gpt-4o")

    mood_context = {
        "serein": "apaisé et en paix",
        "joyeux": "rayonnant de joie",
        "reveur": "dans un état rêveur",
        "melancolique": "traversant une mélancolie",
        "fatigue": "en quête de repos",
        "inspire": "porté par l'inspiration",
        "anxieux": "agité par des inquiétudes",
        "nostalgique": "bercé par la nostalgie",
        "perdu": "en quête de direction",
        "reconnaissant": "empli de gratitude",
        "contemplatif": "dans la contemplation",
        "eveille": "éveillé et conscient",
    }
    
    mood_text = mood_context.get(request.mood, "dans un état particulier")
    energy_text = "une énergie douce" if request.energy_level <= 2 else "une énergie équilibrée" if request.energy_level <= 4 else "une énergie vibrante"
    
    if request.message:
        user_prompt = f"La personne se sent {mood_text} avec {energy_text}. Elle vous dit : '{request.message}'"
    else:
        user_prompt = f"La personne arrive, se sentant {mood_text} avec {energy_text}. Accueillez-la avec une question poétique qui l'invite à explorer ce qu'elle ressent."

    try:
        response = await chat.send_message(UserMessage(text=user_prompt))
        return {"response": response}
    except Exception as e:
        logging.error(f"Companion chat error: {e}")
        return {"response": "Les étoiles murmurent doucement ce soir... Que porte votre cœur en ce moment ?"}

@api_router.post("/lunar-reading")
async def get_lunar_reading(request: LunarReadingRequest):
    """Get an AI-generated lunar reading based on moon phase"""
    
    system_prompt = """Tu es un oracle lunaire poétique. Tu interprètes les énergies de la lune et des étoiles avec sagesse et beauté.

STYLE :
- Poétique et évocateur
- Connecté aux cycles de la nature
- Mystérieux mais réconfortant
- Références aux éléments (eau, feu, terre, air)
- Métaphores de la nature, des saisons, des marées

Tes réponses font 3-5 phrases poétiques qui parlent à l'âme.
Tu ne prédis pas l'avenir, tu éclaires le présent."""

    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"lunar-{uuid.uuid4()}",
        system_message=system_prompt
    ).with_model("openai", "gpt-4o")

    prompt = f"La lune est en phase de {request.moon_phase}."
    if request.mansion:
        prompt += f" Elle traverse la demeure lunaire de {request.mansion}."
    if request.question:
        prompt += f" La personne demande guidance sur : {request.question}"
    else:
        prompt += " Offre une réflexion poétique sur l'énergie de ce moment."

    try:
        response = await chat.send_message(UserMessage(text=prompt))
        return {"reading": response}
    except Exception as e:
        logging.error(f"Lunar reading error: {e}")
        return {"reading": "La lune veille sur tes rêves cette nuit. Laisse-la te bercer de sa lumière argentée."}

# --- Journal Routes ---
@api_router.post("/journal")
async def create_journal_entry(input: JournalCreate):
    """Create a simple journal entry"""
    entry = JournalEntry(
        content=input.content,
        date=datetime.fromisoformat(input.date) if input.date else datetime.utcnow()
    )
    await db.journals.insert_one(entry.dict())
    return entry

@api_router.get("/journals")
async def get_journal_entries():
    """Get all journal entries"""
    entries = await db.journals.find().sort("date", -1).to_list(100)
    return [JournalEntry(**e) for e in entries]

# --- Astrology Profile Routes ---

def calculate_moon_phase_for_date(date: datetime):
    """Calculate moon phase for a given date"""
    year = date.year
    month = date.month
    day = date.day
    c = year // 100
    y = year - 100 * c
    mm = month + 12 if month < 3 else month
    yy = y - 1 if month < 3 else y
    jd = (int(365.25 * yy) + int(30.6 * mm) + day - 694039.09) / 29.53
    phase = jd % 1.0  # Always 0..1
    day_in_cycle = int(phase * 28) + 1
    phase_index = int(phase * 8) % 8
    phase_names = [
        "Nouvelle Lune", "Premier Croissant", "Premier Quartier",
        "Gibbeuse Croissante", "Pleine Lune", "Gibbeuse Décroissante",
        "Dernier Quartier", "Dernier Croissant"
    ]
    return {
        "name": phase_names[phase_index],
        "day_in_cycle": day_in_cycle,
        "phase_index": phase_index,
        "phase_value": round(phase, 4),
    }

def get_celtic_tree_for_date(month: int, day: int):
    """Get Celtic tree based on birth date"""
    date_ranges = [
        ((12, 24), (1, 20), "Bouleau", "Renouveau et purification"),
        ((1, 21), (2, 17), "Sorbier", "Vision et protection"),
        ((2, 18), (3, 17), "Frêne", "Connexion entre les mondes"),
        ((3, 18), (4, 14), "Aulne", "Courage et passion"),
        ((4, 15), (5, 12), "Saule", "Cycles lunaires et émotions"),
        ((5, 13), (6, 9), "Aubépine", "Dualité et transformation"),
        ((6, 10), (7, 7), "Chêne", "Force et sagesse"),
        ((7, 8), (8, 4), "Houx", "Royauté et persévérance"),
        ((8, 5), (9, 1), "Noisetier", "Sagesse et inspiration"),
        ((9, 2), (9, 29), "Vigne", "Raffinement et harmonie"),
        ((9, 30), (10, 27), "Lierre", "Transformation et survie"),
        ((10, 28), (11, 24), "Roseau", "Secret et vérité"),
        ((11, 25), (12, 23), "Sureau", "Fin et renaissance"),
    ]
    for start, end, tree, meaning in date_ranges:
        if start[0] > end[0]:
            if (month == start[0] and day >= start[1]) or (month == end[0] and day <= end[1]):
                return {"tree": tree, "meaning": meaning}
        else:
            if (month == start[0] and day >= start[1]) or \
               (month == end[0] and day <= end[1]) or \
               (start[0] < month < end[0]):
                return {"tree": tree, "meaning": meaning}
    return {"tree": "Bouleau", "meaning": "Renouveau et purification"}

def get_arabic_mansion_for_date(date: datetime):
    """Get Arabic lunar mansion based on moon phase"""
    moon = calculate_moon_phase_for_date(date)
    mansion_index = (moon["day_in_cycle"] - 1) % 28
    mansions = [
        {"number": i+1, "name": m["name"], "arabic": m["arabic"], "meaning": m["meaning"], "element": m.get("element", ""), "planet": m.get("planet", "")}
        for i, m in enumerate(ARABIC_MANSIONS_DATA)
    ] if 'ARABIC_MANSIONS_DATA' in dir() else []
    # Use simplified mansion data
    mansion_names = [
        "Al-Sharatain", "Al-Butain", "Al-Thurayya", "Al-Dabaran",
        "Al-Haq'a", "Al-Han'a", "Al-Dhira", "Al-Nathra",
        "Al-Tarf", "Al-Jabha", "Al-Zubra", "Al-Sarfa",
        "Al-Awwa", "Al-Simak", "Al-Ghafr", "Al-Zubana",
        "Al-Iklil", "Al-Qalb", "Al-Shaula", "Al-Na'a'im",
        "Al-Balda", "Sa'd al-Dhabih", "Sa'd Bula", "Sa'd al-Su'ud",
        "Sa'd al-Akhbiya", "Al-Fargh al-Muqaddam", "Al-Fargh al-Mu'akhkhar", "Batn al-Hut"
    ]
    return {"number": mansion_index + 1, "name": mansion_names[mansion_index]}

def calculate_lunar_house(phase_value: float):
    """Calculate Western astrological house from moon phase"""
    house_number = int(phase_value * 12) + 1
    if house_number > 12:
        house_number = 12
    house_data = ASTROLOGY_HOUSES[house_number - 1]
    return {"number": house_number, "name": house_data["name"], "theme": house_data["theme"]}

@api_router.post("/astrology/profile")
async def create_astrology_profile(input: AstrologyProfileCreate):
    """Create astrology profile with full calculations and AI interpretation"""
    # Parse birth date (DD/MM/YYYY)
    try:
        parts = input.birth_date.split('/')
        day, month, year = int(parts[0]), int(parts[1]), int(parts[2])
        birth_dt = datetime(year, month, day)
    except (ValueError, IndexError):
        raise HTTPException(status_code=400, detail="Format de date invalide. Utilisez JJ/MM/AAAA")

    # Calculate all astrological data
    moon_phase = calculate_moon_phase_for_date(birth_dt)
    celtic_tree = get_celtic_tree_for_date(month, day)
    arabic_mansion = get_arabic_mansion_for_date(birth_dt)
    lunar_house = calculate_lunar_house(moon_phase["phase_value"])

    # Generate AI interpretation
    ai_interpretation = await generate_astrology_interpretation(
        input.name, input.birth_date, input.birth_place,
        moon_phase, celtic_tree, arabic_mansion, lunar_house
    )

    profile_id = str(uuid.uuid4())
    profile = {
        "id": profile_id,
        "name": input.name,
        "birth_date": input.birth_date,
        "birth_place": input.birth_place,
        "celtic_tree": celtic_tree,
        "arabic_mansion": arabic_mansion,
        "lunar_house": lunar_house,
        "moon_phase_at_birth": moon_phase,
        "ai_interpretation": ai_interpretation,
        "created_at": datetime.utcnow(),
    }

    await db.astrology_profiles.update_one(
        {"name": input.name, "birth_date": input.birth_date},
        {"$set": profile},
        upsert=True
    )

    profile.pop("_id", None)
    profile["created_at"] = profile["created_at"].isoformat()
    return profile

async def generate_astrology_interpretation(name, birth_date, birth_place, moon_phase, celtic_tree, arabic_mansion, lunar_house):
    """Generate AI-powered astrological interpretation"""
    system_prompt = """Tu es un astrologue poétique et érudit, formé dans les traditions occidentale, celtique et arabe.
Tu rédiges des portraits astrologiques personnalisés avec sagesse, poésie et profondeur.

STYLE :
- Poétique mais accessible
- Profond et personnel (utilise le prénom de la personne)
- Références aux éléments naturels
- Bienveillant et lumineux
- 3 à 4 paragraphes

Tu ne prédis pas l'avenir. Tu éclaires l'essence de l'âme."""

    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"astro-profile-{uuid.uuid4()}",
        system_message=system_prompt
    ).with_model("openai", "gpt-4o")

    prompt = f"""Compose un portrait astrologique personnalisé pour :

**Prénom** : {name}
**Date de naissance** : {birth_date}
**Lieu de naissance** : {birth_place}

**Données calculées** :
- Phase lunaire de naissance : {moon_phase['name']} (jour {moon_phase['day_in_cycle']} du cycle)
- Arbre celtique : {celtic_tree['tree']} ({celtic_tree['meaning']})
- Demeure lunaire arabe : {arabic_mansion['name']} (demeure n°{arabic_mansion['number']})
- Maison astrologique : {lunar_house['name']} ({lunar_house['theme']})

Rédige un portrait qui relie ces différentes traditions en un tout cohérent et lumineux."""

    try:
        response = await chat.send_message(UserMessage(text=prompt))
        return response
    except Exception as e:
        logging.error(f"Astrology interpretation error: {e}")
        return f"Les astres murmurent pour {name}... Né(e) sous la phase de {moon_phase['name']}, guidé(e) par l'arbre {celtic_tree['tree']} et la demeure de {arabic_mansion['name']}, ton chemin brille d'une lumière unique."

@api_router.get("/astrology/profile/latest")
async def get_latest_astrology_profile():
    """Get the latest saved astrology profile"""
    profile = await db.astrology_profiles.find_one(
        sort=[("created_at", -1)],
        projection={"_id": 0}
    )
    if not profile:
        return None
    if isinstance(profile.get("created_at"), datetime):
        profile["created_at"] = profile["created_at"].isoformat()
    return profile

# --- Daily Notification Routes ---

POETIC_NOTIFICATIONS = {
    "Nouvelle Lune": [
        "La nuit est un encrier, et la lune nouvelle t'invite à écrire un nouveau chapitre.",
        "Dans l'obscurité lunaire, tes rêves germent en silence. Plante une intention ce soir.",
        "La lune se cache pour mieux renaître. Toi aussi, permets-toi ce renouveau.",
    ],
    "Premier Croissant": [
        "Le croissant naissant dessine un sourire dans le ciel. Quelle promesse porte ton cœur ?",
        "Comme la lune qui grandit, laisse tes intentions prendre forme, doucement.",
        "Un mince fil d'argent éclaire ton chemin. Chaque pas compte.",
    ],
    "Premier Quartier": [
        "La lune est à mi-chemin. Quelle direction choisit ton âme ce soir ?",
        "Les défis sont des rivières à traverser, pas des murs. Continue d'avancer.",
        "La lune te montre sa force tranquille. Tu possèdes la même en toi.",
    ],
    "Gibbeuse Croissante": [
        "La lumière grandit. Tes efforts portent leurs fruits, patience.",
        "Presque pleine, la lune t'enseigne la persévérance. L'aboutissement approche.",
        "Comme la lune qui se parfait, affine tes intentions avec soin.",
    ],
    "Pleine Lune": [
        "La pleine lune illumine tes vérités cachées. Accueille-les avec tendresse.",
        "Ce soir, la lune est un miroir d'argent. Que reflète-t-elle de ton âme ?",
        "Sous la pleine lune, les émotions dansent. Laisse-les s'exprimer librement.",
    ],
    "Gibbeuse Décroissante": [
        "La lune commence sa descente. C'est le temps de la gratitude et du partage.",
        "Ce que tu as reçu, transmets-le. La lumière décroissante éclaire la générosité.",
        "La sagesse vient après l'accomplissement. Que retiens-tu de ce cycle ?",
    ],
    "Dernier Quartier": [
        "La lune t'enseigne l'art du lâcher-prise. Que libères-tu ce soir ?",
        "Comme la marée qui se retire, laisse partir ce qui t'alourdit.",
        "Le pardon est une porte vers la lumière. La lune t'y invite.",
    ],
    "Dernier Croissant": [
        "La lune murmure : repose-toi. Le silence est la plus belle des mélodies.",
        "Dans le crépuscule lunaire, écoute les murmures de ton âme.",
        "Bientôt un nouveau cycle. Prépare ton cœur à accueillir le renouveau.",
    ],
}

@api_router.get("/notifications/daily")
async def get_daily_notification():
    """Get a poetic daily notification based on current lunar phase"""
    now = datetime.utcnow()
    moon = calculate_moon_phase_for_date(now)
    phase_name = moon["name"]
    messages = POETIC_NOTIFICATIONS.get(phase_name, POETIC_NOTIFICATIONS["Nouvelle Lune"])
    # Use day of year for consistent daily selection
    day_of_year = now.timetuple().tm_yday
    message = messages[day_of_year % len(messages)]
    return {
        "message": message,
        "moon_phase": phase_name,
        "day_in_cycle": moon["day_in_cycle"],
    }

app.include_router(api_router)

# Mount static files for fonts
app.mount("/api/static", StaticFiles(directory=str(ROOT_DIR / "static")), name="static")

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
