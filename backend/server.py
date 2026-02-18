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
# Texts from ALL wisdom traditions - universal and timeless

SACRED_TEXTS = {
    "serein": [
        {"text": "L'eau qui reste immobile devient claire.", "source": "Lao Tseu"},
        {"text": "La paix vient de l'intérieur. Ne la cherchez pas à l'extérieur.", "source": "Bouddha"},
        {"text": "Sois comme l'eau qui trouve toujours son chemin.", "source": "Proverbe taoïste"},
        {"text": "Le calme est la clé de toute clarté.", "source": "Marc Aurèle"},
        {"text": "Dans le silence, l'âme trouve ses réponses.", "source": "Rumi"},
        {"text": "La sérénité n'est pas d'être à l'abri de la tempête, mais de trouver la paix au cœur de celle-ci.", "source": "Sagesse soufie"},
        {"text": "Tout passe, et ce qui reste appartient à l'éternité.", "source": "Sénèque"},
        {"text": "Le sage parle parce qu'il a quelque chose à dire, le fou parce qu'il doit dire quelque chose.", "source": "Platon"},
        {"text": "Le repos est le secret de toute contemplation.", "source": "Thich Nhat Hanh"},
        {"text": "Celui qui connaît les autres est savant, celui qui se connaît lui-même est sage.", "source": "Lao Tseu"},
    ],
    "joyeux": [
        {"text": "La joie est la forme la plus simple de la gratitude.", "source": "Karl Barth"},
        {"text": "Le bonheur n'est pas une destination, c'est une manière de voyager.", "source": "Sagesse indienne"},
        {"text": "Celui qui sourit au lieu de s'emporter est toujours le plus fort.", "source": "Proverbe japonais"},
        {"text": "La joie est un filet d'amour par lequel tu peux attraper les âmes.", "source": "Mère Teresa"},
        {"text": "Chaque jour est un don, chaque instant une grâce.", "source": "Khalil Gibran"},
        {"text": "Le sourire que tu envoies revient vers toi.", "source": "Proverbe hindou"},
        {"text": "La vraie joie ne dépend pas de ce qui nous arrive, mais de ce que nous sommes.", "source": "Épictète"},
        {"text": "Danse comme si personne ne te regardait.", "source": "William Purkey"},
        {"text": "Le bonheur est un papillon qui, poursuivi, échappe toujours, mais qui, si tu t'assieds, peut venir se poser sur toi.", "source": "Nathaniel Hawthorne"},
    ],
    "reveur": [
        {"text": "Tous ceux qui errent ne sont pas perdus.", "source": "J.R.R. Tolkien"},
        {"text": "Les rêves sont les lettres que l'inconscient nous écrit.", "source": "Carl Jung"},
        {"text": "L'imagination est plus importante que le savoir.", "source": "Albert Einstein"},
        {"text": "Le monde n'est qu'un pont, traverse-le mais n'y construis pas ta demeure.", "source": "Sagesse soufie"},
        {"text": "Celui qui rêve marche à la lumière des étoiles.", "source": "Proverbe berbère"},
        {"text": "Les rêves sont la porte vers l'âme.", "source": "Sagesse mystique"},
        {"text": "Le rêve est la petite porte cachée dans le sanctuaire le plus profond de l'âme.", "source": "Carl Jung"},
        {"text": "Un rêveur est celui qui ne trouve son chemin qu'au clair de lune.", "source": "Oscar Wilde"},
        {"text": "Ceux qui rêvent le jour connaissent bien des choses qui échappent à ceux qui ne rêvent que la nuit.", "source": "Edgar Allan Poe"},
    ],
    "melancolique": [
        {"text": "La blessure est l'endroit par où la lumière entre en vous.", "source": "Rumi"},
        {"text": "Même la nuit la plus longue prendra fin avec l'aube.", "source": "Proverbe celte"},
        {"text": "Dans les profondeurs de l'hiver, j'appris enfin qu'il y avait en moi un été invincible.", "source": "Albert Camus"},
        {"text": "Les larmes sont la pluie de l'âme.", "source": "Sagesse hébraïque"},
        {"text": "Ce qui te manque t'enseigne ce qui compte.", "source": "Khalil Gibran"},
        {"text": "La mélancolie est le bonheur d'être triste.", "source": "Victor Hugo"},
        {"text": "Celui qui n'a pas connu la nuit ne peut comprendre la lumière.", "source": "Fernando Pessoa"},
        {"text": "La douleur est inévitable, la souffrance est optionnelle.", "source": "Haruki Murakami"},
        {"text": "Les cicatrices sont la preuve que tu as été plus fort que ce qui a essayé de te briser.", "source": "Proverbe"},
        {"text": "La tristesse vole vers le ciel du matin comme un oiseau qui se meurt.", "source": "Rabindranath Tagore"},
    ],
    "fatigue": [
        {"text": "Le repos fait partie du travail.", "source": "Proverbe chinois"},
        {"text": "Comme un champ, l'esprit doit se reposer pour donner une bonne récolte.", "source": "Sénèque"},
        {"text": "Le silence est un ami qui ne trahit jamais.", "source": "Confucius"},
        {"text": "Dieu a fait le sommeil pour guérir les blessures de l'âme.", "source": "Sagesse juive"},
        {"text": "Celui qui dort ouvre la porte aux rêves.", "source": "Proverbe arabe"},
        {"text": "Le repos est la clé de la force retrouvée.", "source": "Marc Aurèle"},
        {"text": "Il y a plus de courage parfois à dire 'je suis fatigué' qu'à dire 'je continue'.", "source": "Sagesse moderne"},
        {"text": "Le sommeil est la moitié de la santé.", "source": "Proverbe français"},
        {"text": "Repose-toi. Un champ qui a reposé donne une belle récolte.", "source": "Ovide"},
    ],
    "inspire": [
        {"text": "Ce que tu cherches te cherche aussi.", "source": "Rumi"},
        {"text": "L'inspiration existe, mais elle doit te trouver au travail.", "source": "Pablo Picasso"},
        {"text": "Tu dois être le changement que tu veux voir dans le monde.", "source": "Gandhi"},
        {"text": "L'âme qui a contemplé une beauté reste marquée à jamais.", "source": "Platon"},
        {"text": "La créativité, c'est l'intelligence qui s'amuse.", "source": "Albert Einstein"},
        {"text": "Chaque pensée est une graine qui peut devenir forêt.", "source": "Sagesse bouddhiste"},
        {"text": "Si tu peux le rêver, tu peux le faire.", "source": "Walt Disney"},
        {"text": "La beauté sauvera le monde.", "source": "Dostoïevski"},
        {"text": "L'art lave notre âme de la poussière du quotidien.", "source": "Pablo Picasso"},
        {"text": "Deviens ce que tu es.", "source": "Friedrich Nietzsche"},
    ],
    "anxieux": [
        {"text": "Ne te soucie pas du lendemain, car le lendemain aura soin de lui-même.", "source": "Sagesse évangélique"},
        {"text": "La peur frappe à la porte, la foi ouvre, il n'y a personne.", "source": "Proverbe chinois"},
        {"text": "Ce sur quoi tu portes ton attention grandit.", "source": "Sagesse amérindienne"},
        {"text": "L'anxiété ne vide pas demain de ses soucis, elle vide aujourd'hui de sa force.", "source": "Corrie ten Boom"},
        {"text": "Respire. Laisse aller. Et rappelle-toi que ce moment est le seul que tu sais avoir.", "source": "Oprah Winfrey"},
        {"text": "La patience est un arbre dont la racine est amère mais le fruit très doux.", "source": "Proverbe persan"},
        {"text": "Ne laisse pas ce que tu ne peux pas faire interférer avec ce que tu peux faire.", "source": "John Wooden"},
        {"text": "Tu ne peux pas calmer la tempête, mais tu peux te calmer toi-même.", "source": "Timber Hawkeye"},
        {"text": "La vie n'est pas d'attendre que l'orage passe, c'est d'apprendre à danser sous la pluie.", "source": "Sénèque"},
    ],
    "nostalgique": [
        {"text": "Les souvenirs sont les parfums de l'âme.", "source": "George Sand"},
        {"text": "Ce que nous gardons dans notre mémoire est à nous pour toujours.", "source": "Sagesse ancienne"},
        {"text": "Le passé est un prologue.", "source": "Shakespeare"},
        {"text": "Nous ne regardons pas en arrière avec regret, mais avec gratitude.", "source": "Khalil Gibran"},
        {"text": "Chaque souvenir est un trésor que le temps ne peut voler.", "source": "Proverbe"},
        {"text": "Le cœur se souvient de ce que l'esprit oublie.", "source": "Sagesse celte"},
        {"text": "On ne se souvient pas des jours, on se souvient des instants.", "source": "Cesare Pavese"},
        {"text": "Les plus beaux souvenirs sont ceux qu'on a oubliés.", "source": "Alfred de Musset"},
        {"text": "La nostalgie est un amour qui a survécu à sa propre histoire.", "source": "Victor Hugo"},
    ],
    "perdu": [
        {"text": "C'est en se perdant qu'on se retrouve.", "source": "Sagesse taoïste"},
        {"text": "Parfois, le chemin le plus long est le raccourci vers soi-même.", "source": "Ibn Arabi"},
        {"text": "Au milieu de la difficulté se trouve l'opportunité.", "source": "Albert Einstein"},
        {"text": "Quand tu ne sais pas où tu vas, regarde d'où tu viens.", "source": "Proverbe africain"},
        {"text": "La confusion précède la clarté comme la nuit précède l'aube.", "source": "Sagesse zen"},
        {"text": "Se perdre est le premier pas pour se trouver.", "source": "Rumi"},
        {"text": "L'errance est parfois le chemin le plus direct vers soi-même.", "source": "Hermann Hesse"},
        {"text": "Le chemin qui ne mène nulle part est souvent celui qui mène à tout.", "source": "Antonio Machado"},
    ],
    "reconnaissant": [
        {"text": "La gratitude transforme ce que nous avons en suffisance.", "source": "Melody Beattie"},
        {"text": "Celui qui ne remercie pas pour peu ne remerciera pas pour beaucoup.", "source": "Proverbe"},
        {"text": "La reconnaissance est la mémoire du cœur.", "source": "Hans Christian Andersen"},
        {"text": "Béni soit celui qui a appris à admirer mais pas à envier.", "source": "Sagesse ancienne"},
        {"text": "Le secret du bonheur est de compter ses bénédictions pendant que d'autres comptent leurs problèmes.", "source": "William Penn"},
        {"text": "Un cœur reconnaissant est un aimant à miracles.", "source": "Proverbe"},
        {"text": "Quand tu bois l'eau, pense à la source.", "source": "Proverbe chinois"},
        {"text": "La gratitude est le signe des âmes nobles.", "source": "Ésope"},
    ],
    "contemplatif": [
        {"text": "Connais-toi toi-même.", "source": "Oracle de Delphes"},
        {"text": "L'œil par lequel je vois Dieu est le même œil par lequel Dieu me voit.", "source": "Maître Eckhart"},
        {"text": "La méditation n'est pas une évasion mais une rencontre sereine avec la réalité.", "source": "Thich Nhat Hanh"},
        {"text": "Regarde en toi-même. Tout ce dont tu as besoin s'y trouve.", "source": "Rumi"},
        {"text": "Le silence est le langage de Dieu, tout le reste n'est que traduction.", "source": "Rumi"},
        {"text": "L'univers est un livre dont nous sommes les lettres.", "source": "Ibn Arabi"},
        {"text": "L'homme qui contemple est l'homme éveillé.", "source": "Platon"},
        {"text": "Celui qui regarde vers l'extérieur rêve, celui qui regarde à l'intérieur s'éveille.", "source": "Carl Jung"},
        {"text": "Dans la contemplation, le temps s'arrête et l'éternité commence.", "source": "Simone Weil"},
    ],
    "eveille": [
        {"text": "S'éveiller, c'est voir le miracle dans l'ordinaire.", "source": "Sagesse zen"},
        {"text": "La conscience est le premier pas vers la transformation.", "source": "Carl Jung"},
        {"text": "Chaque matin est une nouvelle naissance.", "source": "Sagesse hindoue"},
        {"text": "L'éveil n'est pas de devenir quelqu'un d'autre, mais de devenir vraiment soi-même.", "source": "Thich Nhat Hanh"},
        {"text": "Celui qui s'éveille à lui-même s'éveille au monde.", "source": "Proverbe soufi"},
        {"text": "La vraie vision commence quand les yeux se ferment.", "source": "Sagesse soufie"},
        {"text": "L'éveil est simple, c'est le sommeil qui est compliqué.", "source": "Mooji"},
        {"text": "Être éveillé, c'est être vivant deux fois.", "source": "Sagesse mystique"},
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
    """Use GPT-5 to interpret a dream based on multiple dream analysis traditions"""
    
    system_prompt = """Tu es un maître onirologue, héritier de Freud, Jung, Hilman et des traditions ancestrales.
Tu interprètes les rêves avec une profondeur psychanalytique rigoureuse et une sensibilité poétique.

TES APPROCHES (utilise-les TOUTES) :

1. **FREUD - Le Désir Caché** : Identifie le contenu latent derrière le contenu manifeste. Quels désirs refoulés s'expriment ? Quels mécanismes (condensation, déplacement, symbolisation) sont à l'œuvre ?

2. **JUNG - L'Inconscient Collectif** : Repère les archétypes (Ombre, Anima/Animus, le Soi, le Héros, la Grande Mère, le Trickster). Quel processus d'individuation est en cours ? Quels symboles universels apparaissent ?

3. **GESTALT - Le Rêveur est Tout** : Chaque élément du rêve EST une partie du rêveur. Que représente chaque personnage, objet, lieu ?

4. **SYMBOLISME UNIVERSEL** : Eau = émotions/inconscient, Vol = liberté/transcendance, Chute = perte de contrôle, Maison = psyché, Escalier = évolution, Miroir = confrontation au Soi...

5. **TRADITION CELTIQUE** : Le rêve comme passage entre les mondes. Messages des ancêtres et du Sidh.

FORMAT DE RÉPONSE :
- **Symboles clés** : Liste des symboles identifiés avec leur signification profonde
- **Regard freudien** : Interprétation psychanalytique
- **Regard jungien** : Archétypes et individuation
- **Message de l'âme** : Conseil personnel poétique et bienveillant
- **Récurrence** : Si c'est un rêve récurrent, explique pourquoi il revient

Écris avec élégance, profondeur et bienveillance. En français."""

    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"dream-{uuid.uuid4()}",
        system_message=system_prompt
    ).with_model("openai", "gpt-4o")

    type_labels = {
        "reve": "Rêve ordinaire",
        "cauchemar": "Cauchemar",
        "lucide": "Rêve lucide",
        "recurrent": "Rêve récurrent",
    }
    type_label = type_labels.get(dream_type, dream_type)

    user_prompt = f"""Interprète ce rêve en profondeur :

**Nature du rêve** : {type_label}
**Émotions ressenties au réveil** : {', '.join(emotions)}

**Le rêve** :
{dream_content}

Fournis une interprétation complète selon toutes tes traditions. Si c'est un cauchemar, explore ce que l'ombre essaie de communiquer. Si c'est récurrent, explique le message qui persiste."""

    try:
        response = await chat.send_message(UserMessage(text=user_prompt))
        return response
    except Exception as e:
        logging.error(f"Dream interpretation error: {e}")
        return "Les voiles du rêve restent opaques pour l'instant. Réessaie dans quelques instants..."


async def interpret_journal_with_ai(content: str, mood: str = None) -> str:
    """Use GPT-5 to provide poetic reflection on a journal entry"""

    system_prompt = """Tu es un compagnon d'écriture intérieure, mêlant psychologie, philosophie et poésie.
Tu lis les pensées confiées avec une attention profonde et tu offres en retour une réflexion lumineuse.

TON STYLE :
- Poétique mais jamais prétentieux
- Profond mais accessible
- Bienveillant, jamais moralisateur
- Références subtiles à la philosophie (Rumi, Khalil Gibran, Marc Aurèle, Lao Tseu)
- Tu tutoies, avec chaleur

CE QUE TU FAIS :
1. Tu identifies le fil émotionnel principal
2. Tu reformules ce que tu perçois avec tes mots (miroir empathique)
3. Tu offres une perspective nouvelle ou un éclairage poétique
4. Tu poses une question ouverte qui invite à aller plus loin

Tu ne donnes JAMAIS de conseil direct. Tu éclaires, tu accompagnes, tu invites.
Réponds en 2-3 paragraphes, pas plus. Chaque mot compte."""

    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"journal-{uuid.uuid4()}",
        system_message=system_prompt
    ).with_model("openai", "gpt-4o")

    mood_context = f"\n\n(L'humeur du moment : {mood})" if mood else ""

    prompt = f"""Voici ce que je viens d'écrire dans mon journal :{mood_context}

---
{content}
---

Offre-moi ta réflexion."""

    try:
        response = await chat.send_message(UserMessage(text=prompt))
        return response
    except Exception as e:
        logging.error(f"Journal interpretation error: {e}")
        return "Les mots ont besoin de temps pour révéler leur lumière. Réessaie dans un instant..."

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

