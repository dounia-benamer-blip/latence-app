"""
Tests for Latence Journal App - Key Features
- Journal interpretation API (GPT-5)
- Dream journal with interpretation
- Astrology profile with birth_hour and zodiac/ascendant
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://cosy-ai-diary.preview.emergentagent.com')

class TestBasicEndpoints:
    """Basic API health checks"""
    
    def test_api_root(self):
        """Verify API is running"""
        res = requests.get(f"{BASE_URL}/api/")
        assert res.status_code == 200
        data = res.json()
        assert "message" in data
        print(f"API root response: {data}")
    
    def test_notifications_daily(self):
        """Test daily poetic notification endpoint"""
        res = requests.get(f"{BASE_URL}/api/notifications/daily")
        assert res.status_code == 200
        data = res.json()
        assert "message" in data, "Daily notification should have 'message' field"
        assert "moon_phase" in data, "Should include moon_phase"
        assert "day_in_cycle" in data, "Should include day_in_cycle"
        print(f"Daily notification: {data['message'][:50]}... Moon: {data['moon_phase']}")


class TestJournalInterpretation:
    """Test journal entry and AI interpretation"""
    
    def test_create_journal_entry(self):
        """Create a simple journal entry"""
        payload = {
            "content": "TEST_Aujourd'hui j'ai ressenti une paix profonde en contemplant le coucher de soleil.",
            "date": "2026-02-16T12:00:00"
        }
        res = requests.post(f"{BASE_URL}/api/journal", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert "id" in data
        assert "content" in data
        print(f"Journal entry created with ID: {data['id']}")
    
    def test_journal_interpret_endpoint(self):
        """Test POST /api/journal/interpret with AI (GPT-5) - may take 10-30s"""
        payload = {
            "content": "Je me sens perdu dans mes pensées aujourd'hui. Le temps passe et je cherche ma direction."
        }
        res = requests.post(
            f"{BASE_URL}/api/journal/interpret",
            json=payload,
            timeout=60  # AI calls can take up to 30s
        )
        assert res.status_code == 200
        data = res.json()
        assert "interpretation" in data, "Response should have 'interpretation' field"
        assert len(data["interpretation"]) > 20, "Interpretation should be substantial"
        print(f"Journal interpretation (first 100 chars): {data['interpretation'][:100]}...")
    
    def test_journal_interpret_with_mood(self):
        """Test journal interpretation with mood context"""
        payload = {
            "content": "Les étoiles brillent ce soir et je pense à l'avenir.",
            "mood": "contemplatif"
        }
        res = requests.post(
            f"{BASE_URL}/api/journal/interpret",
            json=payload,
            timeout=60
        )
        assert res.status_code == 200
        data = res.json()
        assert "interpretation" in data
        print(f"Interpretation with mood (first 100 chars): {data['interpretation'][:100]}...")


class TestDreamJournal:
    """Test dream journal CRUD and interpretation"""
    
    def test_create_dream(self):
        """Create a dream entry with is_recurring, dream_type, emotions"""
        payload = {
            "title": "TEST_Rêve de vol",
            "content": "J'ai rêvé que je volais au-dessus des montagnes, je ressentais une liberté immense.",
            "dream_type": "reve",
            "emotions": ["joie", "paix"]
        }
        res = requests.post(f"{BASE_URL}/api/dream", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert "id" in data
        assert data["dream_type"] == "reve"
        assert data["emotions"] == ["joie", "paix"]
        print(f"Dream created with ID: {data['id']}, type: {data['dream_type']}")
        return data["id"]
    
    def test_create_nightmare(self):
        """Create a nightmare dream entry"""
        payload = {
            "title": "TEST_Cauchemar de chute",
            "content": "Je tombais sans fin dans un gouffre noir et j'avais très peur.",
            "dream_type": "cauchemar",
            "emotions": ["peur", "angoisse"]
        }
        res = requests.post(f"{BASE_URL}/api/dream", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert data["dream_type"] == "cauchemar"
        print(f"Nightmare created with ID: {data['id']}")
    
    def test_create_recurring_dream(self):
        """Create a recurring dream entry"""
        payload = {
            "title": "TEST_Rêve récurrent",
            "content": "Encore une fois je rêve que je suis dans une maison inconnue avec des portes sans fin.",
            "dream_type": "recurrent",
            "emotions": ["confusion", "nostalgie"]
        }
        res = requests.post(f"{BASE_URL}/api/dream", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert data["dream_type"] == "recurrent"
        print(f"Recurring dream created with ID: {data['id']}")
    
    def test_get_dreams_list(self):
        """Get list of all dreams"""
        res = requests.get(f"{BASE_URL}/api/dreams")
        assert res.status_code == 200
        data = res.json()
        assert isinstance(data, list)
        print(f"Found {len(data)} dreams in database")
    
    def test_dream_interpret_endpoint(self):
        """Test POST /api/dream/interpret with GPT-5 Freud/Jung analysis"""
        payload = {
            "dream_content": "J'ai rêvé que je nageais dans un océan profond et bleu, avec des poissons lumineux autour de moi.",
            "dream_type": "reve",
            "emotions": ["paix", "emerveillement"]
        }
        res = requests.post(
            f"{BASE_URL}/api/dream/interpret",
            json=payload,
            timeout=60
        )
        assert res.status_code == 200
        data = res.json()
        assert "interpretation" in data, "Response should have 'interpretation' field"
        assert len(data["interpretation"]) > 50, "Dream interpretation should be substantial"
        print(f"Dream interpretation (first 150 chars): {data['interpretation'][:150]}...")
    
    def test_dream_interpret_nightmare(self):
        """Test nightmare interpretation"""
        payload = {
            "dream_content": "Une ombre noire me poursuivait dans un couloir sans fin. Je ne pouvais pas crier.",
            "dream_type": "cauchemar",
            "emotions": ["peur", "angoisse"]
        }
        res = requests.post(
            f"{BASE_URL}/api/dream/interpret",
            json=payload,
            timeout=60
        )
        assert res.status_code == 200
        data = res.json()
        assert "interpretation" in data
        print(f"Nightmare interpretation (first 150 chars): {data['interpretation'][:150]}...")


class TestAstrologyProfile:
    """Test astrology profile with birth_hour for ascendant calculation"""
    
    def test_create_profile_without_birth_hour(self):
        """Create astrology profile without birth hour (no ascendant)"""
        payload = {
            "name": "TEST_Marie",
            "birth_date": "15/06/1990",
            "birth_place": "Paris"
        }
        res = requests.post(
            f"{BASE_URL}/api/astrology/profile",
            json=payload,
            timeout=60
        )
        assert res.status_code == 200
        data = res.json()
        
        # Verify required fields
        assert "id" in data
        assert "zodiac_sign" in data, "Should have zodiac_sign"
        assert data["zodiac_sign"]["name"] == "Gémeaux", "June 15 should be Gemini/Gémeaux"
        assert data["ascendant"] is None, "Without birth_hour, ascendant should be None"
        assert "celtic_tree" in data
        assert "arabic_mansion" in data
        assert "lunar_house" in data
        assert "moon_phase_at_birth" in data
        print(f"Profile created: {data['name']}, Zodiac: {data['zodiac_sign']['name']}, Ascendant: {data['ascendant']}")
    
    def test_create_profile_with_birth_hour(self):
        """Create astrology profile with birth hour (should calculate ascendant)"""
        payload = {
            "name": "TEST_Jean",
            "birth_date": "21/03/1985",
            "birth_place": "Lyon",
            "birth_hour": "14:30"
        }
        res = requests.post(
            f"{BASE_URL}/api/astrology/profile",
            json=payload,
            timeout=60
        )
        assert res.status_code == 200
        data = res.json()
        
        # Verify zodiac sign
        assert data["zodiac_sign"]["name"] == "Bélier", "March 21 should be Aries/Bélier"
        
        # Verify ascendant is calculated
        assert data["ascendant"] is not None, "With birth_hour, ascendant should be calculated"
        assert "name" in data["ascendant"], "Ascendant should have a name"
        assert "element" in data["ascendant"], "Ascendant should have an element"
        
        # Verify AI interpretation
        assert "ai_interpretation" in data, "Should include AI interpretation"
        assert len(data.get("ai_interpretation", "")) > 50, "AI interpretation should be substantial"
        
        print(f"Profile: {data['name']}, Zodiac: {data['zodiac_sign']['name']}, Ascendant: {data['ascendant']['name']}")
        print(f"AI interpretation (first 100 chars): {data.get('ai_interpretation', 'N/A')[:100]}...")
    
    def test_get_latest_profile(self):
        """Test GET /api/astrology/profile/latest returns zodiac and ascendant"""
        res = requests.get(f"{BASE_URL}/api/astrology/profile/latest")
        assert res.status_code == 200
        data = res.json()
        
        if data:
            assert "zodiac_sign" in data, "Latest profile should have zodiac_sign"
            print(f"Latest profile: {data.get('name')}, has zodiac: {'yes' if data.get('zodiac_sign') else 'no'}, has ascendant: {'yes' if data.get('ascendant') else 'no'}")
        else:
            print("No profile found (empty response)")
    
    def test_invalid_date_format(self):
        """Test error handling for invalid date format"""
        payload = {
            "name": "TEST_Invalid",
            "birth_date": "1990-06-15",  # Wrong format
            "birth_place": "Paris"
        }
        res = requests.post(f"{BASE_URL}/api/astrology/profile", json=payload)
        assert res.status_code == 400
        print("Invalid date format correctly rejected")


class TestMoodAndSacredTexts:
    """Test mood tracking and sacred texts"""
    
    def test_create_mood(self):
        """Create a mood entry"""
        payload = {
            "mood": "contemplatif",
            "energy_level": 3,
            "notes": "TEST_Une journée de réflexion"
        }
        res = requests.post(f"{BASE_URL}/api/mood", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert data["mood"] == "contemplatif"
        assert data["energy_level"] == 3
        print(f"Mood created: {data['mood']}, energy: {data['energy_level']}")
    
    def test_get_sacred_text(self):
        """Get sacred text based on mood"""
        res = requests.get(f"{BASE_URL}/api/sacred-text/serein")
        assert res.status_code == 200
        data = res.json()
        assert "text" in data
        assert "source" in data
        print(f"Sacred text: '{data['text'][:50]}...' - {data['source']}")
    
    def test_get_book_recommendations(self):
        """Get book recommendations based on mood"""
        res = requests.get(f"{BASE_URL}/api/book-recommendations/melancolique")
        assert res.status_code == 200
        data = res.json()
        assert "recommendations" in data
        assert len(data["recommendations"]) > 0
        print(f"Book recommendations: {[b['title'] for b in data['recommendations']]}")


class TestLunarFeatures:
    """Test lunar reading and astrology data"""
    
    def test_lunar_reading(self):
        """Test AI lunar reading"""
        payload = {
            "moon_phase": "Premier Croissant",
            "mansion": "Al-Butain"
        }
        res = requests.post(
            f"{BASE_URL}/api/lunar-reading",
            json=payload,
            timeout=30
        )
        assert res.status_code == 200
        data = res.json()
        assert "reading" in data
        print(f"Lunar reading: {data['reading'][:100]}...")
    
    def test_get_celtic_zodiac(self):
        """Test Celtic zodiac data"""
        res = requests.get(f"{BASE_URL}/api/astrology/celtic")
        assert res.status_code == 200
        data = res.json()
        assert "trees" in data
        assert len(data["trees"]) == 13  # 13 Celtic trees
        print(f"Celtic trees: {len(data['trees'])} trees loaded")
    
    def test_get_houses(self):
        """Test astrological houses data"""
        res = requests.get(f"{BASE_URL}/api/astrology/houses")
        assert res.status_code == 200
        data = res.json()
        assert "houses" in data
        assert len(data["houses"]) == 12  # 12 houses
        print(f"Astrological houses: {len(data['houses'])} houses loaded")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
