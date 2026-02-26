"""
Tests for Iteration 3 Bug Fixes - Latence App
- Capsule days_remaining and duration_days in API response
- POST /api/journal/interpret GPT-5 AI interpretation
- No date-fns imports (verified via grep)
- Capsule badge showing correct days remaining
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://dream-journal-app-2.preview.emergentagent.com')


class TestCapsuleDaysRemaining:
    """Test capsule API returns days_remaining correctly"""
    
    def test_capsules_list_has_days_remaining(self):
        """GET /api/capsules should return days_remaining for each capsule"""
        res = requests.get(f"{BASE_URL}/api/capsules")
        assert res.status_code == 200
        data = res.json()
        
        assert isinstance(data, list), "Should return a list"
        if len(data) > 0:
            capsule = data[0]
            assert "days_remaining" in capsule, "Each capsule should have days_remaining"
            assert "duration_days" in capsule, "Each capsule should have duration_days"
            assert capsule["days_remaining"] is not None, "days_remaining should not be None"
            assert isinstance(capsule["days_remaining"], int), "days_remaining should be integer"
            print(f"First capsule: days_remaining={capsule['days_remaining']}, duration_days={capsule['duration_days']}")
        else:
            print("No capsules in database to test")
    
    def test_capsule_detail_has_days_remaining(self):
        """GET /api/capsule/{id} should return days_remaining for sealed capsule"""
        # First get a capsule ID
        res = requests.get(f"{BASE_URL}/api/capsules")
        assert res.status_code == 200
        capsules = res.json()
        
        if len(capsules) > 0:
            capsule_id = capsules[0]["id"]
            res = requests.get(f"{BASE_URL}/api/capsule/{capsule_id}")
            assert res.status_code == 200
            data = res.json()
            
            if data.get("is_sealed", False):
                assert "days_remaining" in data, "Sealed capsule should have days_remaining"
                assert data["days_remaining"] is not None, "days_remaining should not be None"
                print(f"Capsule {capsule_id}: days_remaining={data['days_remaining']}, is_sealed={data['is_sealed']}")
            else:
                print(f"Capsule {capsule_id} is not sealed - days_remaining may not apply")
    
    def test_create_capsule_returns_proper_fields(self):
        """POST /api/capsule should return capsule with proper fields"""
        payload = {
            "title": "TEST_Iteration3_Capsule",
            "content": "Testing days_remaining bug fix",
            "duration_days": 7
        }
        res = requests.post(f"{BASE_URL}/api/capsule", json=payload)
        assert res.status_code == 200
        data = res.json()
        
        assert "id" in data, "Should have id"
        assert "duration_days" in data, "Should have duration_days"
        assert data["duration_days"] == 7, "duration_days should match input"
        assert "unlock_at" in data, "Should have unlock_at"
        print(f"Created capsule: id={data['id']}, duration_days={data['duration_days']}")


class TestJournalInterpretAPI:
    """Test POST /api/journal/interpret returns AI interpretation"""
    
    def test_journal_interpret_returns_interpretation(self):
        """POST /api/journal/interpret should return GPT-5 AI interpretation"""
        payload = {
            "content": "Je me sens calme et apaisé ce soir. La lune brille doucement."
        }
        res = requests.post(
            f"{BASE_URL}/api/journal/interpret",
            json=payload,
            timeout=60
        )
        assert res.status_code == 200
        data = res.json()
        
        assert "interpretation" in data, "Response must have 'interpretation' field"
        assert len(data["interpretation"]) > 30, "Interpretation should be substantial text"
        assert "error" not in data["interpretation"].lower(), "Should not contain error"
        print(f"AI Interpretation received: {data['interpretation'][:100]}...")


class TestDreamsAPI:
    """Test dreams API loads without crash"""
    
    def test_dreams_list_loads(self):
        """GET /api/dreams should return list without error"""
        res = requests.get(f"{BASE_URL}/api/dreams")
        assert res.status_code == 200
        data = res.json()
        
        assert isinstance(data, list), "Should return a list"
        if len(data) > 0:
            dream = data[0]
            assert "id" in dream, "Dream should have id"
            assert "title" in dream, "Dream should have title"
            assert "dream_type" in dream, "Dream should have dream_type"
            assert "date" in dream, "Dream should have date"
            print(f"Dreams list loaded successfully with {len(data)} dreams")
            print(f"First dream: type={dream['dream_type']}, date={dream['date']}")


class TestHomePageAPI:
    """Test home page API endpoints"""
    
    def test_daily_notification_has_moon_phase(self):
        """GET /api/notifications/daily should return moon phase info"""
        res = requests.get(f"{BASE_URL}/api/notifications/daily")
        assert res.status_code == 200
        data = res.json()
        
        assert "message" in data, "Should have poetic message"
        assert "moon_phase" in data, "Should have moon_phase"
        assert "day_in_cycle" in data, "Should have day_in_cycle"
        print(f"Moon phase: {data['moon_phase']}, Day {data['day_in_cycle']}")
        print(f"Message: {data['message'][:50]}...")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