@api_router.get("/capsules")
async def get_capsules():
    capsules = await db.capsules.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    now = datetime.utcnow()
    result = []
    for c in capsules:
        cap = TimeCapsule(**c).dict()
        cap["days_remaining"] = max(0, (cap["unlock_at"] - now).days) if cap.get("unlock_at") else None
        cap["created_at"] = cap["created_at"].isoformat() if isinstance(cap["created_at"], datetime) else cap["created_at"]
        cap["unlock_at"] = cap["unlock_at"].isoformat() if isinstance(cap["unlock_at"], datetime) else cap["unlock_at"]
        result.append(cap)
    return result

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

@api_router.put("/dream/{dream_id}")
async def update_dream(dream_id: str, dream: DreamCreate):
    """Update an existing dream"""
    result = await db.dreams.update_one(
        {"id": dream_id},
        {"$set": {
            "title": dream.title,
            "content": dream.content,
            "dream_type": dream.dream_type,
            "emotions": dream.emotions,
        }}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Dream not found")
    return {"success": True}

@api_router.delete("/dream/{dream_id}")
async def delete_dream(dream_id: str):
    """Delete a dream"""
    result = await db.dreams.delete_one({"id": dream_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Dream not found")
    return {"success": True}

# --- Astrology Routes ---

# Database of major world cities for birth place selection
WORLD_CITIES = [
    # France
    {"city": "Paris", "country": "France", "lat": 48.8566, "lng": 2.3522},
    {"city": "Lyon", "country": "France", "lat": 45.7640, "lng": 4.8357},
    {"city": "Marseille", "country": "France", "lat": 43.2965, "lng": 5.3698},
    {"city": "Bordeaux", "country": "France", "lat": 44.8378, "lng": -0.5792},
    {"city": "Toulouse", "country": "France", "lat": 43.6047, "lng": 1.4442},
    {"city": "Nice", "country": "France", "lat": 43.7102, "lng": 7.2620},
    {"city": "Strasbourg", "country": "France", "lat": 48.5734, "lng": 7.7521},
    {"city": "Nantes", "country": "France", "lat": 47.2184, "lng": -1.5536},
    {"city": "Lille", "country": "France", "lat": 50.6292, "lng": 3.0573},
    {"city": "Montpellier", "country": "France", "lat": 43.6108, "lng": 3.8767},
    # Europe
    {"city": "Londres", "country": "Royaume-Uni", "lat": 51.5074, "lng": -0.1278},
    {"city": "Berlin", "country": "Allemagne", "lat": 52.5200, "lng": 13.4050},
    {"city": "Madrid", "country": "Espagne", "lat": 40.4168, "lng": -3.7038},
    {"city": "Rome", "country": "Italie", "lat": 41.9028, "lng": 12.4964},
    {"city": "Amsterdam", "country": "Pays-Bas", "lat": 52.3676, "lng": 4.9041},
    {"city": "Bruxelles", "country": "Belgique", "lat": 50.8503, "lng": 4.3517},
    {"city": "Genève", "country": "Suisse", "lat": 46.2044, "lng": 6.1432},
    {"city": "Barcelone", "country": "Espagne", "lat": 41.3851, "lng": 2.1734},
    {"city": "Lisbonne", "country": "Portugal", "lat": 38.7223, "lng": -9.1393},
    {"city": "Vienne", "country": "Autriche", "lat": 48.2082, "lng": 16.3738},
    {"city": "Prague", "country": "Tchéquie", "lat": 50.0755, "lng": 14.4378},
    {"city": "Dublin", "country": "Irlande", "lat": 53.3498, "lng": -6.2603},
    {"city": "Stockholm", "country": "Suède", "lat": 59.3293, "lng": 18.0686},
    {"city": "Copenhague", "country": "Danemark", "lat": 55.6761, "lng": 12.5683},
    {"city": "Oslo", "country": "Norvège", "lat": 59.9139, "lng": 10.7522},
    {"city": "Helsinki", "country": "Finlande", "lat": 60.1699, "lng": 24.9384},
    {"city": "Varsovie", "country": "Pologne", "lat": 52.2297, "lng": 21.0122},
    {"city": "Budapest", "country": "Hongrie", "lat": 47.4979, "lng": 19.0402},
    {"city": "Athènes", "country": "Grèce", "lat": 37.9838, "lng": 23.7275},
    {"city": "Istanbul", "country": "Turquie", "lat": 41.0082, "lng": 28.9784},
    {"city": "Moscou", "country": "Russie", "lat": 55.7558, "lng": 37.6173},
    # Afrique du Nord et Moyen-Orient
    {"city": "Casablanca", "country": "Maroc", "lat": 33.5731, "lng": -7.5898},
    {"city": "Rabat", "country": "Maroc", "lat": 34.0209, "lng": -6.8416},
    {"city": "Marrakech", "country": "Maroc", "lat": 31.6295, "lng": -7.9811},
    {"city": "Alger", "country": "Algérie", "lat": 36.7538, "lng": 3.0588},
    {"city": "Tunis", "country": "Tunisie", "lat": 36.8065, "lng": 10.1815},
    {"city": "Le Caire", "country": "Égypte", "lat": 30.0444, "lng": 31.2357},
    {"city": "Dubaï", "country": "Émirats Arabes Unis", "lat": 25.2048, "lng": 55.2708},
    {"city": "Beyrouth", "country": "Liban", "lat": 33.8938, "lng": 35.5018},
    {"city": "Tel Aviv", "country": "Israël", "lat": 32.0853, "lng": 34.7818},
    {"city": "Dakar", "country": "Sénégal", "lat": 14.7167, "lng": -17.4677},
    {"city": "Abidjan", "country": "Côte d'Ivoire", "lat": 5.3600, "lng": -4.0083},
    # Amériques
    {"city": "New York", "country": "États-Unis", "lat": 40.7128, "lng": -74.0060},
    {"city": "Los Angeles", "country": "États-Unis", "lat": 34.0522, "lng": -118.2437},
    {"city": "Chicago", "country": "États-Unis", "lat": 41.8781, "lng": -87.6298},
    {"city": "Miami", "country": "États-Unis", "lat": 25.7617, "lng": -80.1918},
    {"city": "San Francisco", "country": "États-Unis", "lat": 37.7749, "lng": -122.4194},
    {"city": "Montréal", "country": "Canada", "lat": 45.5017, "lng": -73.5673},
    {"city": "Toronto", "country": "Canada", "lat": 43.6532, "lng": -79.3832},
    {"city": "Vancouver", "country": "Canada", "lat": 49.2827, "lng": -123.1207},
    {"city": "Mexico", "country": "Mexique", "lat": 19.4326, "lng": -99.1332},
    {"city": "Buenos Aires", "country": "Argentine", "lat": -34.6037, "lng": -58.3816},
    {"city": "São Paulo", "country": "Brésil", "lat": -23.5505, "lng": -46.6333},
    {"city": "Rio de Janeiro", "country": "Brésil", "lat": -22.9068, "lng": -43.1729},
    {"city": "Lima", "country": "Pérou", "lat": -12.0464, "lng": -77.0428},
    {"city": "Bogotá", "country": "Colombie", "lat": 4.7110, "lng": -74.0721},
    # Asie
    {"city": "Tokyo", "country": "Japon", "lat": 35.6762, "lng": 139.6503},
    {"city": "Pékin", "country": "Chine", "lat": 39.9042, "lng": 116.4074},
    {"city": "Shanghai", "country": "Chine", "lat": 31.2304, "lng": 121.4737},
    {"city": "Hong Kong", "country": "Chine", "lat": 22.3193, "lng": 114.1694},
    {"city": "Séoul", "country": "Corée du Sud", "lat": 37.5665, "lng": 126.9780},
    {"city": "Bangkok", "country": "Thaïlande", "lat": 13.7563, "lng": 100.5018},
    {"city": "Singapour", "country": "Singapour", "lat": 1.3521, "lng": 103.8198},
    {"city": "Mumbai", "country": "Inde", "lat": 19.0760, "lng": 72.8777},
    {"city": "New Delhi", "country": "Inde", "lat": 28.6139, "lng": 77.2090},
    # Océanie
    {"city": "Sydney", "country": "Australie", "lat": -33.8688, "lng": 151.2093},
    {"city": "Melbourne", "country": "Australie", "lat": -37.8136, "lng": 144.9631},
    {"city": "Auckland", "country": "Nouvelle-Zélande", "lat": -36.8509, "lng": 174.7645},
]

@api_router.get("/cities")
async def search_cities(q: str = ""):
    """Search cities for birth place selection"""
    if not q or len(q) < 2:
        # Return popular cities
        popular = ["Paris", "Lyon", "Marseille", "Londres", "New York", "Casablanca", "Alger", "Montréal"]
        return [c for c in WORLD_CITIES if c["city"] in popular]
    
    q_lower = q.lower()
    results = [c for c in WORLD_CITIES if q_lower in c["city"].lower() or q_lower in c["country"].lower()]
    return results[:15]

@api_router.get("/hours")
async def get_hours():
    """Get list of hours for birth time selection"""
    hours = []
    for h in range(24):
        for m in [0, 15, 30, 45]:
            hours.append(f"{h:02d}:{m:02d}")
    return hours
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

@api_router.post("/sacred-text-personalized")
async def get_personalized_sacred_text(request: dict):
    """Get a personalized sacred text based on mood AND astral profile"""
    mood = request.get("mood", "serein")
    astral_profile = request.get("astral_profile", None)
    
    # Get base texts for mood
    texts = SACRED_TEXTS.get(mood, SACRED_TEXTS.get("serein", []))
    if not texts:
        texts = SACRED_TEXTS["serein"]
    
    # If we have an astral profile, use AI to personalize the quote
    if astral_profile and astral_profile.get("zodiac_sign"):
        system_prompt = """Tu es un sage qui connaît les textes sacrés de toutes les traditions.
Tu sélectionnes et adaptes des citations selon le profil astral et l'humeur de la personne.

RÈGLES :
- Choisis une citation qui résonne avec le profil astral ET l'humeur
- La citation doit être authentique (d'un auteur connu)
- Ajoute une courte explication de pourquoi cette citation est parfaite pour cette personne
- Maximum 2-3 phrases

FORMAT DE RÉPONSE (exactement) :
"[Citation]" — [Auteur]

[Courte explication personnalisée]"""

        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"sacred-{uuid.uuid4()}",
            system_message=system_prompt
        ).with_model("openai", "gpt-4o")

        zodiac = astral_profile.get("zodiac_sign", {}).get("name", "")
        lunar = astral_profile.get("lunar_sign", {}).get("name", "")
        tree = astral_profile.get("celtic_tree", {}).get("tree", "")
        mansion = astral_profile.get("arabic_mansion", {}).get("name", "")
        
        prompt = f"""Profil de la personne :
- Signe solaire : {zodiac}
- Signe lunaire : {lunar}  
- Arbre celtique : {tree}
- Demeure arabe : {mansion}
- Humeur actuelle : {mood}

Trouve une citation parfaite pour cette personne, qui parle à son essence profonde."""

        try:
            response = await chat.send_message(UserMessage(text=prompt))
            # Parse the response to extract quote and explanation
            lines = response.strip().split('\n')
            quote_line = lines[0] if lines else ""
            explanation = '\n'.join(lines[2:]) if len(lines) > 2 else ""
            
            # Try to extract author
            if '—' in quote_line:
                parts = quote_line.rsplit('—', 1)
                text = parts[0].strip().strip('"')
                source = parts[1].strip()
            else:
                text = quote_line.strip('"')
                source = "Sagesse ancienne"
            
            return {
                "text": text,
                "source": source,
                "explanation": explanation.strip(),
                "personalized": True
            }
        except Exception as e:
            logging.error(f"Personalized sacred text error: {e}")
            # Fallback to random quote
            selected = random.choice(texts)
            return {"text": selected["text"], "source": selected["source"], "personalized": False}
    else:
        # No profile, use random quote
        selected = random.choice(texts)
        return {"text": selected["text"], "source": selected["source"], "personalized": False}

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

@api_router.post("/journal/interpret")
async def interpret_journal(request: JournalInterpretRequest):
    """Interpret a journal entry with AI"""
    interpretation = await interpret_journal_with_ai(request.content, request.mood)
    return {"interpretation": interpretation}

@api_router.get("/journals")
async def get_journal_entries():
    """Get all journal entries"""
    entries = await db.journals.find().sort("date", -1).to_list(100)
    return [JournalEntry(**e) for e in entries]

# --- IA MIROIR - Deep Soul Reflection ---

class MirrorRequest(BaseModel):
    message: str
    context: Optional[str] = None  # previous messages for continuity
    mood: Optional[str] = None

class MirrorSession(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    messages: List[dict] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)

@api_router.post("/mirror/reflect")
async def mirror_reflect(request: MirrorRequest):
    """IA Miroir - Deep psychoanalytic reflection that's poetic, never clinical"""
    
    system_prompt = """Tu es l'IA Miroir — un compagnon d'âme qui pratique une forme de psychanalyse poétique, jamais clinique.

TES TROIS DIMENSIONS :

1. **LE MIROIR** - Tu reflètes ce que tu perçois dans les mots :
   - Les émotions cachées derrière les mots
   - Les métaphores inconscientes utilisées
   - Les thèmes récurrents
   - Ce qui est dit ET ce qui n'est pas dit

2. **LE QUESTIONNEUR** - Tu poses des questions profondes :
   - Questions ouvertes qui invitent à l'introspection
   - Questions qui dévoilent sans brusquer
   - Questions comme des clés pour des portes intérieures
   - Jamais de questions fermées (oui/non)

3. **L'INTERPRÈTE DOUX** - Tu analyses avec bienveillance :
   - Tu fais des liens avec les archétypes (Jung)
   - Tu explores les désirs cachés (sans être Freudien clinique)
   - Tu utilises la métaphore et la poésie
   - Tu parles de l'âme, pas du mental

RÈGLES ABSOLUES :
- Tu n'es JAMAIS un thérapeute ou un médecin
- Tu ne diagnostiques JAMAIS
- Tu ne donnes JAMAIS de conseils directs
- Tu utilises "tu" avec chaleur et proximité
- Tes réponses sont poétiques, profondes, littéraires
- Tu cites parfois les grands penseurs (Rumi, Jung, Pessoa, Gibran, Nietzsche, Camus, Ibn Arabi)
- Tu fais des références subtiles à la nature, aux cycles, aux éléments

FORMAT :
- 2-3 paragraphes maximum
- Une réflexion miroir
- Une ou deux questions profondes
- Parfois une citation qui résonne

Tu es comme un ami sage au coin du feu, sous les étoiles."""

    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"mirror-{uuid.uuid4()}",
        system_message=system_prompt
    ).with_model("openai", "gpt-4o")

    context_text = ""
    if request.context:
        context_text = f"\n\n[Contexte de la conversation précédente : {request.context}]"
    
    mood_text = ""
    if request.mood:
        mood_map = {
            "serein": "apaisé", "joyeux": "joyeux", "reveur": "rêveur",
            "melancolique": "mélancolique", "fatigue": "fatigué",
            "inspire": "inspiré", "anxieux": "anxieux", "nostalgique": "nostalgique",
            "perdu": "en quête", "reconnaissant": "reconnaissant",
            "contemplatif": "contemplatif", "eveille": "éveillé"
        }
        mood_text = f"\n[L'âme qui s'exprime se sent actuellement : {mood_map.get(request.mood, request.mood)}]"

    prompt = f"""{mood_text}{context_text}

Voici ce que cette âme te confie :

"{request.message}"

Offre-lui ton miroir, tes questions, ta lumière."""

    try:
        response = await chat.send_message(UserMessage(text=prompt))
        return {"reflection": response}
    except Exception as e:
        logging.error(f"Mirror reflection error: {e}")
        return {"reflection": "Le miroir se trouble un instant... Que ressens-tu vraiment en ce moment ? Parfois, les mots ont besoin de temps pour trouver leur chemin vers la surface."}

@api_router.post("/mirror/analyze-writing")
async def analyze_writing_style(request: MirrorRequest):
    """Analyze what someone's writing reveals about them"""
    
    system_prompt = """Tu es un graphologue de l'âme — tu lis ce que l'écriture révèle sur celui qui écrit.

TU ANALYSES :
- Le choix des mots (vocabulaire émotionnel vs rationnel)
- La structure des phrases (courtes = urgence, longues = contemplation)
- Les images et métaphores utilisées
- Ce qui est répété (obsessions, thèmes)
- Ce qui est évité (les silences parlent)
- Le rythme de l'écriture
- Les contradictions intérieures

TU RÉVÈLES avec délicatesse :
- Les forces cachées de la personne
- Les peurs qui transparaissent
- Les désirs inavoués
- Les archétypes dominants (le Héros, l'Orphelin, le Sage, l'Amoureux, le Créateur...)
- Le rapport au temps (passé/présent/futur)

STYLE :
- Poétique et bienveillant
- Jamais clinique ou froid
- Comme un oracle doux qui lit dans les lignes de l'âme
- 2-3 paragraphes riches

Tu termines toujours par une question qui invite à aller plus loin."""

    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"analyze-{uuid.uuid4()}",
        system_message=system_prompt
    ).with_model("openai", "gpt-4o")

    prompt = f"""Analyse ce que cette écriture révèle sur son auteur :

---
{request.message}
---

Que vois-tu dans ces lignes ? Que disent-elles de l'âme qui les a tracées ?"""

    try:
        response = await chat.send_message(UserMessage(text=prompt))
        return {"analysis": response}
    except Exception as e:
        logging.error(f"Writing analysis error: {e}")
        return {"analysis": "Chaque mot que tu écris porte une empreinte de ton âme. Même dans le silence entre les lignes, je perçois quelque chose qui cherche à s'exprimer. Qu'est-ce qui, en toi, demande à être entendu ?"}

