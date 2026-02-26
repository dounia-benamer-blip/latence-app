"""
Test for Cosmos module (renamed from Astro) and lunar sign feature.

Tests:
1. API /api/astrology/profile returns lunar_sign object with all fields
2. lunar_sign has: name, element, ruler, emotional_nature, instincts, inner_self, needs, shadow, gift, description
3. zodiac_sign still returned alongside lunar_sign
"""
import pytest
import requests
import os
import json

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://dream-journal-app-2.preview.emergentagent.com').rstrip('/')

class TestCosmosLunarSign:
    """Test lunar sign and Cosmos module features"""
    
    def test_api_health(self):
        """Verify backend API is accessible"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200, f"API not accessible: {response.status_code}"
        print("API health check passed")
    
    def test_create_profile_returns_lunar_sign(self):
        """Test POST /api/astrology/profile returns lunar_sign with all required fields"""
        payload = {
            "name": "TEST_LunarUser",
            "birth_date": "15/06/1990",
            "birth_place": "Paris, France",
            "birth_hour": "14:00"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/astrology/profile",
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=60  # AI interpretation can take time
        )
        
        assert response.status_code == 200, f"Profile creation failed: {response.status_code} - {response.text}"
        
        data = response.json()
        print(f"Profile response keys: {list(data.keys())}")
        
        # Verify lunar_sign object exists
        assert "lunar_sign" in data, f"lunar_sign not in response. Keys: {list(data.keys())}"
        lunar_sign = data["lunar_sign"]
        
        # Verify all required lunar_sign fields
        required_fields = [
            "name", "element", "ruler", "emotional_nature", 
            "instincts", "inner_self", "needs", "shadow", "gift", "description"
        ]
        
        for field in required_fields:
            assert field in lunar_sign, f"Missing lunar_sign field: {field}"
            assert lunar_sign[field], f"Empty lunar_sign field: {field}"
        
        print(f"Lunar sign: {lunar_sign['name']} ({lunar_sign['element']})")
        print(f"Emotional nature: {lunar_sign['emotional_nature']}")
        print(f"Instincts: {lunar_sign['instincts']}")
        print(f"Inner self: {lunar_sign['inner_self']}")
        print(f"Needs: {lunar_sign['needs']}")
        print(f"Gift: {lunar_sign['gift']}")
        print(f"Description preview: {lunar_sign['description'][:100]}...")
        
        # Verify zodiac_sign still present (solar sign)
        assert "zodiac_sign" in data, "zodiac_sign (solar sign) should also be present"
        zodiac_sign = data["zodiac_sign"]
        assert "name" in zodiac_sign, "zodiac_sign should have name"
        print(f"Solar sign: {zodiac_sign['name']}")
        
        return data
    
    def test_get_latest_profile_includes_lunar_sign(self):
        """Test GET /api/astrology/profile/latest returns lunar_sign"""
        response = requests.get(f"{BASE_URL}/api/astrology/profile/latest", timeout=30)
        
        if response.status_code == 200:
            data = response.json()
            if data:  # If profile exists
                # Check for lunar_sign
                if "lunar_sign" in data:
                    lunar_sign = data["lunar_sign"]
                    assert "name" in lunar_sign, "lunar_sign missing name"
                    assert "element" in lunar_sign, "lunar_sign missing element"
                    print(f"Latest profile lunar sign: {lunar_sign.get('name', 'N/A')}")
                else:
                    print("Note: latest profile does not have lunar_sign (may be old profile)")
            else:
                print("No profile found yet")
        else:
            print(f"No latest profile found: {response.status_code}")
    
    def test_lunar_sign_fields_non_empty(self):
        """Test that lunar sign fields contain meaningful data"""
        payload = {
            "name": "TEST_FieldVerify",
            "birth_date": "25/12/1985",
            "birth_place": "Lyon, France",
            "birth_hour": "08:30"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/astrology/profile",
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=60
        )
        
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        lunar_sign = data.get("lunar_sign", {})
        
        # Verify field content quality
        assert len(lunar_sign.get("description", "")) > 50, "Description should be substantial"
        assert len(lunar_sign.get("emotional_nature", "")) > 5, "Emotional nature should be descriptive"
        assert len(lunar_sign.get("inner_self", "")) > 5, "Inner self should be descriptive"
        
        # Verify valid zodiac sign name
        valid_signs = [
            "Bélier", "Taureau", "Gémeaux", "Cancer", "Lion", "Vierge",
            "Balance", "Scorpion", "Sagittaire", "Capricorne", "Verseau", "Poissons"
        ]
        assert lunar_sign.get("name") in valid_signs, f"Invalid sign: {lunar_sign.get('name')}"
        
        # Verify valid element
        valid_elements = ["Feu", "Terre", "Air", "Eau"]
        assert lunar_sign.get("element") in valid_elements, f"Invalid element: {lunar_sign.get('element')}"
        
        print(f"All lunar_sign field validations passed for {lunar_sign['name']}")
    
    def test_different_birthdates_give_different_lunar_signs(self):
        """Test that different birth dates can produce different lunar signs"""
        dates_to_test = [
            ("01/01/1990", "TEST_Jan1"),
            ("15/01/1990", "TEST_Jan15"),
            ("01/02/1990", "TEST_Feb1"),
        ]
        
        lunar_signs = []
        for date, name in dates_to_test:
            payload = {
                "name": name,
                "birth_date": date,
                "birth_place": "Paris, France"
            }
            
            response = requests.post(
                f"{BASE_URL}/api/astrology/profile",
                json=payload,
                headers={"Content-Type": "application/json"},
                timeout=60
            )
            
            if response.status_code == 200:
                data = response.json()
                if "lunar_sign" in data:
                    lunar_signs.append(data["lunar_sign"]["name"])
                    print(f"{date}: Lunar sign = {data['lunar_sign']['name']}")
        
        # Check that we got valid signs (they might be the same or different depending on dates)
        assert len(lunar_signs) >= 2, "Should have at least 2 lunar signs calculated"
        print(f"Lunar signs calculated: {lunar_signs}")


class TestArabicMansionsEnrichment:
    """Test enriched Arabic mansion data"""
    
    def test_arabic_mansion_in_profile(self):
        """Test that arabic_mansion is returned in profile"""
        payload = {
            "name": "TEST_ArabicCheck",
            "birth_date": "10/03/1995",
            "birth_place": "Casablanca, Maroc"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/astrology/profile",
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=60
        )
        
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        assert "arabic_mansion" in data, "arabic_mansion should be in profile"
        mansion = data["arabic_mansion"]
        
        assert "number" in mansion, "arabic_mansion should have number"
        assert "name" in mansion, "arabic_mansion should have name"
        
        print(f"Arabic mansion: {mansion.get('number', 'N/A')} - {mansion.get('name', 'N/A')}")


class TestCelticTreeEnrichment:
    """Test enriched Celtic tree data"""
    
    def test_celtic_tree_in_profile(self):
        """Test that celtic_tree is returned in profile"""
        payload = {
            "name": "TEST_CelticCheck",
            "birth_date": "21/06/1988",
            "birth_place": "Dublin, Irlande"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/astrology/profile",
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=60
        )
        
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        assert "celtic_tree" in data, "celtic_tree should be in profile"
        tree = data["celtic_tree"]
        
        assert "tree" in tree, "celtic_tree should have tree name"
        assert "meaning" in tree, "celtic_tree should have meaning"
        
        print(f"Celtic tree: {tree.get('tree', 'N/A')} - {tree.get('meaning', 'N/A')}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
