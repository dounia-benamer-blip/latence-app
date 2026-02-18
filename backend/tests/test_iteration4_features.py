"""
Test suite for Iteration 4 - Lunar Rituals and Dream Oracle features
Tests:
- Home page menu items (no Tarot/Compatibilité, Rituels Lunaires first)
- Lunar phase API
- Lunar rituals generation API
- Dream oracle analysis API
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('EXPO_PUBLIC_BACKEND_URL', 'https://aura-wisdom.preview.emergentagent.com')

class TestLunarPhaseAPI:
    """Test /api/lunar-phase/current endpoint"""
    
    def test_lunar_phase_returns_current_phase(self):
        """GET /api/lunar-phase/current returns current moon phase data"""
        response = requests.get(f"{BASE_URL}/api/lunar-phase/current")
        assert response.status_code == 200
        
        data = response.json()
        assert "phase" in data
        assert "day_in_cycle" in data
        assert "energy" in data
        assert "element" in data
        assert "focus" in data
        assert "ritual_themes" in data
        
        # Validate data types
        assert isinstance(data["phase"], str)
        assert isinstance(data["day_in_cycle"], int)
        assert data["day_in_cycle"] >= 1 and data["day_in_cycle"] <= 29
        assert isinstance(data["ritual_themes"], list)
        
        print(f"PASS: Lunar phase API returns: {data['phase']}, day {data['day_in_cycle']}")


class TestLunarRitualsAPI:
    """Test /api/lunar-rituals/generate endpoint"""
    
    def test_generate_ritual_with_default_phase(self):
        """POST /api/lunar-rituals/generate creates personalized ritual"""
        payload = {
            "phase": "Pleine Lune",
            "intention": None
        }
        response = requests.post(
            f"{BASE_URL}/api/lunar-rituals/generate",
            json=payload,
            timeout=60
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "title" in data
        assert "duration" in data
        assert "steps" in data
        assert "affirmation" in data
        
        # Validate structure
        assert isinstance(data["steps"], list)
        assert len(data["steps"]) > 0
        
        print(f"PASS: Generated ritual: {data['title']}")
        print(f"  - Duration: {data['duration']}")
        print(f"  - Steps: {len(data['steps'])}")
    
    def test_generate_ritual_with_custom_intention(self):
        """POST /api/lunar-rituals/generate with custom intention"""
        payload = {
            "phase": "Nouvelle Lune",
            "intention": "Manifester l'abondance"
        }
        response = requests.post(
            f"{BASE_URL}/api/lunar-rituals/generate",
            json=payload,
            timeout=60
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "title" in data
        assert "intention" in data
        
        print(f"PASS: Generated ritual with intention: {data['title']}")
    
    def test_generate_ritual_various_phases(self):
        """Test ritual generation for different moon phases"""
        phases = [
            "Nouvelle Lune",
            "Premier Quartier",
            "Pleine Lune",
            "Dernier Quartier"
        ]
        
        for phase in phases:
            payload = {"phase": phase, "intention": None}
            response = requests.post(
                f"{BASE_URL}/api/lunar-rituals/generate",
                json=payload,
                timeout=60
            )
            assert response.status_code == 200
            data = response.json()
            assert "title" in data
            print(f"  PASS: {phase} -> {data.get('title', 'OK')}")


class TestDreamOracleAPI:
    """Test /api/dream-oracle/analyze endpoint"""
    
    def test_dream_oracle_analyze_with_dreams(self):
        """POST /api/dream-oracle/analyze returns oracle reading"""
        payload = {
            "dreams": [
                {"id": "1", "title": "Rêve de vol", "content": "Je volais au-dessus de l'eau, une lune brillante dans le ciel", "emotions": ["liberté", "paix"]},
                {"id": "2", "title": "Rêve de forêt", "content": "Dans une forêt sombre, un serpent m'a guidé vers une maison ancienne", "emotions": ["curiosité", "peur"]},
                {"id": "3", "title": "Rêve de miroir", "content": "Je me voyais dans un miroir qui reflétait ma mort et renaissance", "emotions": ["transformation"]}
            ],
            "patterns": [
                {"symbol": "eau", "count": 2, "meaning": "Émotions, inconscient"},
                {"symbol": "vol", "count": 1, "meaning": "Liberté, évasion"},
                {"symbol": "serpent", "count": 1, "meaning": "Transformation"}
            ],
            "dominantEmotion": "transformation"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/dream-oracle/analyze",
            json=payload,
            timeout=90
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "patterns" in data or "deepMessage" in data
        assert "guidance" in data
        
        print("PASS: Dream oracle analysis returned")
        if "deepMessage" in data:
            print(f"  Message length: {len(data['deepMessage'])} chars")
        if "guidance" in data:
            print(f"  Guidance items: {len(data['guidance'])}")
    
    def test_dream_oracle_with_minimal_data(self):
        """Test oracle with minimal dream data"""
        payload = {
            "dreams": [
                {"id": "1", "title": "Test", "content": "Un simple rêve", "emotions": ["calme"]}
            ],
            "patterns": [],
            "dominantEmotion": "calme"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/dream-oracle/analyze",
            json=payload,
            timeout=60
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "guidance" in data
        print("PASS: Dream oracle handles minimal data")


class TestExistingAPIsStillWorking:
    """Verify existing APIs still work after changes"""
    
    def test_root_api(self):
        """GET /api/ returns API info"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print(f"PASS: Root API: {data['message']}")
    
    def test_dreams_list(self):
        """GET /api/dreams returns dreams list"""
        response = requests.get(f"{BASE_URL}/api/dreams")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"PASS: Dreams list returns {len(data)} dreams")
    
    def test_capsules_list(self):
        """GET /api/capsules returns capsules"""
        response = requests.get(f"{BASE_URL}/api/capsules")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"PASS: Capsules list returns {len(data)} capsules")
    
    def test_mood_latest(self):
        """GET /api/mood/latest returns mood or null"""
        response = requests.get(f"{BASE_URL}/api/mood/latest")
        assert response.status_code == 200
        print("PASS: Mood latest endpoint working")
    
    def test_notifications_daily(self):
        """GET /api/notifications/daily returns daily notification"""
        response = requests.get(f"{BASE_URL}/api/notifications/daily")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "moon_phase" in data
        print(f"PASS: Daily notification: {data['moon_phase']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])