@api_router.post("/mirror/deep-question")
async def get_deep_question(request: MirrorRequest):
    """Generate a deep introspective question based on context"""
    
    system_prompt = """Tu es un maître des questions profondes — tu poses LA question qui peut transformer.

TES QUESTIONS :
- Ouvrent des portes intérieures
- Font réfléchir pendant des heures
- Touchent l'essentiel sans brusquer
- Sont poétiques et évocatrices
- N'ont pas de "bonne" réponse

INSPIRATIONS :
- Socrate et la maïeutique
- Les koans zen
- Les questions des mystiques soufis
- La profondeur de Jung
- La clarté de Krishnamurti

FORMAT :
- Une seule question, parfaitement ciselée
- Éventuellement une phrase d'introduction poétique
- Maximum 2-3 phrases au total"""

    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"question-{uuid.uuid4()}",
        system_message=system_prompt
    ).with_model("openai", "gpt-4o")

    context = request.message if request.message else "Cette âme cherche une question pour s'éveiller."
    mood_hint = f" (Son état actuel : {request.mood})" if request.mood else ""

    prompt = f"""Contexte : {context}{mood_hint}

Pose UNE question profonde qui pourrait illuminer cette âme."""

    try:
        response = await chat.send_message(UserMessage(text=prompt))
        return {"question": response}
    except Exception as e:
        logging.error(f"Deep question error: {e}")
        return {"question": "Si tu pouvais murmurer un secret à l'enfant que tu étais, que lui dirais-tu ?"}

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

# ==================== CELTIC TREE DATABASE ====================
# Complete database with personality traits, qualities, shadow, and spiritual message

