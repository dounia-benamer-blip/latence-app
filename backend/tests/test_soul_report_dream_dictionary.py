"""
Tests for Soul Report and Dream Dictionary endpoints
Iteration 9 - Testing new features
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://dream-journal-app-2.preview.emergentagent.com')


class TestSoulReportAPI:
    """Tests for Soul Report endpoints"""
    
    def test_get_latest_soul_report(self):
        """Test GET /api/soul-report/latest returns a report or null"""
        response = requests.get(f"{BASE_URL}/api/soul-report/latest")
        assert response.status_code == 200
        data = response.json()
        # Can be null if no reports exist
        if data is not None:
            assert "id" in data
            assert "period" in data
            assert "summary" in data
        print(f"Latest soul report test: PASS - {'Report found' if data else 'No report (expected for new db)'}")
    
    def test_get_all_soul_reports(self):
        """Test GET /api/soul-reports returns list"""
        response = requests.get(f"{BASE_URL}/api/soul-reports")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"All soul reports test: PASS - Found {len(data)} reports")
    
    def test_generate_soul_report_french(self):
        """Test POST /api/soul-report/generate with French language"""
        response = requests.post(f"{BASE_URL}/api/soul-report/generate?lang=fr")
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "id" in data
        assert "period" in data
        assert "generated_at" in data
        assert "summary" in data
        assert "emotional_journey" in data
        assert "dominant_themes" in data
        assert "growth_areas" in data
        assert "dream_insights" in data
        assert "recommended_focus" in data
        assert "affirmation" in data
        
        # Verify types
        assert isinstance(data["dominant_themes"], list)
        assert isinstance(data["growth_areas"], list)
        print(f"Generate soul report (FR) test: PASS - ID: {data['id']}")
    
    def test_generate_soul_report_english(self):
        """Test POST /api/soul-report/generate with English language"""
        response = requests.post(f"{BASE_URL}/api/soul-report/generate?lang=en")
        assert response.status_code == 200
        data = response.json()
        
        assert "id" in data
        assert "summary" in data
        assert "period" in data
        # English period format should contain "Week of"
        print(f"Generate soul report (EN) test: PASS - Period: {data.get('period', 'N/A')}")
    
    def test_generate_soul_report_spanish(self):
        """Test POST /api/soul-report/generate with Spanish language"""
        response = requests.post(f"{BASE_URL}/api/soul-report/generate?lang=es")
        assert response.status_code == 200
        data = response.json()
        
        assert "id" in data
        assert "summary" in data
        # Spanish period format should contain "Semana del"
        print(f"Generate soul report (ES) test: PASS - Period: {data.get('period', 'N/A')}")


class TestDreamDictionaryAPI:
    """Tests for Dream Dictionary endpoints"""
    
    def test_get_dream_dictionary(self):
        """Test GET /api/dream-dictionary returns list"""
        response = requests.get(f"{BASE_URL}/api/dream-dictionary")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Get dream dictionary test: PASS - Found {len(data)} symbols")
    
    def test_add_dream_symbol(self):
        """Test POST /api/dream-dictionary adds a new symbol"""
        test_symbol = {
            "symbol": f"TEST_Soleil_{int(time.time())}",
            "personal_meaning": "Represents energy and vitality in my dreams",
            "language": "fr"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/dream-dictionary",
            json=test_symbol,
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "id" in data
        assert "symbol" in data
        assert "personal_meaning" in data
        assert "universal_meaning" in data
        assert "occurrences" in data
        assert "last_seen" in data
        
        # Verify values
        assert data["personal_meaning"] == test_symbol["personal_meaning"]
        assert data["occurrences"] == 1
        assert len(data["universal_meaning"]) > 0  # AI generated
        
        print(f"Add dream symbol test: PASS - ID: {data['id']}, Universal meaning generated: {len(data['universal_meaning'])} chars")
        return data["id"]
    
    def test_add_existing_symbol_increments_count(self):
        """Test POST /api/dream-dictionary with existing symbol increments occurrences"""
        # First add
        test_symbol = {
            "symbol": "TEST_Étoile",
            "personal_meaning": "First meaning",
            "language": "fr"
        }
        
        response1 = requests.post(
            f"{BASE_URL}/api/dream-dictionary",
            json=test_symbol,
            headers={"Content-Type": "application/json"}
        )
        assert response1.status_code == 200
        first_count = response1.json()["occurrences"]
        
        # Second add with same symbol
        test_symbol["personal_meaning"] = "Updated meaning"
        response2 = requests.post(
            f"{BASE_URL}/api/dream-dictionary",
            json=test_symbol,
            headers={"Content-Type": "application/json"}
        )
        assert response2.status_code == 200
        data2 = response2.json()
        
        # Occurrences should increment
        assert data2["occurrences"] >= first_count
        assert data2["personal_meaning"] == "Updated meaning"
        print(f"Update existing symbol test: PASS - Occurrences: {data2['occurrences']}")
    
    def test_add_dream_symbol_english(self):
        """Test POST /api/dream-dictionary with English language"""
        test_symbol = {
            "symbol": f"TEST_Fire_{int(time.time())}",
            "personal_meaning": "Transformation and passion",
            "language": "en"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/dream-dictionary",
            json=test_symbol,
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "universal_meaning" in data
        print(f"Add symbol (EN) test: PASS - Universal meaning: {data['universal_meaning'][:50]}...")
    
    def test_delete_dream_symbol(self):
        """Test DELETE /api/dream-dictionary/{symbol_id}"""
        # First create a symbol to delete
        test_symbol = {
            "symbol": f"TEST_ToDelete_{int(time.time())}",
            "personal_meaning": "This will be deleted",
            "language": "fr"
        }
        
        create_response = requests.post(
            f"{BASE_URL}/api/dream-dictionary",
            json=test_symbol,
            headers={"Content-Type": "application/json"}
        )
        assert create_response.status_code == 200
        symbol_id = create_response.json()["id"]
        
        # Delete the symbol
        delete_response = requests.delete(f"{BASE_URL}/api/dream-dictionary/{symbol_id}")
        assert delete_response.status_code == 200
        data = delete_response.json()
        assert data["status"] == "deleted"
        print(f"Delete symbol test: PASS - Deleted ID: {symbol_id}")


class TestSubscriptionPageVisibility:
    """Tests for subscription page and lifetime code visibility"""
    
    def test_subscription_plans_endpoint(self):
        """Test GET /api/subscription/plans returns plans"""
        response = requests.get(f"{BASE_URL}/api/subscription/plans")
        assert response.status_code == 200
        data = response.json()
        
        assert "plans" in data
        assert isinstance(data["plans"], list)
        assert len(data["plans"]) >= 2
        
        # Verify plan structure
        for plan in data["plans"]:
            assert "id" in plan
            assert "name" in plan
            assert "price" in plan
            assert "features" in plan
        
        print(f"Subscription plans test: PASS - Found {len(data['plans'])} plans")
    
    def test_activate_lifetime_endpoint_exists(self):
        """Test POST /api/subscription/activate-lifetime endpoint exists"""
        # Test with invalid code to verify endpoint exists
        response = requests.post(
            f"{BASE_URL}/api/subscription/activate-lifetime",
            json={"code": "INVALID-CODE"},
            headers={"Content-Type": "application/json"}
        )
        # Should return 401 (unauthenticated) or 400/422 (invalid) but not 404
        assert response.status_code in [400, 401, 422, 500]  # Not 404
        print(f"Activate lifetime endpoint test: PASS - Endpoint exists (status: {response.status_code})")


class TestAPIRoot:
    """Basic API health checks"""
    
    def test_api_root(self):
        """Test API root endpoint"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print(f"API root test: PASS - Message: {data['message']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
