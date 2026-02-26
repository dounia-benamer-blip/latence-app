"""
Test suite for Latence App - Iteration 4
Testing: Letter, Cadence, Sacred-Quote APIs
"""
import pytest
import requests
import os
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://dream-journal-app-2.preview.emergentagent.com')
if not BASE_URL.endswith('/'):
    BASE_URL = BASE_URL.rstrip('/')

class TestHealthCheck:
    """Basic health checks"""
    
    def test_api_root(self):
        """Test API root endpoint"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print(f"API Root response: {data}")

class TestLetterAPI:
    """Test Letter to Future Self API"""
    
    def test_create_letter(self):
        """Test creating a letter to future self"""
        payload = {
            "content": "TEST_Lettre: Cher moi du futur, ceci est un test d'envoi de lettre.",
            "delivery_months": 1
        }
        response = requests.post(
            f"{BASE_URL}/api/letter",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        print(f"Create letter status: {response.status_code}")
        print(f"Create letter response: {response.text[:500] if response.text else 'Empty'}")
        assert response.status_code == 200
        data = response.json()
        assert "success" in data
        assert data["success"] == True
        assert "delivery_date" in data
        print(f"Letter created successfully, delivery_date: {data['delivery_date']}")
    
    def test_get_letters(self):
        """Test getting all letters"""
        response = requests.get(f"{BASE_URL}/api/letters")
        print(f"Get letters status: {response.status_code}")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Found {len(data)} letters")
        if data:
            letter = data[-1]  # Get last letter
            assert "content" in letter
            assert "delivery_months" in letter
            print(f"Sample letter content preview: {letter.get('content', '')[:100]}...")

class TestCadenceAPI:
    """Test Cadence (Daily Rituals) API"""
    
    def test_get_daily_cadence(self):
        """Test getting daily cadence rituals"""
        response = requests.get(f"{BASE_URL}/api/cadence/daily")
        print(f"Daily cadence status: {response.status_code}")
        assert response.status_code == 200
        data = response.json()
        assert "greeting" in data
        assert "rituals" in data
        assert isinstance(data["rituals"], list)
        assert len(data["rituals"]) > 0
        print(f"Daily cadence greeting: {data['greeting'][:100]}...")
        print(f"Found {len(data['rituals'])} rituals")
        # Check ritual structure
        ritual = data["rituals"][0]
        assert "id" in ritual
        assert "type" in ritual
        assert "title" in ritual
        assert "description" in ritual
        print(f"First ritual: {ritual['title']}")
    
    def test_get_cadence_streak(self):
        """Test getting user's cadence streak"""
        response = requests.get(f"{BASE_URL}/api/cadence/streak")
        print(f"Cadence streak status: {response.status_code}")
        assert response.status_code == 200
        data = response.json()
        assert "streak" in data
        assert "total_completions" in data
        print(f"Current streak: {data['streak']} days")
        print(f"Total completions: {data['total_completions']}")
    
    def test_complete_cadence_ritual(self):
        """Test marking a ritual as completed"""
        payload = {
            "ritual_id": "TEST_breath",
            "ritual_type": "respiration",  # Required field
            "completed_at": None
        }
        response = requests.post(
            f"{BASE_URL}/api/cadence/complete",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        print(f"Complete ritual status: {response.status_code}")
        print(f"Complete ritual response: {response.text[:300] if response.text else 'Empty'}")
        assert response.status_code == 200
        data = response.json()
        assert "success" in data
        assert data["success"] == True
        print(f"Ritual completion result: {data}")

class TestSacredQuoteAPI:
    """Test Sacred Quote API"""
    
    def test_get_sacred_quote(self):
        """Test getting a sacred quote"""
        response = requests.get(f"{BASE_URL}/api/sacred-quote")
        print(f"Sacred quote status: {response.status_code}")
        assert response.status_code == 200
        data = response.json()
        assert "text" in data
        assert "author" in data
        print(f"Sacred quote: \"{data['text']}\" - {data['author']}")
    
    def test_get_sacred_text_by_mood(self):
        """Test getting sacred text based on mood"""
        moods = ["serein", "joyeux", "melancolique", "anxieux"]
        for mood in moods:
            response = requests.get(f"{BASE_URL}/api/sacred-text/{mood}")
            print(f"Sacred text for '{mood}' status: {response.status_code}")
            assert response.status_code == 200
            data = response.json()
            assert "text" in data
            assert "source" in data
            print(f"  {mood}: \"{data['text'][:60]}...\" - {data['source']}")

class TestMoodAPI:
    """Test Mood tracking API"""
    
    def test_create_mood(self):
        """Test creating a mood entry"""
        payload = {
            "mood": "serein",
            "energy_level": 4,
            "notes": "TEST_Mood: Testing mood creation"
        }
        response = requests.post(
            f"{BASE_URL}/api/mood",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        print(f"Create mood status: {response.status_code}")
        assert response.status_code == 200
        data = response.json()
        assert "mood" in data
        assert data["mood"] == "serein"
        assert "energy_level" in data
        print(f"Mood created: {data['mood']} with energy {data['energy_level']}")
    
    def test_get_latest_mood(self):
        """Test getting latest mood"""
        response = requests.get(f"{BASE_URL}/api/mood/latest")
        print(f"Latest mood status: {response.status_code}")
        # Can be 200 or null if no moods exist
        assert response.status_code == 200

if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