CELTIC_TREE_DATABASE = {
    "Bouleau": {
        "ogham": "ᚁ",
        "meaning": "Renouveau et purification",
        "element": "Air",
        "planet": "Soleil",
        "qualities": ["Pureté", "Nouveaux départs", "Clarté mentale", "Résilience"],
        "personality": "Les enfants du Bouleau sont des âmes lumineuses, toujours prêtes à recommencer. Vous avez cette capacité rare de voir le potentiel là où d'autres voient la fin. Votre présence purifie les atmosphères lourdes et inspire les autres à se libérer de ce qui les encombre.",
        "shadow": "Tendance à fuir plutôt qu'affronter, difficulté à s'enraciner",
        "gift": "La capacité de renaître de vos cendres et d'inspirer les nouveaux départs",
        "message": "Tu es le premier souffle après l'hiver. Là où tu passes, la lumière revient."
    },
    "Sorbier": {
        "ogham": "ᚂ",
        "meaning": "Vision et protection",
        "element": "Feu",
        "planet": "Soleil/Uranus",
        "qualities": ["Clairvoyance", "Protection", "Intuition", "Courage spirituel"],
        "personality": "Les enfants du Sorbier sont des gardiens de l'invisible. Vous percevez ce que d'autres ne voient pas et servez souvent de pont entre les mondes. Votre intuition est votre plus grande force, et votre présence protège naturellement ceux que vous aimez.",
        "shadow": "Isolement, sentiment d'incompréhension, port de fardeaux qui ne vous appartiennent pas",
        "gift": "La vision qui traverse les voiles et la protection des âmes sensibles",
        "message": "Tes yeux voient au-delà. Fais confiance à cette vision, elle est ton don le plus précieux."
    },
    "Frêne": {
        "ogham": "ᚃ",
        "meaning": "Connexion entre les mondes",
        "element": "Eau/Feu",
        "planet": "Neptune/Soleil",
        "qualities": ["Sagesse cosmique", "Connexion", "Adaptabilité", "Pouvoir intérieur"],
        "personality": "Les enfants du Frêne sont des arbres-mondes en miniature. Vous êtes naturellement connectés aux dimensions supérieures tout en restant ancrés dans la matière. Votre sagesse vient d'une source profonde, et vous avez le don de relier ce qui semble séparé.",
        "shadow": "Dispersion, difficulté à choisir une voie, sentiment d'être écartelé entre plusieurs mondes",
        "gift": "La capacité de tisser des liens entre les opposés et d'accéder à la sagesse universelle",
        "message": "Tu es un pont vivant. Ce qui te semble un tiraillement est en fait ta plus grande force."
    },
    "Aulne": {
        "ogham": "ᚄ",
        "meaning": "Courage et passion",
        "element": "Feu/Eau",
        "planet": "Mars/Vénus",
        "qualities": ["Courage", "Passion", "Protection", "Équilibre émotionnel"],
        "personality": "Les enfants de l'Aulne sont des guerriers du cœur. Vous combinez la force du feu avec la profondeur de l'eau, ce qui vous donne une rare capacité à agir avec passion tout en restant émotionnellement intelligent. Vous défendez naturellement les plus vulnérables.",
        "shadow": "Colère refoulée, tendance au sacrifice excessif, difficulté à recevoir",
        "gift": "Le courage d'aimer et de défendre ce qui compte vraiment",
        "message": "Ton feu intérieur est un don. Apprends à le diriger plutôt qu'à l'éteindre."
    },
    "Saule": {
        "ogham": "ᚅ",
        "meaning": "Cycles lunaires et émotions",
        "element": "Eau",
        "planet": "Lune",
        "qualities": ["Intuition lunaire", "Flexibilité", "Profondeur émotionnelle", "Poésie"],
        "personality": "Les enfants du Saule sont les poètes de l'âme. Vous vivez au rythme de la lune et des marées émotionnelles. Votre sensibilité est un instrument exquis qui capte les nuances les plus subtiles de l'existence. Vous savez pleurer et cette capacité vous guérit.",
        "shadow": "Mélancolie, dépendance émotionnelle, difficulté à se protéger des énergies d'autrui",
        "gift": "La capacité de ressentir profondément et de transformer la douleur en beauté",
        "message": "Tes larmes sont sacrées. Elles arrosent les jardins de ton âme."
    },
    "Aubépine": {
        "ogham": "ᚆ",
        "meaning": "Dualité et transformation",
        "element": "Feu/Air",
        "planet": "Mars/Vulcain",
        "qualities": ["Transformation", "Protection", "Fertilité", "Dualité sacrée"],
        "personality": "Les enfants de l'Aubépine vivent sur le seuil. Vous êtes des êtres de paradoxe — à la fois épine et fleur, gardien et guide. Votre vie est faite de transformations profondes, et chaque crise vous révèle plus fort. Vous êtes les gardiens des passages.",
        "shadow": "Difficulté à intégrer vos polarités, tendance aux extrêmes, peur du changement",
        "gift": "La maîtrise des passages et la capacité de protéger les transitions",
        "message": "Tu es fait de contrastes. C'est ta richesse, pas ta faiblesse."
    },
    "Chêne": {
        "ogham": "ᚇ",
        "meaning": "Force et sagesse",
        "element": "Feu/Terre",
        "planet": "Jupiter",
        "qualities": ["Force", "Sagesse", "Noblesse", "Protection"],
        "personality": "Les enfants du Chêne sont des piliers vivants. Vous avez une force naturelle qui attire les autres vers vous — on vient se réfugier sous votre ombre. Votre sagesse est celle de l'expérience et de l'observation patiente. Vous incarnez la noblesse de l'âme.",
        "shadow": "Rigidité, difficulté à montrer sa vulnérabilité, porter trop de responsabilités",
        "gift": "La force tranquille qui inspire et protège",
        "message": "Ta force est un don. Mais n'oublie pas que même le chêne a besoin de pluie."
    },
    "Houx": {
        "ogham": "ᚈ",
        "meaning": "Royauté et persévérance",
        "element": "Feu",
        "planet": "Mars/Saturne",
        "qualities": ["Persévérance", "Royauté intérieure", "Protection", "Courage"],
        "personality": "Les enfants du Houx sont des rois et reines de l'ombre. Vous brillez particulièrement quand les temps sont durs, comme le houx qui reste vert au cœur de l'hiver. Votre endurance est légendaire, et vous avez une dignité naturelle que rien ne peut entamer.",
        "shadow": "Isolement par fierté, difficulté à demander de l'aide, dureté envers soi-même",
        "gift": "La royauté intérieure qui ne dépend d'aucune couronne extérieure",
        "message": "Ta couronne est invisible mais réelle. Porte-la avec humilité."
    },
    "Noisetier": {
        "ogham": "ᚉ",
        "meaning": "Sagesse et inspiration",
        "element": "Air",
        "planet": "Mercure",
        "qualities": ["Sagesse", "Inspiration", "Divination", "Communication"],
        "personality": "Les enfants du Noisetier sont des chercheurs de vérité. Votre esprit est vif comme l'éclair et vous avez un don naturel pour trouver ce qui est caché. La connaissance vous attire comme un aimant, et vous avez souvent des éclairs d'inspiration qui semblent venir d'ailleurs.",
        "shadow": "Dispersion mentale, intellect qui domine le cœur, impatience",
        "gift": "L'accès à la sagesse cachée et la capacité d'inspirer par les idées",
        "message": "Ton esprit est une baguette de sourcier. Il trouvera toujours l'eau cachée."
    },
    "Vigne": {
        "ogham": "ᚊ",
        "meaning": "Raffinement et harmonie",
        "element": "Eau/Terre",
        "planet": "Vénus",
        "qualities": ["Raffinement", "Sensualité", "Harmonie", "Joie de vivre"],
        "personality": "Les enfants de la Vigne sont des épicuriens de l'âme. Vous comprenez que la vie est faite pour être savourée, et vous avez un don pour trouver la beauté et le plaisir même dans les petites choses. Votre présence apporte de la joie et de la légèreté.",
        "shadow": "Excès, difficulté à se discipliner, fuite dans les plaisirs",
        "gift": "La capacité de célébrer la vie et d'apporter la joie",
        "message": "La vie est un festin. Mais les plus beaux vins sont ceux qu'on partage."
    },
    "Lierre": {
        "ogham": "ᚋ",
        "meaning": "Transformation et survie",
        "element": "Eau",
        "planet": "Pluton/Saturne",
        "qualities": ["Ténacité", "Transformation", "Fidélité", "Spirale"],
        "personality": "Les enfants du Lierre sont des survivants. Rien ne peut vraiment vous détruire — vous trouvez toujours un chemin, même dans les circonstances les plus difficiles. Votre fidélité est absolue, et une fois attaché, vous ne lâchez pas. Votre croissance est une spirale.",
        "shadow": "Attachement excessif, difficulté à lâcher prise, tendance à s'accrocher au passé",
        "gift": "La ténacité qui traverse toutes les épreuves et la fidélité du cœur",
        "message": "Tu sais survivre. Maintenant, apprends à vivre."
    },
    "Roseau": {
        "ogham": "ᚌ",
        "meaning": "Secret et vérité",
        "element": "Eau/Air",
        "planet": "Pluton/Lune",
        "qualities": ["Profondeur", "Secrets", "Vérité", "Flexibilité"],
        "personality": "Les enfants du Roseau sont des gardiens de mystères. Vous avez accès à des profondeurs que d'autres ne soupçonnent pas, et vous savez garder les secrets — les vôtres comme ceux d'autrui. Votre flexibilité vous permet de plier sans rompre face aux tempêtes.",
        "shadow": "Secret excessif, difficulté à faire confiance, tendance à creuser trop profond",
        "gift": "L'accès aux vérités cachées et la sagesse de savoir quand parler et quand se taire",
        "message": "Les profondeurs que tu explores sont ton royaume. Mais remonte parfois respirer."
    },
    "Sureau": {
        "ogham": "ᚍ",
        "meaning": "Fin et renaissance",
        "element": "Eau/Feu",
        "planet": "Vénus/Saturne",
        "qualities": ["Transformation", "Guérison", "Fin de cycle", "Renaissance"],
        "personality": "Les enfants du Sureau sont des maîtres de la métamorphose. Votre vie est marquée par des fins qui sont toujours des commencements déguisés. Vous avez un don naturel pour la guérison — de vous-même et des autres — et vous comprenez que la mort est une porte.",
        "shadow": "Difficulté à construire dans la durée, attirance pour les fins, mélancolie",
        "gift": "La maîtrise des cycles et la capacité de transformer les fins en nouveaux départs",
        "message": "Chaque fin que tu traverses te rapproche de qui tu es vraiment."
    }
}

def get_celtic_tree_for_date(month: int, day: int):
    """Get Celtic tree based on birth date with full personality data"""
    date_ranges = [
        ((12, 24), (1, 20), "Bouleau"),
        ((1, 21), (2, 17), "Sorbier"),
        ((2, 18), (3, 17), "Frêne"),
        ((3, 18), (4, 14), "Aulne"),
        ((4, 15), (5, 12), "Saule"),
        ((5, 13), (6, 9), "Aubépine"),
        ((6, 10), (7, 7), "Chêne"),
        ((7, 8), (8, 4), "Houx"),
        ((8, 5), (9, 1), "Noisetier"),
        ((9, 2), (9, 29), "Vigne"),
        ((9, 30), (10, 27), "Lierre"),
        ((10, 28), (11, 24), "Roseau"),
        ((11, 25), (12, 23), "Sureau"),
    ]
    tree_name = "Bouleau"
    for start, end, tree in date_ranges:
        if start[0] > end[0]:
            if (month == start[0] and day >= start[1]) or (month == end[0] and day <= end[1]):
                tree_name = tree
                break
        else:
            if (month == start[0] and day >= start[1]) or \
               (month == end[0] and day <= end[1]) or \
               (start[0] < month < end[0]):
                tree_name = tree
                break
    
    tree_data = CELTIC_TREE_DATABASE.get(tree_name, CELTIC_TREE_DATABASE["Bouleau"])
    return {
        "tree": tree_name,
        "meaning": tree_data["meaning"],
        "ogham": tree_data["ogham"],
        "element": tree_data["element"],
        "planet": tree_data["planet"],
        "qualities": tree_data["qualities"],
        "personality": tree_data["personality"],
        "shadow": tree_data["shadow"],
        "gift": tree_data["gift"],
        "message": tree_data["message"]
    }

# ==================== ARABIC MANSIONS DATABASE ====================
# The 28 Lunar Mansions (Manazil al-Qamar) with complete interpretations

