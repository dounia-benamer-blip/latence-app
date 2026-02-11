"""
Backend API Tests for Latence Astrology Journal App
Tests: Mood, Sacred Text, Astrology Profile, Notifications, Capsules, Dreams
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://moon-feelings.preview.emergentagent.com')

class TestHealthAndBasicEndpoints:
    """Test basic API health and root endpoints"""
    
    def test_api_root(self):
        """Test API root endpoint"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert data["message"] == "Astro Journal API"
        print("✅ API root endpoint working")

class TestMoodEndpoints:
    """Tests for mood-related endpoints"""
    
    def test_create_mood(self):
        """Test creating a mood entry"""
        payload = {
            "mood": "serein",
            "energy_level": 4,
            "notes": "Test mood entry"
        }
        response = requests.post(f"{BASE_URL}/api/mood", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["mood"] == "serein"
        assert data["energy_level"] == 4
        assert "id" in data
        assert "timestamp" in data
        print("✅ Mood creation working")
    
    def test_get_moods(self):
        """Test getting all mood entries"""
        response = requests.get(f"{BASE_URL}/api/mood")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✅ Get moods working - found {len(data)} moods")
    
    def test_get_latest_mood(self):
        """Test getting latest mood"""
        response = requests.get(f"{BASE_URL}/api/mood/latest")
        assert response.status_code == 200
        # Can be null if no moods
        print("✅ Get latest mood working")

class TestSacredTextEndpoints:
    """Tests for sacred text endpoints"""
    
    def test_get_sacred_text_serein(self):
        """Test getting sacred text for 'serein' mood"""
        response = requests.get(f"{BASE_URL}/api/sacred-text/serein")
        assert response.status_code == 200
        data = response.json()
        assert "text" in data
        assert "source" in data
        assert len(data["text"]) > 0
        print(f"✅ Sacred text for serein: '{data['text'][:50]}...'")
    
    def test_get_sacred_text_melancolique(self):
        """Test getting sacred text for 'melancolique' mood"""
        response = requests.get(f"{BASE_URL}/api/sacred-text/melancolique")
        assert response.status_code == 200
        data = response.json()
        assert "text" in data
        assert "source" in data
        print("✅ Sacred text for melancolique working")

class TestDailyNotifications:
    """Tests for daily notification endpoint with moon phase"""
    
    def test_get_daily_notification(self):
        """Test GET /api/notifications/daily returns poetic message with moon phase"""
        response = requests.get(f"{BASE_URL}/api/notifications/daily")
        assert response.status_code == 200
        data = response.json()
        
        # Verify required fields
        assert "message" in data, "Missing 'message' field"
        assert "moon_phase" in data, "Missing 'moon_phase' field"
        assert "day_in_cycle" in data, "Missing 'day_in_cycle' field"
        
        # Verify message is a non-empty string
        assert isinstance(data["message"], str)
        assert len(data["message"]) > 10
        
        # Verify moon_phase is one of the valid phases
        valid_phases = [
            "Nouvelle Lune", "Premier Croissant", "Premier Quartier",
            "Gibbeuse Croissante", "Pleine Lune", "Gibbeuse Décroissante",
            "Dernier Quartier", "Dernier Croissant"
        ]
        assert data["moon_phase"] in valid_phases
        
        # Verify day_in_cycle is between 1-28
        assert 1 <= data["day_in_cycle"] <= 28
        
        print(f"✅ Daily notification working - Phase: {data['moon_phase']}, Message: {data['message'][:50]}...")

class TestAstrologyProfileEndpoints:
    """Tests for astrology profile creation and retrieval"""
    
    def test_create_astrology_profile(self):
        """Test POST /api/astrology/profile with name, birth_date, birth_place"""
        payload = {
            "name": "TEST_Astrologie",
            "birth_date": "21/06/1985",
            "birth_place": "Lyon, France"
        }
        response = requests.post(f"{BASE_URL}/api/astrology/profile", json=payload)
        assert response.status_code == 200
        data = response.json()
        
        # Verify all required fields
        assert data["name"] == "TEST_Astrologie"
        assert data["birth_date"] == "21/06/1985"
        assert data["birth_place"] == "Lyon, France"
        assert "id" in data
        
        # Verify astrological calculations
        assert "celtic_tree" in data
        assert "tree" in data["celtic_tree"]
        assert "meaning" in data["celtic_tree"]
        
        assert "arabic_mansion" in data
        assert "number" in data["arabic_mansion"]
        assert "name" in data["arabic_mansion"]
        
        assert "lunar_house" in data
        assert "number" in data["lunar_house"]
        assert "name" in data["lunar_house"]
        
        assert "moon_phase_at_birth" in data
        assert "name" in data["moon_phase_at_birth"]
        
        # Verify AI interpretation was generated
        assert "ai_interpretation" in data
        assert isinstance(data["ai_interpretation"], str)
        assert len(data["ai_interpretation"]) > 50
        
        print(f"✅ Profile created - Celtic: {data['celtic_tree']['tree']}, Mansion: {data['arabic_mansion']['name']}")
    
    def test_create_astrology_profile_required_fields(self):
        """Test that all 3 fields are required"""
        # Test with missing name
        payload = {"birth_date": "15/06/1990", "birth_place": "Paris"}
        response = requests.post(f"{BASE_URL}/api/astrology/profile", json=payload)
        assert response.status_code == 422  # Validation error
        print("✅ Missing name field correctly rejected")
        
        # Test with missing birth_date
        payload = {"name": "Test", "birth_place": "Paris"}
        response = requests.post(f"{BASE_URL}/api/astrology/profile", json=payload)
        assert response.status_code == 422
        print("✅ Missing birth_date field correctly rejected")
        
        # Test with missing birth_place
        payload = {"name": "Test", "birth_date": "15/06/1990"}
        response = requests.post(f"{BASE_URL}/api/astrology/profile", json=payload)
        assert response.status_code == 422
        print("✅ Missing birth_place field correctly rejected")
    
    def test_get_latest_astrology_profile(self):
        """Test GET /api/astrology/profile/latest returns saved profile"""
        response = requests.get(f"{BASE_URL}/api/astrology/profile/latest")
        assert response.status_code == 200
        data = response.json()
        
        # Should return the latest profile (may be null if none exist)
        if data:
            assert "name" in data
            assert "birth_date" in data
            assert "birth_place" in data
            print(f"✅ Latest profile retrieved: {data['name']}")
        else:
            print("✅ Get latest profile working (no profile saved yet)")
    
    def test_invalid_date_format(self):
        """Test that invalid date format returns 400 error"""
        payload = {
            "name": "Test",
            "birth_date": "1990-06-15",  # Wrong format (should be DD/MM/YYYY)
            "birth_place": "Paris"
        }
        response = requests.post(f"{BASE_URL}/api/astrology/profile", json=payload)
        assert response.status_code == 400
        print("✅ Invalid date format correctly rejected")

class TestAstrologyDataEndpoints:
    """Tests for astrology data endpoints"""
    
    def test_get_astrology_houses(self):
        """Test getting all 12 astrological houses"""
        response = requests.get(f"{BASE_URL}/api/astrology/houses")
        assert response.status_code == 200
        data = response.json()
        assert "houses" in data
        assert len(data["houses"]) == 12
        print("✅ Got all 12 astrological houses")
    
    def test_get_celtic_zodiac(self):
        """Test getting all 13 Celtic trees"""
        response = requests.get(f"{BASE_URL}/api/astrology/celtic")
        assert response.status_code == 200
        data = response.json()
        assert "trees" in data
        assert len(data["trees"]) == 13
        print("✅ Got all 13 Celtic trees")
    
    def test_get_celtic_sign_for_date(self):
        """Test getting Celtic sign for a specific birth date"""
        response = requests.get(f"{BASE_URL}/api/astrology/celtic/06-21")  # Summer solstice
        assert response.status_code == 200
        data = response.json()
        assert "tree" in data
        print(f"✅ Celtic sign for 06-21: {data['tree']}")
    
    def test_get_dream_symbols(self):
        """Test getting dream symbols database"""
        response = requests.get(f"{BASE_URL}/api/symbols")
        assert response.status_code == 200
        data = response.json()
        assert "symbols" in data
        assert len(data["symbols"]) > 0
        print(f"✅ Got {len(data['symbols'])} dream symbols")

class TestBookRecommendations:
    """Tests for book recommendation endpoint"""
    
    def test_get_book_recommendations(self):
        """Test getting book recommendations for mood"""
        response = requests.get(f"{BASE_URL}/api/book-recommendations/serein")
        assert response.status_code == 200
        data = response.json()
        assert "recommendations" in data
        assert len(data["recommendations"]) > 0
        for book in data["recommendations"]:
            assert "title" in book
            assert "author" in book
            assert "why" in book
        print(f"✅ Got {len(data['recommendations'])} book recommendations")

class TestCapsuleEndpoints:
    """Tests for time capsule endpoints"""
    
    def test_create_capsule(self):
        """Test creating a time capsule"""
        payload = {
            "title": "TEST_Capsule",
            "content": "This is a test capsule content",
            "prompt_used": "Test prompt",
            "duration_days": 7
        }
        response = requests.post(f"{BASE_URL}/api/capsule", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "TEST_Capsule"
        assert "id" in data
        assert "unlock_at" in data
        assert data["is_sealed"] == True
        print(f"✅ Capsule created with ID: {data['id']}")
        return data["id"]
    
    def test_get_capsules(self):
        """Test getting all capsules"""
        response = requests.get(f"{BASE_URL}/api/capsules")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✅ Got {len(data)} capsules")

class TestDreamEndpoints:
    """Tests for dream journal endpoints"""
    
    def test_create_dream(self):
        """Test creating a dream entry"""
        payload = {
            "title": "TEST_Dream",
            "content": "Flying over a forest",
            "dream_type": "lucide",
            "emotions": ["serein", "joyeux"]
        }
        response = requests.post(f"{BASE_URL}/api/dream", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "TEST_Dream"
        assert "id" in data
        print(f"✅ Dream created with ID: {data['id']}")
    
    def test_get_dreams(self):
        """Test getting all dreams"""
        response = requests.get(f"{BASE_URL}/api/dreams")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✅ Got {len(data)} dreams")

class TestWritingPrompts:
    """Tests for writing prompts"""
    
    def test_get_prompts(self):
        """Test getting writing prompts"""
        response = requests.get(f"{BASE_URL}/api/prompts")
        assert response.status_code == 200
        data = response.json()
        assert "prompts" in data
        assert len(data["prompts"]) > 0
        print(f"✅ Got {len(data['prompts'])} writing prompts")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