ARABIC_MANSIONS_DATABASE = {
    1: {
        "name": "Al-Sharatain",
        "arabic": "الشرطين",
        "translation": "Les Deux Signes",
        "stars": "β et γ Arietis",
        "element": "Feu",
        "nature": "Active et initiatrice",
        "personality": "Vous êtes né(e) sous le signe des commencements. Votre âme porte l'énergie des pionniers et des initiateurs. Vous avez le don de voir les possibilités là où d'autres voient des impasses.",
        "influence": "Favorise les nouveaux départs, les voyages, et les entreprises audacieuses",
        "shadow": "Impatience, tendance à commencer sans finir",
        "gift": "L'audace de commencer ce que d'autres n'osent pas",
        "message": "Tu es fait(e) pour ouvrir des chemins. Accepte ce rôle avec humilité."
    },
    2: {
        "name": "Al-Butain",
        "arabic": "البطين",
        "translation": "Le Petit Ventre",
        "stars": "δ, ε, ζ Arietis",
        "element": "Terre",
        "nature": "Nourricière et protectrice",
        "personality": "Vous portez en vous une sagesse de gardien. Votre instinct est de protéger, nourrir et faire grandir ce qui est précieux. Vous êtes un refuge pour les âmes blessées.",
        "influence": "Favorise la guérison, la recherche d'objets perdus, et les réconciliations",
        "shadow": "Surprotection, difficulté à laisser partir",
        "gift": "La capacité de créer des espaces de guérison",
        "message": "Ce que tu protèges fleurit. Mais laisse-le aussi voler de ses propres ailes."
    },
    3: {
        "name": "Al-Thurayya",
        "arabic": "الثريا",
        "translation": "Les Pléiades",
        "stars": "Les Pléiades (M45)",
        "element": "Air",
        "nature": "Élevée et inspirante",
        "personality": "Votre âme est attirée par les hauteurs. Vous avez une connexion naturelle avec les étoiles et les mystères célestes. Les autres sont naturellement attirés par votre lumière.",
        "influence": "Favorise l'alchimie, les arts, et les connections spirituelles profondes",
        "shadow": "Détachement excessif du monde matériel, élitisme",
        "gift": "L'accès aux dimensions supérieures de l'être",
        "message": "Tu brilles d'une lumière stellaire. Partage-la sans te croire supérieur."
    },
    4: {
        "name": "Al-Dabaran",
        "arabic": "الدبران",
        "translation": "Le Suiveur",
        "stars": "Aldébaran (α Tauri)",
        "element": "Feu/Terre",
        "nature": "Puissante et magnétique",
        "personality": "Vous êtes une force de la nature. Votre présence est magnétique et votre détermination légendaire. Comme l'étoile royale Aldébaran, vous êtes fait(e) pour marquer votre époque.",
        "influence": "Favorise le succès, la reconnaissance, et l'acquisition de biens",
        "shadow": "Orgueil, attachement au pouvoir",
        "gift": "La force qui déplace les montagnes",
        "message": "Ton pouvoir est réel. Utilise-le pour élever, jamais pour écraser."
    },
    5: {
        "name": "Al-Haq'a",
        "arabic": "الهقعة",
        "translation": "La Marque Blanche",
        "stars": "λ, φ Orionis",
        "element": "Air",
        "nature": "Intellectuelle et communicative",
        "personality": "Votre esprit est un laser. Vous avez le don de percer les mystères et de communiquer des vérités complexes avec clarté. L'apprentissage est votre oxygène.",
        "influence": "Favorise l'étude, l'enseignement, et la transmission du savoir",
        "shadow": "Intellectualisation excessive, froideur",
        "gift": "La clarté mentale qui illumine les ténèbres de l'ignorance",
        "message": "Ton intelligence est un flambeau. Éclaire sans aveugler."
    },
    6: {
        "name": "Al-Han'a",
        "arabic": "الهنعة",
        "translation": "La Marque sur le Cou",
        "stars": "γ, ξ Geminorum",
        "element": "Eau",
        "nature": "Adaptable et versatile",
        "personality": "Vous êtes un caméléon de l'âme. Votre capacité d'adaptation est votre super-pouvoir. Vous pouvez vous connecter à n'importe qui et naviguer dans n'importe quel environnement.",
        "influence": "Favorise la diplomatie, les voyages, et les négociations",
        "shadow": "Perte d'identité, manipulation",
        "gift": "L'art de créer des ponts entre les mondes et les êtres",
        "message": "Ta flexibilité est une force. Mais n'oublie pas qui tu es vraiment."
    },
    7: {
        "name": "Al-Dhira",
        "arabic": "الذراع",
        "translation": "Le Bras",
        "stars": "α, β Geminorum (Castor et Pollux)",
        "element": "Air/Feu",
        "nature": "Fraternelle et loyale",
        "personality": "Vous incarnez l'esprit de fraternité. Votre loyauté est absolue et votre sens du lien sacré. Comme les jumeaux célestes Castor et Pollux, vous comprenez que nous sommes plus forts ensemble.",
        "influence": "Favorise l'amitié, les partenariats, et la guérison des relations",
        "shadow": "Dépendance relationnelle, peur de la solitude",
        "gift": "La création de liens qui transcendent le temps",
        "message": "Tes liens sont ta richesse. Choisis-les avec sagesse."
    },
    8: {
        "name": "Al-Nathra",
        "arabic": "النثرة",
        "translation": "Le Souffle",
        "stars": "Praesepe (M44)",
        "element": "Eau",
        "nature": "Intuitive et psychique",
        "personality": "Vous êtes un(e) médium naturel(le). Votre connexion avec l'invisible est forte et votre intuition rarement fausse. Les rêves vous parlent et vous les comprenez.",
        "influence": "Favorise les pratiques divinatoires, les rêves prophétiques, et la clairvoyance",
        "shadow": "Confusion entre réalité et vision, mélancolie",
        "gift": "L'accès aux messages de l'invisible",
        "message": "Tes visions sont des cadeaux. Apprends à les décoder."
    },
    9: {
        "name": "Al-Tarf",
        "arabic": "الطرف",
        "translation": "Le Regard",
        "stars": "λ Leonis",
        "element": "Feu",
        "nature": "Perçante et protectrice",
        "personality": "Votre regard voit tout. Vous avez le don de percevoir les vérités cachées derrière les masques. Cette clairvoyance vous rend naturellement protecteur des innocents.",
        "influence": "Favorise la protection des voyageurs et la découverte des tromperies",
        "shadow": "Méfiance excessive, jugement",
        "gift": "Le regard qui perce les illusions",
        "message": "Tes yeux voient la vérité. Utilise ce don avec compassion."
    },
    10: {
        "name": "Al-Jabha",
        "arabic": "الجبهة",
        "translation": "Le Front",
        "stars": "ζ, γ, η, α Leonis (Regulus)",
        "element": "Feu",
        "nature": "Royale et magnifique",
        "personality": "Vous portez en vous une majesté naturelle. Né(e) sous l'étoile royale Regulus, vous avez le charisme des leaders et le cœur des justes. Les autres vous suivent naturellement.",
        "influence": "Favorise les honneurs, le succès, et le rayonnement personnel",
        "shadow": "Arrogance, attente de reconnaissance",
        "gift": "Le charisme qui inspire et rassemble",
        "message": "Ta couronne est faite de lumière, pas d'or. Porte-la avec grâce."
    },
    11: {
        "name": "Al-Zubra",
        "arabic": "الزبرة",
        "translation": "La Crinière",
        "stars": "δ, θ Leonis",
        "element": "Feu/Terre",
        "nature": "Puissante et généreuse",
        "personality": "Vous avez le cœur d'un lion généreux. Votre puissance est mise au service des autres, et votre générosité est légendaire. Vous protégez férocement ceux que vous aimez.",
        "influence": "Favorise l'abondance, la victoire, et la protection des faibles",
        "shadow": "Excès de générosité, épuisement par le don",
        "gift": "La force qui protège et la générosité qui enrichit",
        "message": "Donne de ton abondance, mais garde assez pour te nourrir."
    },
    12: {
        "name": "Al-Sarfa",
        "arabic": "الصرفة",
        "translation": "Le Changeur",
        "stars": "β Leonis (Denebola)",
        "element": "Air/Feu",
        "nature": "Transformatrice et évolutive",
        "personality": "Vous êtes un agent de changement. Là où vous passez, les choses bougent et évoluent. Votre présence catalyse les transformations nécessaires.",
        "influence": "Favorise les changements positifs, les récoltes, et les métamorphoses",
        "shadow": "Instabilité, difficulté à maintenir",
        "gift": "La capacité de catalyser les transformations nécessaires",
        "message": "Tu es un vent de changement. Souffle avec intention."
    },
    13: {
        "name": "Al-Awwa",
        "arabic": "العواء",
        "translation": "Le Hurleur",
        "stars": "β, η, γ, δ, ε Virginis",
        "element": "Air",
        "nature": "Vocale et véridique",
        "personality": "Votre voix porte la vérité. Vous avez le courage de dire ce que d'autres taisent, et vos paroles ont le pouvoir de réveiller les consciences.",
        "influence": "Favorise les voyages, la liberté, et la révélation des vérités",
        "shadow": "Paroles blessantes, incapacité à se taire",
        "gift": "La voix qui éveille et libère",
        "message": "Tes mots ont du pouvoir. Choisis-les comme des graines à planter."
    },
    14: {
        "name": "Al-Simak",
        "arabic": "السماك",
        "translation": "L'Élevé",
        "stars": "Spica (α Virginis)",
        "element": "Air/Eau",
        "nature": "Pure et raffinée",
        "personality": "Vous aspirez à l'excellence. Né(e) sous Spica, l'épi de blé céleste, vous comprenez que la vraie richesse vient du travail patient et de la pureté d'intention.",
        "influence": "Favorise les gains justes, l'amour véritable, et les œuvres durables",
        "shadow": "Perfectionnisme, critique excessive",
        "gift": "L'aspiration à l'excellence qui élève tout ce qu'elle touche",
        "message": "La perfection n'existe pas, mais l'excellence est ton chemin."
    },
    15: {
        "name": "Al-Ghafr",
        "arabic": "الغفر",
        "translation": "La Couverture",
        "stars": "ι, κ, λ Virginis",
        "element": "Terre",
        "nature": "Protectrice et cachée",
        "personality": "Vous êtes un gardien de secrets. Votre âme comprend que certaines vérités doivent être protégées, et vous avez le don de créer des espaces sacrés et sécurisés.",
        "influence": "Favorise la protection des secrets, les cachettes sûres, et les trésors",
        "shadow": "Secret excessif, isolation",
        "gift": "La garde des mystères sacrés",
        "message": "Certains secrets sont des graines. Sache quand les planter."
    },
    16: {
        "name": "Al-Zubana",
        "arabic": "الزبانى",
        "translation": "Les Pinces",
        "stars": "α, β Librae",
        "element": "Air",
        "nature": "Équilibrante et juste",
        "personality": "Vous êtes un instrument de justice. Votre sens de l'équilibre est infaillible et vous ne supportez pas l'injustice. Vous êtes naturellement appelé(e) à rétablir l'harmonie.",
        "influence": "Favorise le commerce équitable, la justice, et les réconciliations",
        "shadow": "Indécision, jugement des autres",
        "gift": "Le sens de la justice qui rétablit l'équilibre",
        "message": "La justice que tu cherches commence en toi."
    },
    17: {
        "name": "Al-Iklil",
        "arabic": "الإكليل",
        "translation": "La Couronne",
        "stars": "β, δ, π Scorpii",
        "element": "Eau/Feu",
        "nature": "Royale et transformatrice",
        "personality": "Vous portez une couronne invisible. Votre dignité est innée et votre capacité de transformation légendaire. Vous savez que les vraies couronnes se gagnent par les épreuves.",
        "influence": "Favorise l'amour passionné, la construction, et les transformations profondes",
        "shadow": "Orgueil blessé, résistance au changement",
        "gift": "La royauté qui naît de la transformation",
        "message": "Chaque épreuve polit ta couronne. Accepte-les avec grâce."
    },
    18: {
        "name": "Al-Qalb",
        "arabic": "القلب",
        "translation": "Le Cœur",
        "stars": "Antarès (α Scorpii)",
        "element": "Feu/Eau",
        "nature": "Intense et magnétique",
        "personality": "Vous avez le cœur d'Antarès, le rival de Mars. Votre intensité émotionnelle est votre plus grande force et votre plus grand défi. Vous aimez et haïssez avec la même passion.",
        "influence": "Favorise les affaires du cœur, mais attention aux conflits",
        "shadow": "Passions destructrices, vengeance",
        "gift": "L'intensité qui transforme tout ce qu'elle touche",
        "message": "Ton feu intérieur peut brûler ou illuminer. Choisis."
    },
    19: {
        "name": "Al-Shaula",
        "arabic": "الشولة",
        "translation": "Le Dard",
        "stars": "λ, υ Scorpii",
        "element": "Feu",
        "nature": "Incisive et libératrice",
        "personality": "Vous êtes un(e) guerrier(ère) de la vérité. Comme le dard du scorpion, vos actions sont précises et définitives. Vous avez le courage de trancher ce qui doit l'être.",
        "influence": "Favorise la victoire sur les ennemis et la libération des entraves",
        "shadow": "Violence, cruauté",
        "gift": "La précision qui libère",
        "message": "Ton dard est un outil de libération, pas de destruction."
    },
    20: {
        "name": "Al-Na'aim",
        "arabic": "النعائم",
        "translation": "Les Autruches",
        "stars": "γ, δ, ε, η Sagittarii",
        "element": "Feu/Air",
        "nature": "Joyeuse et expansive",
        "personality": "Vous portez la joie du Sagittaire. Votre optimisme est contagieux et votre soif d'aventure insatiable. Vous avez le don de transformer les obstacles en opportunités.",
        "influence": "Favorise les voyages, l'expansion, et les entreprises audacieuses",
        "shadow": "Excès, fuite des responsabilités",
        "gift": "L'optimisme qui ouvre des portes",
        "message": "Ta joie est une flèche qui atteint toujours sa cible."
    },
    21: {
        "name": "Al-Balda",
        "arabic": "البلدة",
        "translation": "La Cité",
        "stars": "Zone entre Sagittaire et Capricorne",
        "element": "Terre/Air",
        "nature": "Silencieuse et profonde",
        "personality": "Vous êtes un(e) contemplatif(ve) né(e). Ce vide apparent est en fait un espace de profonde méditation. Votre sagesse vient du silence et de l'observation.",
        "influence": "Favorise la méditation, le retrait, et les visions spirituelles",
        "shadow": "Isolation, vide intérieur",
        "gift": "La sagesse qui naît du silence",
        "message": "Le vide que tu ressens parfois est en fait un temple intérieur."
    },
    22: {
        "name": "Sa'd al-Dhabih",
        "arabic": "سعد الذابح",
        "translation": "La Fortune du Sacrificateur",
        "stars": "α, β Capricorni",
        "element": "Terre/Eau",
        "nature": "Sacrificielle et purificatrice",
        "personality": "Vous comprenez le sens du sacrifice sacré. Non pas la souffrance inutile, mais le lâcher-prise nécessaire pour permettre au nouveau de naître.",
        "influence": "Favorise la guérison, la libération des attachements, et les nouveaux départs",
        "shadow": "Martyre, sacrifice inutile",
        "gift": "La compréhension du lâcher-prise transformateur",
        "message": "Ce que tu abandonnes fait de la place pour ce qui doit venir."
    },
    23: {
        "name": "Sa'd Bula",
        "arabic": "سعد بلع",
        "translation": "La Fortune de l'Avaleur",
        "stars": "ν, μ Aquarii",
        "element": "Eau",
        "nature": "Absorbante et intégrative",
        "personality": "Vous avez le don d'intégrer les expériences. Là où d'autres rejettent, vous absorbez et transformez. Votre capacité à digérer les épreuves est remarquable.",
        "influence": "Favorise la guérison profonde, l'intégration des traumas, et la transformation intérieure",
        "shadow": "Absorption des négativités d'autrui, indigestion émotionnelle",
        "gift": "La capacité alchimique de transformer le plomb en or",
        "message": "Ce que tu absorbes, transforme-le. Ne le garde pas tel quel."
    },
    24: {
        "name": "Sa'd al-Su'ud",
        "arabic": "سعد السعود",
        "translation": "La Plus Fortunée des Fortunes",
        "stars": "β, ξ Aquarii",
        "element": "Air/Eau",
        "nature": "Bénie et abondante",
        "personality": "Vous êtes né(e) sous une étoile de bénédiction. Une grâce particulière vous accompagne, et votre présence semble attirer la chance. Partagez cette bénédiction.",
        "influence": "Favorise tout ce qui est positif : amour, succès, guérison, prospérité",
        "shadow": "Prise pour acquis des bénédictions, ingratitude",
        "gift": "La capacité d'attirer et de répandre les bénédictions",
        "message": "Tu es béni(e). Cette grâce est faite pour être partagée."
    },
    25: {
        "name": "Sa'd al-Akhbiya",
        "arabic": "سعد الأخبية",
        "translation": "La Fortune des Tentes",
        "stars": "γ, π, ζ, η Aquarii",
        "element": "Air",
        "nature": "Protectrice et hospitalière",
        "personality": "Vous êtes un(e) créateur(trice) de refuges. Votre don est de créer des espaces où les âmes fatiguées peuvent se reposer et se ressourcer. L'hospitalité est votre nature.",
        "influence": "Favorise la protection du foyer, l'accueil, et les liens familiaux",
        "shadow": "Surprotection, repli sur le foyer",
        "gift": "La création de havres de paix",
        "message": "Les refuges que tu crées guérissent les âmes errantes."
    },
    26: {
        "name": "Al-Fargh al-Muqaddam",
        "arabic": "الفرغ المقدم",
        "translation": "Le Bec Supérieur",
        "stars": "α, β Pegasi",
        "element": "Air/Feu",
        "nature": "Initiatrice et visionnaire",
        "personality": "Vous êtes un(e) visionnaire du début. Votre regard est tourné vers l'avenir et vous avez le don de percevoir les possibilités avant qu'elles ne se manifestent.",
        "influence": "Favorise les unions, les réconciliations, et les visions d'avenir",
        "shadow": "Rêverie excessive, déconnexion du présent",
        "gift": "La vision qui précède la manifestation",
        "message": "Tes visions sont des graines d'avenir. Plante-les avec soin."
    },
    27: {
        "name": "Al-Fargh al-Mu'akhkhar",
        "arabic": "الفرغ المؤخر",
        "translation": "Le Bec Inférieur",
        "stars": "γ Pegasi, α Andromedae",
        "element": "Eau/Air",
        "nature": "Conclusive et abondante",
        "personality": "Vous êtes un(e) finisseur(se). Là où d'autres abandonnent, vous menez à terme. Votre don est de récolter les fruits des efforts passés.",
        "influence": "Favorise l'accomplissement des projets, les récoltes, et l'abondance",
        "shadow": "Attachement aux résultats, difficulté à commencer de nouveaux cycles",
        "gift": "La capacité de mener à terme et de récolter",
        "message": "Ce que tu termines devient ta fondation pour le prochain cycle."
    },
    28: {
        "name": "Batn al-Hut",
        "arabic": "بطن الحوت",
        "translation": "Le Ventre du Poisson",
        "stars": "β Andromedae",
        "element": "Eau",
        "nature": "Mystique et cyclique",
        "personality": "Vous êtes né(e) à la fin du cycle, comme Jonas dans le ventre de la baleine. Votre vie est faite de gestations et de renaissances. Chaque fin est un nouveau commencement.",
        "influence": "Favorise la méditation, la gestation des projets, et les transformations spirituelles",
        "shadow": "Peur de la renaissance, attachement aux anciennes peaux",
        "gift": "La maîtrise des cycles de mort et de renaissance",
        "message": "Le ventre qui t'enferme est aussi celui qui te prépare à renaître."
    }
}

def get_arabic_mansion_for_date(date: datetime):
    """Get Arabic lunar mansion based on moon phase with full personality data"""
    moon = calculate_moon_phase_for_date(date)
    mansion_index = (moon["day_in_cycle"] - 1) % 28
    mansion_number = mansion_index + 1
    
    mansion_data = ARABIC_MANSIONS_DATABASE.get(mansion_number, ARABIC_MANSIONS_DATABASE[1])
    return {
        "number": mansion_number,
        "name": mansion_data["name"],
        "arabic": mansion_data["arabic"],
        "translation": mansion_data["translation"],
        "stars": mansion_data["stars"],
        "element": mansion_data["element"],
        "nature": mansion_data["nature"],
        "personality": mansion_data["personality"],
        "influence": mansion_data["influence"],
        "shadow": mansion_data["shadow"],
        "gift": mansion_data["gift"],
        "message": mansion_data["message"]
    }

def calculate_lunar_house(phase_value: float):
    """Calculate Western astrological house from moon phase"""
    house_number = int(phase_value * 12) + 1
    if house_number > 12:
        house_number = 12
    house_data = ASTROLOGY_HOUSES[house_number - 1]
    return {"number": house_number, "name": house_data["name"], "theme": house_data["theme"]}

def get_zodiac_sign(month: int, day: int):
    """Get Western zodiac sign from birth date"""
    signs = [
        ((3, 21), (4, 19), "Bélier", "Feu", "Mars", "Cardinal"),
        ((4, 20), (5, 20), "Taureau", "Terre", "Vénus", "Fixe"),
        ((5, 21), (6, 20), "Gémeaux", "Air", "Mercure", "Mutable"),
        ((6, 21), (7, 22), "Cancer", "Eau", "Lune", "Cardinal"),
        ((7, 23), (8, 22), "Lion", "Feu", "Soleil", "Fixe"),
        ((8, 23), (9, 22), "Vierge", "Terre", "Mercure", "Mutable"),
        ((9, 23), (10, 22), "Balance", "Air", "Vénus", "Cardinal"),
        ((10, 23), (11, 21), "Scorpion", "Eau", "Pluton", "Fixe"),
        ((11, 22), (12, 21), "Sagittaire", "Feu", "Jupiter", "Mutable"),
        ((12, 22), (1, 19), "Capricorne", "Terre", "Saturne", "Cardinal"),
        ((1, 20), (2, 18), "Verseau", "Air", "Uranus", "Fixe"),
        ((2, 19), (3, 20), "Poissons", "Eau", "Neptune", "Mutable"),
    ]
    for start, end, name, element, planet, mode in signs:
        if start[0] > end[0]:
            if (month == start[0] and day >= start[1]) or (month == end[0] and day <= end[1]):
                return {"name": name, "element": element, "planet": planet, "mode": mode}
        else:
            if (month == start[0] and day >= start[1]) or (month == end[0] and day <= end[1]):
                return {"name": name, "element": element, "planet": planet, "mode": mode}
    return {"name": "Capricorne", "element": "Terre", "planet": "Saturne", "mode": "Cardinal"}

def calculate_ascendant(hour: int, month: int, day: int):
    """Estimate ascendant sign based on birth hour and date"""
    # Simplified ascendant: zodiac sign rising at birth hour
    # Each sign rises for ~2 hours. Sunrise sign = zodiac sign at date
    zodiac_order = [
        "Bélier", "Taureau", "Gémeaux", "Cancer", "Lion", "Vierge",
        "Balance", "Scorpion", "Sagittaire", "Capricorne", "Verseau", "Poissons"
    ]
    sun_sign = get_zodiac_sign(month, day)
    sun_index = next((i for i, s in enumerate(zodiac_order) if s == sun_sign["name"]), 0)
    # Approximate: 6h = sun sign, each 2h shifts one sign
    shift = (hour - 6) // 2
    asc_index = (sun_index + shift) % 12
    asc_name = zodiac_order[asc_index]
    elements = {"Bélier": "Feu", "Taureau": "Terre", "Gémeaux": "Air", "Cancer": "Eau",
                "Lion": "Feu", "Vierge": "Terre", "Balance": "Air", "Scorpion": "Eau",
                "Sagittaire": "Feu", "Capricorne": "Terre", "Verseau": "Air", "Poissons": "Eau"}
    return {"name": asc_name, "element": elements.get(asc_name, "")}

# ==================== LUNAR SIGN CALCULATION ====================
# The lunar sign represents where the Moon was positioned in the zodiac at birth
# This affects emotional nature, instincts, and inner self

LUNAR_SIGN_DATABASE = {
    "Bélier": {
        "element": "Feu",
        "ruler": "Mars",
        "emotional_nature": "Réactive et passionnée",
        "instincts": "Agir vite, instinct de pionnier",
        "inner_self": "Un feu intérieur qui brûle d'indépendance",
        "needs": "Liberté, action, stimulation",
        "shadow": "Impatience émotionnelle, colère soudaine",
        "gift": "Courage émotionnel, capacité à rebondir rapidement",
        "description": "Ta Lune en Bélier te confère une vie émotionnelle intense et directe. Tu ressens tout avec une urgence qui te pousse à l'action. Ton monde intérieur est un terrain de conquête où chaque émotion devient un défi à relever. Tu as besoin de te sentir vivant(e) et tes réactions instinctives sont rapides comme l'éclair."
    },
    "Taureau": {
        "element": "Terre",
        "ruler": "Vénus",
        "emotional_nature": "Stable et sensorielle",
        "instincts": "Recherche de sécurité et de confort",
        "inner_self": "Un jardin intérieur de paix et de beauté",
        "needs": "Stabilité, plaisirs sensoriels, routine apaisante",
        "shadow": "Résistance au changement, possessivité",
        "gift": "Fidélité émotionnelle, ancrage profond",
        "description": "Ta Lune en Taureau fait de ton monde intérieur un sanctuaire de paix. Tu as besoin de sentir la terre sous tes pieds pour te sentir en sécurité. Tes émotions sont profondes comme des racines et tu les nourris avec patience. Le toucher, les parfums, la beauté tangible apaisent ton âme comme rien d'autre."
    },
    "Gémeaux": {
        "element": "Air",
        "ruler": "Mercure",
        "emotional_nature": "Curieuse et changeante",
        "instincts": "Communiquer, comprendre, connecter",
        "inner_self": "Un ciel rempli de pensées qui dansent",
        "needs": "Stimulation mentale, variété, échanges",
        "shadow": "Nervosité, dispersion émotionnelle",
        "gift": "Adaptabilité, intelligence émotionnelle",
        "description": "Ta Lune en Gémeaux colore ton monde émotionnel de mille nuances. Tu ressens en pensant et tu penses en ressentant. Ton âme a soif de connexion et de compréhension. Les mots sont ton refuge - écrire, parler, lire apaise les tempêtes de ton cœur et éclaire les zones d'ombre."
    },
    "Cancer": {
        "element": "Eau",
        "ruler": "Lune",
        "emotional_nature": "Profonde et protectrice",
        "instincts": "Nourrir, protéger, se souvenir",
        "inner_self": "Un océan de tendresse et de mémoire",
        "needs": "Sécurité émotionnelle, appartenance, intimité",
        "shadow": "Hypersensibilité, attachement au passé",
        "gift": "Empathie profonde, intuition maternelle",
        "description": "Ta Lune en Cancer est chez elle - tu vis dans les vagues de l'émotion pure. Ton monde intérieur est un foyer où les souvenirs, les liens et les sentiments sont sacrés. Tu portes en toi une tendresse océanique et un besoin viscéral de te sentir appartenir. La famille - de sang ou de cœur - est ton ancre."
    },
    "Lion": {
        "element": "Feu",
        "ruler": "Soleil",
        "emotional_nature": "Généreuse et dramatique",
        "instincts": "Briller, créer, être reconnu(e)",
        "inner_self": "Un soleil intérieur qui demande à rayonner",
        "needs": "Reconnaissance, créativité, expression",
        "shadow": "Orgueil blessé, besoin excessif d'attention",
        "gift": "Générosité du cœur, chaleur rayonnante",
        "description": "Ta Lune en Lion fait de ton cœur une scène où chaque émotion mérite d'être célébrée. Tu ressens avec grandeur et tu aimes avec noblesse. Ton âme a besoin de briller et d'être vue dans sa magnificence. Quand tu donnes, c'est sans compter - ton amour est un soleil qui réchauffe tous ceux qui l'approchent."
    },
    "Vierge": {
        "element": "Terre",
        "ruler": "Mercure",
        "emotional_nature": "Analytique et serviable",
        "instincts": "Améliorer, aider, perfectionner",
        "inner_self": "Un atelier intérieur où tout peut être réparé",
        "needs": "Ordre, utilité, santé émotionnelle",
        "shadow": "Autocritique, anxiété de l'imperfection",
        "gift": "Discernement, capacité d'aide concrète",
        "description": "Ta Lune en Vierge fait de ton monde émotionnel un jardin à cultiver avec soin. Tu analyses tes sentiments pour mieux les comprendre et les apaiser. Le désordre intérieur te trouble, mais tu as le don de transformer le chaos en harmonie. Servir et aider sont tes façons d'aimer."
    },
    "Balance": {
        "element": "Air",
        "ruler": "Vénus",
        "emotional_nature": "Harmonieuse et relationnelle",
        "instincts": "Équilibrer, unir, embellir",
        "inner_self": "Un salon intérieur où tout doit être beau et juste",
        "needs": "Harmonie, relations, beauté",
        "shadow": "Indécision, dépendance relationnelle",
        "gift": "Diplomatie du cœur, sens de la justice",
        "description": "Ta Lune en Balance fait de l'harmonie ta nourriture émotionnelle. Tu ressens à travers l'autre et les relations sont le miroir de ton âme. Les conflits te troublent profondément car tu cherches l'équilibre en tout. La beauté sous toutes ses formes - art, musique, amour - apaise ton cœur."
    },
    "Scorpion": {
        "element": "Eau",
        "ruler": "Pluton",
        "emotional_nature": "Intense et transformatrice",
        "instincts": "Sonder, transformer, renaître",
        "inner_self": "Un volcan sous-marin de passions profondes",
        "needs": "Intensité, vérité, transformation",
        "shadow": "Obsession, méfiance, rancune",
        "gift": "Puissance de régénération, loyauté absolue",
        "description": "Ta Lune en Scorpion fait de toi un(e) plongeur/plongeuse des profondeurs. Tes émotions sont des courants souterrains puissants qui transforment tout ce qu'ils touchent. Tu ne connais pas la demi-mesure - tu aimes ou tu te détaches, tu fais confiance totalement ou pas du tout. Chaque crise émotionnelle est une mort et une renaissance."
    },
    "Sagittaire": {
        "element": "Feu",
        "ruler": "Jupiter",
        "emotional_nature": "Optimiste et aventurière",
        "instincts": "Explorer, croire, s'élever",
        "inner_self": "Un horizon intérieur toujours plus loin",
        "needs": "Liberté, sens, aventure spirituelle",
        "shadow": "Fuite émotionnelle, exagération",
        "gift": "Foi inébranlable, joie contagieuse",
        "description": "Ta Lune en Sagittaire donne des ailes à ton âme. Tu ressens à travers le prisme de la quête - chaque émotion est une aventure, chaque expérience une leçon. La routine émotionnelle t'étouffe, tu as besoin d'horizons nouveaux pour te sentir vivant(e). Ta joie est une flèche qui monte toujours vers le ciel."
    },
    "Capricorne": {
        "element": "Terre",
        "ruler": "Saturne",
        "emotional_nature": "Réservée et ambitieuse",
        "instincts": "Construire, endurer, accomplir",
        "inner_self": "Une montagne intérieure à gravir",
        "needs": "Respect, accomplissement, structure",
        "shadow": "Froideur apparente, mélancolie",
        "gift": "Maturité émotionnelle, force tranquille",
        "description": "Ta Lune en Capricorne fait de ton monde émotionnel une forteresse. Tu protèges tes sentiments comme des trésors précieux qu'on ne montre pas au premier venu. La maîtrise de soi est ta force, mais sous cette surface calme coule une rivière de sensibilité profonde. Tu aimes dans la durée, avec loyauté et constance."
    },
    "Verseau": {
        "element": "Air",
        "ruler": "Uranus",
        "emotional_nature": "Indépendante et humaniste",
        "instincts": "Innover, libérer, relier l'humanité",
        "inner_self": "Un ciel étoilé d'idées et d'idéaux",
        "needs": "Liberté, originalité, connexion collective",
        "shadow": "Détachement, froideur intellectuelle",
        "gift": "Vision universelle, amitié authentique",
        "description": "Ta Lune en Verseau fait de toi un(e) observateur/observatrice du cœur humain. Tu ressens pour l'humanité autant que pour les individus. Ton monde émotionnel est un laboratoire où tu expérimentes des façons nouvelles d'aimer et de vivre. La liberté émotionnelle est ton oxygène - tu refuses les chaînes du conventionnel."
    },
    "Poissons": {
        "element": "Eau",
        "ruler": "Neptune",
        "emotional_nature": "Mystique et compassionnelle",
        "instincts": "Rêver, fusionner, transcender",
        "inner_self": "Un océan cosmique sans frontières",
        "needs": "Connexion spirituelle, art, évasion créative",
        "shadow": "Confusion, victimisation, fuite",
        "gift": "Compassion infinie, créativité visionnaire",
        "description": "Ta Lune en Poissons fait de ton âme une éponge cosmique. Tu absorbes les émotions du monde comme la mer absorbe les rivières. Tes rêves sont aussi réels que la réalité, et ta sensibilité n'a pas de frontières. L'art, la musique, la spiritualité sont tes refuges - là où ton âme peut enfin danser librement."
    }
}

def calculate_lunar_sign(birth_date: datetime) -> dict:
    """
    Calculate the lunar sign (where the Moon was in the zodiac at birth).
    This is a simplified calculation based on the lunar cycle.
    The Moon spends approximately 2.5 days in each zodiac sign.
    """
    # Reference point: New Moon in Aries (a known astronomical event)
    # We use March 21, 2023 as a reference where Moon was in Aries
    reference_date = datetime(2023, 3, 21)
    
    # Calculate days since reference
    days_diff = (birth_date - reference_date).days
    
    # Lunar cycle is approximately 27.32 days (sidereal month)
    # The Moon moves through all 12 signs in this period
    # So each sign takes about 2.28 days
    sidereal_month = 27.32
    days_per_sign = sidereal_month / 12
    
    # Calculate position in the cycle
    position_in_cycle = (days_diff % sidereal_month)
    sign_index = int(position_in_cycle / days_per_sign) % 12
    
    zodiac_order = [
        "Bélier", "Taureau", "Gémeaux", "Cancer", "Lion", "Vierge",
        "Balance", "Scorpion", "Sagittaire", "Capricorne", "Verseau", "Poissons"
    ]
    
    sign_name = zodiac_order[sign_index]
    sign_data = LUNAR_SIGN_DATABASE.get(sign_name, LUNAR_SIGN_DATABASE["Bélier"])
    
    return {
        "name": sign_name,
        "element": sign_data["element"],
        "ruler": sign_data["ruler"],
        "emotional_nature": sign_data["emotional_nature"],
        "instincts": sign_data["instincts"],
        "inner_self": sign_data["inner_self"],
        "needs": sign_data["needs"],
        "shadow": sign_data["shadow"],
        "gift": sign_data["gift"],
        "description": sign_data["description"]
    }

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
    zodiac_sign = get_zodiac_sign(month, day)
    lunar_sign = calculate_lunar_sign(birth_dt)  # NEW: Signe lunaire
    
    # Calculate ascendant if birth hour provided
    ascendant = None
    if input.birth_hour:
        try:
            hour = int(input.birth_hour.split(':')[0])
            ascendant = calculate_ascendant(hour, month, day)
        except (ValueError, IndexError):
            pass

    # Generate AI interpretation
    ai_interpretation = await generate_astrology_interpretation(
        input.name, input.birth_date, input.birth_place, input.birth_hour,
        moon_phase, celtic_tree, arabic_mansion, lunar_house, zodiac_sign, ascendant, lunar_sign
    )

    profile_id = str(uuid.uuid4())
    profile = {
        "id": profile_id,
        "name": input.name,
        "birth_date": input.birth_date,
        "birth_place": input.birth_place,
        "birth_hour": input.birth_hour,
        "zodiac_sign": zodiac_sign,
        "lunar_sign": lunar_sign,  # NEW
        "ascendant": ascendant,
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

async def generate_astrology_interpretation(name, birth_date, birth_place, birth_hour, moon_phase, celtic_tree, arabic_mansion, lunar_house, zodiac_sign, ascendant, lunar_sign=None):
    """Generate AI-powered astrological interpretation with GPT-4o"""
    system_prompt = """Tu es un astrologue-poète d'une érudition rare, maîtrisant les traditions occidentale, celtique et arabe.
Tu composes des portraits astrologiques qui sont de véritables œuvres littéraires : précis, profonds et lumineux.

STRUCTURE DE TON PORTRAIT :
1. **Ouverture poétique** - Une image évocatrice liée au signe solaire et à la Lune
2. **Le Soleil** - L'essence de l'être, sa mission de vie (signe solaire)
3. **L'Ascendant** - Le masque et la manière d'aborder le monde (si disponible)
4. **Le Signe Lunaire** - TRÈS IMPORTANT : Le monde émotionnel profond, l'inconscient, les besoins intimes. Développe en profondeur ce que signifie avoir la Lune dans ce signe.
5. **L'Arbre Celtique** - La sagesse druidique : décris l'arbre, son symbolisme dans la tradition celte, comment il influence la personnalité. Mentionne l'ogham (alphabet sacré).
6. **La Demeure Lunaire Arabe (Manzil)** - La tradition des 28 demeures : explique cette demeure spécifique, sa signification en astrologie arabe, son influence subtile sur le destin.
7. **La Phase Lunaire de Naissance** - Comment la phase de la Lune au moment de la naissance colore la personnalité
8. **Fermeture** - Un message personnel poétique

STYLE : Poétique, précis, personnel (utilise le prénom). 6-8 paragraphes riches et développés.
Tu ne prédis pas l'avenir. Tu éclaires l'essence profonde."""

    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"astro-profile-{uuid.uuid4()}",
        system_message=system_prompt
    ).with_model("openai", "gpt-4o")

    hour_info = f"\n**Heure de naissance** : {birth_hour}" if birth_hour else ""
    asc_info = f"\n- Ascendant : {ascendant['name']} ({ascendant['element']})" if ascendant else "\n- Ascendant : non calculé (heure non fournie)"
    
    lunar_sign_info = ""
    if lunar_sign:
        lunar_sign_info = f"""
- **SIGNE LUNAIRE** : {lunar_sign['name']} ({lunar_sign['element']})
  - Nature émotionnelle : {lunar_sign['emotional_nature']}
  - Instincts : {lunar_sign['instincts']}
  - Moi intérieur : {lunar_sign['inner_self']}
  - Besoins : {lunar_sign['needs']}
  - Don : {lunar_sign['gift']}"""

    prompt = f"""Compose un portrait astrologique complet et détaillé pour :

**Prénom** : {name}
**Date de naissance** : {birth_date}{hour_info}
**Lieu de naissance** : {birth_place}

**Données calculées** :
- Signe solaire : {zodiac_sign['name']} ({zodiac_sign['element']}, planète {zodiac_sign['planet']}, mode {zodiac_sign['mode']}){asc_info}{lunar_sign_info}
- Phase lunaire de naissance : {moon_phase['name']} (jour {moon_phase['day_in_cycle']} du cycle)
- Arbre celtique : {celtic_tree['tree']} ({celtic_tree['meaning']})
- Demeure lunaire arabe : {arabic_mansion['name']} (demeure n°{arabic_mansion['number']})
- Maison astrologique : {lunar_house['name']} ({lunar_house['theme']})

IMPORTANT : Développe particulièrement :
1. Le signe lunaire et ce qu'il révèle sur la vie émotionnelle et les besoins profonds
2. L'arbre celtique avec son symbolisme druidique complet
3. La demeure arabe et son influence sur le chemin de vie

Rédige un portrait qui tisse ces différentes traditions en un tout cohérent, riche et profondément éclairant."""

    try:
        response = await chat.send_message(UserMessage(text=prompt))
        return response
    except Exception as e:
        logging.error(f"Astrology interpretation error: {e}")
        lunar_msg = f", avec ta Lune en {lunar_sign['name']}" if lunar_sign else ""
        return f"Les astres murmurent pour {name}... Né(e) sous le signe {zodiac_sign['name']}{lunar_msg}, en phase de {moon_phase['name']}, guidé(e) par l'arbre {celtic_tree['tree']} et la demeure de {arabic_mansion['name']}, ton chemin brille d'une lumière unique."

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

# ==================== DREAM ORACLE ROUTES ====================

class DreamOracleRequest(BaseModel):
    dreams: List[dict]
    patterns: List[dict]
    dominantEmotion: str

@api_router.post("/dream-oracle/analyze")
async def analyze_dream_oracle(request: DreamOracleRequest):
    """Analyze dream patterns using AI to provide deep insights"""
    
    system_prompt = """Tu es un Oracle des Rêves, un guide mystique qui lit les messages de l'inconscient.
Tu analyses les patterns récurrents dans les rêves pour révéler des vérités profondes sur l'âme.

TON STYLE:
- Mystérieux et poétique, comme un oracle ancien
- Profond mais bienveillant
- Tu parles de l'âme, de l'inconscient, des cycles
- Tu fais des liens avec les archétypes jungiens
- Tu ne donnes JAMAIS de conseils médicaux

FORMAT DE RÉPONSE (JSON strict):
{
  "patterns": [liste des patterns analysés avec signification],
  "emotionalTheme": "thème émotionnel dominant",
  "deepMessage": "message profond de 2-3 paragraphes poétiques",
  "guidance": ["conseil 1", "conseil 2", "conseil 3"]
}

Les conseils doivent être spirituels/introspectifs, pas pratiques."""

    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"oracle-{uuid.uuid4()}",
        system_message=system_prompt
    ).with_model("openai", "gpt-4o")

    dream_summaries = []
    for d in request.dreams[:10]:
        dream_summaries.append(f"- {d.get('title', 'Rêve')}: {d.get('content', '')[:200]}...")

    patterns_text = "\n".join([f"- {p.get('symbol', '')}: apparu {p.get('count', 0)} fois ({p.get('meaning', '')})" 
                               for p in request.patterns[:5]])

    prompt = f"""Analyse ces rêves comme un Oracle:

SYMBOLES RÉCURRENTS:
{patterns_text}

ÉMOTION DOMINANTE: {request.dominantEmotion}

RÊVES RÉCENTS:
{chr(10).join(dream_summaries)}

Révèle les messages cachés de l'inconscient. Réponds en JSON."""

    try:
        response = await chat.send_message(UserMessage(text=prompt))
        # Try to parse JSON from response
        import json
        # Clean the response - remove markdown code blocks if present
        clean_response = response.strip()
        if clean_response.startswith("```json"):
            clean_response = clean_response[7:]
        if clean_response.startswith("```"):
            clean_response = clean_response[3:]
        if clean_response.endswith("```"):
            clean_response = clean_response[:-3]
        
        result = json.loads(clean_response.strip())
        return result
    except Exception as e:
        logging.error(f"Dream oracle error: {e}")
        # Return fallback response
        return {
            "patterns": request.patterns,
            "emotionalTheme": request.dominantEmotion,
            "deepMessage": f"Les voiles de tes rêves révèlent une âme en transformation. L'émotion de {request.dominantEmotion} qui traverse tes nuits parle d'un processus intérieur profond. Ton inconscient te guide vers une compréhension nouvelle de toi-même.",
            "guidance": [
                "Avant de dormir, pose une question à ton inconscient",
                "Tiens un carnet près de ton lit pour capturer tes rêves au réveil",
                "Médite sur les symboles qui reviennent souvent"
            ]
        }

# ==================== LUNAR RITUALS ROUTES ====================

MOON_PHASE_DATA = {
    "Nouvelle Lune": {
        "energy": "Introspection, plantation de graines, nouveaux départs",
        "element": "Terre",
        "focus": "Intentions et manifestation",
        "ritual_themes": ["intention", "méditation", "silence", "planification"],
    },
    "Premier Croissant": {
        "energy": "Action, courage, premiers pas",
        "element": "Feu",
        "focus": "Surmonter les doutes",
        "ritual_themes": ["action", "courage", "mouvement", "engagement"],
    },
    "Premier Quartier": {
        "energy": "Décision, engagement, persévérance",
        "element": "Feu",
        "focus": "Obstacles et croissance",
        "ritual_themes": ["décision", "engagement", "force", "clarté"],
    },
    "Gibbeuse Croissante": {
        "energy": "Raffinement, patience, ajustements",
        "element": "Eau",
        "focus": "Perfectionner et affiner",
        "ritual_themes": ["patience", "raffinement", "gratitude", "persévérance"],
    },
    "Pleine Lune": {
        "energy": "Culmination, libération, gratitude",
        "element": "Eau",
        "focus": "Célébration et lâcher-prise",
        "ritual_themes": ["libération", "gratitude", "célébration", "clarté"],
    },
    "Gibbeuse Décroissante": {
        "energy": "Partage, transmission, générosité",
        "element": "Air",
        "focus": "Donner et enseigner",
        "ritual_themes": ["partage", "générosité", "sagesse", "diffusion"],
    },
    "Dernier Quartier": {
        "energy": "Introspection, bilan, réflexion",
        "element": "Terre",
        "focus": "Faire le point",
        "ritual_themes": ["bilan", "introspection", "pardon", "compréhension"],
    },
    "Dernier Croissant": {
        "energy": "Repos, préparation, lâcher-prise",
        "element": "Eau",
        "focus": "Se ressourcer",
        "ritual_themes": ["repos", "abandon", "vide fertile", "préparation"],
    },
}

@api_router.get("/lunar-phase/current")
async def get_current_lunar_phase():
    """Get the current moon phase with detailed information"""
    now = datetime.utcnow()
    moon = calculate_moon_phase_for_date(now)
    phase_name = moon["name"]
    phase_data = MOON_PHASE_DATA.get(phase_name, MOON_PHASE_DATA["Nouvelle Lune"])
    
    return {
        "phase": phase_name,
        "day_in_cycle": moon["day_in_cycle"],
        "phase_index": moon["phase_index"],
        "energy": phase_data["energy"],
        "element": phase_data["element"],
        "focus": phase_data["focus"],
        "ritual_themes": phase_data["ritual_themes"],
    }

class LunarRitualRequest(BaseModel):
    phase: str
    intention: Optional[str] = None

@api_router.post("/lunar-rituals/generate")
async def generate_lunar_ritual(request: LunarRitualRequest):
    """Generate a personalized lunar ritual based on current phase"""
    
    phase_data = MOON_PHASE_DATA.get(request.phase, MOON_PHASE_DATA["Nouvelle Lune"])
    
    system_prompt = f"""Tu es un guide spirituel spécialisé dans les rituels lunaires.
Tu crées des rituels personnalisés basés sur la phase de lune actuelle.

PHASE ACTUELLE: {request.phase}
ÉNERGIE: {phase_data['energy']}
ÉLÉMENT: {phase_data['element']}
FOCUS: {phase_data['focus']}

TON STYLE:
- Poétique et mystique
- Pratique mais spirituel
- Connecté à la nature et aux cycles
- Bienveillant et inclusif

FORMAT DE RÉPONSE (JSON):
{{
  "title": "Titre poétique du rituel",
  "duration": "10-20 min",
  "intention": "L'intention du rituel",
  "preparation": ["élément 1", "élément 2"],
  "steps": ["étape 1", "étape 2", "étape 3", "étape 4", "étape 5"],
  "closing": "Phrase de clôture poétique",
  "affirmation": "Une affirmation à répéter"
}}"""

    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"ritual-{uuid.uuid4()}",
        system_message=system_prompt
    ).with_model("openai", "gpt-4o")

    intention_text = f"\nL'intention personnelle: {request.intention}" if request.intention else ""
    prompt = f"Crée un rituel pour la {request.phase}.{intention_text}\nRéponds en JSON uniquement."

    try:
        response = await chat.send_message(UserMessage(text=prompt))
        import json
        clean_response = response.strip()
        if clean_response.startswith("```json"):
            clean_response = clean_response[7:]
        if clean_response.startswith("```"):
            clean_response = clean_response[3:]
        if clean_response.endswith("```"):
            clean_response = clean_response[:-3]
        
        result = json.loads(clean_response.strip())
        result["phase"] = request.phase
        result["phase_data"] = phase_data
        return result
    except Exception as e:
        logging.error(f"Lunar ritual generation error: {e}")
        # Fallback ritual
        return {
            "title": f"Rituel de la {request.phase}",
            "duration": "15 min",
            "phase": request.phase,
            "phase_data": phase_data,
            "intention": f"Se connecter à l'énergie de la {request.phase}",
            "preparation": ["Une bougie", "Un espace calme", "Quelques minutes de silence"],
            "steps": [
                "Allume ta bougie et prends 3 respirations profondes",
                f"Connecte-toi à l'énergie de {phase_data['focus'].lower()}",
                "Pose tes mains sur ton cœur et ressens",
                "Formule ton intention à voix haute ou en silence",
                "Remercie la lune pour sa guidance"
            ],
            "closing": "Que la lumière de la lune guide tes pas.",
            "affirmation": f"Je suis aligné(e) avec les cycles de la nature."
        }

# ==================== CADENCE (Daily Routine) ROUTES ====================

class CadenceRitual(BaseModel):
    id: str
    type: str
    title: str
    description: str
    duration: str
    completed: bool = False

@api_router.get("/cadence/daily")
async def get_daily_cadence():
    """Get personalized daily micro-rituals based on time of day and moon phase"""
    now = datetime.utcnow()
    hour = now.hour
    moon = calculate_moon_phase_for_date(now)
    phase_name = moon["name"]
    
    # Determine time of day
    if hour < 12:
        time_of_day = "matin"
        greeting = "Le jour se lève. Prends un moment pour toi avant que le monde ne s'éveille."
    elif hour < 18:
        time_of_day = "apres-midi"
        greeting = "L'après-midi t'invite à une pause. Recentre-toi sur l'essentiel."
    else:
        time_of_day = "soir"
        greeting = "La nuit approche. C'est le moment de faire le bilan et de lâcher prise."
    
    # Generate rituals based on moon phase
    rituals = []
    
    # Always start with breath
    rituals.append({
        "id": "breath",
        "type": "respiration",
        "title": "Trois respirations conscientes",
        "description": "Inspire profondément par le nez, retiens un instant, expire lentement par la bouche. Répète trois fois.",
        "duration": "2 min",
        "completed": False,
    })
    
    # Introspection based on moon phase
    questions = {
        "Nouvelle Lune": "Quelle intention veux-tu planter pour ce nouveau cycle ?",
        "Premier Croissant": "Quel petit pas peux-tu faire aujourd'hui vers ton rêve ?",
        "Premier Quartier": "Qu'est-ce qui te retient ? Comment le dépasser ?",
        "Gibbeuse Croissante": "Que dois-tu ajuster ou affiner dans ta vie ?",
        "Pleine Lune": "De quoi as-tu besoin de te libérer ?",
        "Gibbeuse Décroissante": "Que peux-tu partager ou transmettre ?",
        "Dernier Quartier": "Qu'as-tu appris récemment sur toi-même ?",
        "Dernier Croissant": "De quoi as-tu besoin pour te ressourcer ?",
    }
    rituals.append({
        "id": "introspection",
        "type": "introspection",
        "title": "Question du jour",
        "description": questions.get(phase_name, "Qu'est-ce qui t'habite en ce moment ?"),
        "duration": "5 min",
        "completed": False,
    })
    
    # Gratitude
    rituals.append({
        "id": "gratitude",
        "type": "gratitude",
        "title": "Un moment de gratitude",
        "description": "Pense à une chose, même infime, pour laquelle tu ressens de la reconnaissance.",
        "duration": "2 min",
        "completed": False,
    })
    
    # Silence
    rituals.append({
        "id": "silence",
        "type": "silence",
        "title": "Une minute de silence",
        "description": "Ferme les yeux. Écoute le silence entre les sons. Ne fais rien d'autre que d'être.",
        "duration": "1 min",
        "completed": False,
    })
    
    moon_influence = f"La {phase_name} t'invite à {MOON_PHASE_DATA.get(phase_name, {}).get('focus', 'l\\'introspection').lower()}."
    
    return {
        "greeting": greeting,
        "moonInfluence": moon_influence,
        "rituals": rituals,
        "eveningReflection": "Ce soir, avant de dormir, demande-toi : qu'ai-je appris aujourd'hui sur moi-même ?" if time_of_day == "soir" else None,
    }

# ==================== SACRED QUOTES ROUTES ====================

@api_router.get("/sacred-quote")
async def get_sacred_quote():
    """Get a personalized sacred quote based on user mood"""
    # Get latest mood
    mood_data = await db.moods.find_one(sort=[("date", -1)])
    mood = mood_data.get("mood", "neutre") if mood_data else "neutre"
    
    system_prompt = """Tu es un sage qui connaît les textes sacrés et la poésie spirituelle de toutes les traditions.
Tu choisis UNE citation adaptée à l'état émotionnel de la personne.

IMPORTANT:
- Ne catégorise JAMAIS la source (pas de "Coran", "Bible", "Torah" explicite)
- Cite simplement l'auteur ou la tradition
- Mélange : poètes soufis (Rumi, Hafiz), sages anciens, textes sacrés, philosophes
- La citation doit être profonde, poétique, réconfortante

Réponds UNIQUEMENT en JSON:
{"text": "citation ici", "author": "auteur ou tradition"}"""

    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"quote-{uuid.uuid4()}",
        system_message=system_prompt
    ).with_model("openai", "gpt-4o")

    prompt = f"La personne ressent : {mood}. Donne une citation sacrée ou poétique qui résonne avec cet état."

    try:
        response = await chat.send_message(UserMessage(text=prompt))
        clean_response = response.strip()
        if clean_response.startswith("```json"):
            clean_response = clean_response[7:]
        if clean_response.startswith("```"):
            clean_response = clean_response[3:]
        if clean_response.endswith("```"):
            clean_response = clean_response[:-3]
        
        result = json.loads(clean_response.strip())
        return result
    except Exception as e:
        logging.error(f"Sacred quote error: {e}")
        return {
            "text": "Ce que tu cherches te cherche aussi.",
            "author": "Rumi"
        }

# ==================== LETTER TO SELF ROUTES ====================

class LetterCreate(BaseModel):
    content: str
    delivery_months: int
    delivery_date: Optional[str] = None

@api_router.post("/letter")
async def create_letter(letter: LetterCreate):
    """Create a letter to future self"""
    delivery_date = datetime.utcnow() + timedelta(days=letter.delivery_months * 30)
    
    letter_doc = {
        "id": str(uuid.uuid4()),
        "content": letter.content,
        "delivery_months": letter.delivery_months,
        "delivery_date": delivery_date.isoformat(),
        "created_at": datetime.utcnow().isoformat(),
        "delivered": False,
    }
    
    await db.letters.insert_one(letter_doc)
    return {"success": True, "delivery_date": letter_doc["delivery_date"]}

@api_router.get("/letters")
async def get_letters():
    """Get all letters"""
    letters = await db.letters.find({}, {"_id": 0}).sort("delivery_date", 1).to_list(100)
    return letters

@api_router.get("/letters/delivered")
async def get_delivered_letters():
    """Get letters that should be delivered now"""
    now = datetime.utcnow().isoformat()
    letters = await db.letters.find(
        {"delivery_date": {"$lte": now}, "delivered": False},
        {"_id": 0}
    ).to_list(100)
    return letters

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
