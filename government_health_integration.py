# Government Health Database Integration Configuration
# For connecting to various Indian government health APIs and databases

import os
import requests
from typing import Dict, List, Optional
from datetime import datetime, timedelta

class GovernmentHealthAPI:
    """
    Integration class for Indian government health databases and APIs
    """
    
    def __init__(self):
        self.cowin_base_url = "https://cdn-api.co-vin.in/api"
        self.ayush_base_url = "https://ayush.gov.in/api"  # Placeholder
        self.nrhm_base_url = "https://nrhm.gov.in/api"   # Placeholder
        
    def get_vaccination_centers(self, pincode: str, date: str = None) -> Dict:
        """
        Get vaccination centers by pincode using Co-WIN API
        """
        try:
            if not date:
                date = datetime.now().strftime("%d-%m-%Y")
            
            url = f"{self.cowin_base_url}/v2/appointment/sessions/public/findByPin"
            params = {
                "pincode": pincode,
                "date": date
            }
            
            response = requests.get(url, params=params)
            response.raise_for_status()
            
            return {
                "success": True,
                "data": response.json(),
                "source": "Co-WIN API"
            }
            
        except requests.exceptions.RequestException as e:
            return {
                "success": False,
                "error": f"API Error: {str(e)}",
                "data": []
            }
    
    def get_vaccination_schedule(self, age: int, region: str = "india") -> Dict:
        """
        Get vaccination schedule based on age and region
        """
        # Standard Indian immunization schedule
        vaccination_schedule = {
            "infant": {
                "birth": ["BCG", "OPV-0", "Hepatitis B-1"],
                "6_weeks": ["DPT-1", "OPV-1", "Hepatitis B-2", "Hib-1", "Rotavirus-1", "PCV-1"],
                "10_weeks": ["DPT-2", "OPV-2", "Hib-2", "Rotavirus-2", "PCV-2"],
                "14_weeks": ["DPT-3", "OPV-3", "Hepatitis B-3", "Hib-3", "Rotavirus-3", "PCV-3"],
                "9_months": ["Measles-1", "Vitamin A-1"],
                "16_18_months": ["DPT Booster-1", "OPV Booster", "Measles-2", "JE-1"],
                "5_6_years": ["DPT Booster-2", "JE-2"]
            },
            "adult": {
                "pregnancy": ["TT-1", "TT-2"],
                "elderly": ["Influenza (annual)", "Pneumococcal"],
                "high_risk": ["COVID-19", "Hepatitis B"]
            }
        }
        
        if age < 1:
            return {
                "success": True,
                "data": vaccination_schedule["infant"],
                "age_group": "infant",
                "region": region
            }
        elif age >= 18:
            return {
                "success": True,
                "data": vaccination_schedule["adult"],
                "age_group": "adult",
                "region": region
            }
        else:
            return {
                "success": True,
                "data": {
                    "school_age": ["DPT Booster", "MMR", "Typhoid", "Hepatitis A"]
                },
                "age_group": "child",
                "region": region
            }
    
    def get_disease_surveillance_data(self, region: str, disease: str = None) -> Dict:
        """
        Get disease surveillance data for outbreak detection
        """
        # Mock data for demonstration - replace with actual API calls
        surveillance_data = {
            "region": region,
            "last_updated": datetime.now().isoformat(),
            "diseases": [
                {
                    "name": "Dengue",
                    "cases": 45,
                    "trend": "increasing",
                    "severity": "medium",
                    "last_7_days": [5, 7, 8, 6, 9, 10, 12]
                },
                {
                    "name": "Malaria",
                    "cases": 23,
                    "trend": "stable",
                    "severity": "low",
                    "last_7_days": [3, 4, 3, 3, 4, 3, 3]
                },
                {
                    "name": "COVID-19",
                    "cases": 12,
                    "trend": "decreasing",
                    "severity": "low",
                    "last_7_days": [8, 6, 4, 3, 2, 1, 2]
                }
            ]
        }
        
        if disease:
            filtered_data = [d for d in surveillance_data["diseases"] 
                           if d["name"].lower() == disease.lower()]
            surveillance_data["diseases"] = filtered_data
        
        return {
            "success": True,
            "data": surveillance_data,
            "source": "NCDC Disease Surveillance"
        }
    
    def get_health_schemes(self, state: str = None) -> Dict:
        """
        Get information about government health schemes
        """
        health_schemes = {
            "national": [
                {
                    "name": "Ayushman Bharat",
                    "description": "Health insurance scheme covering up to ₹5 lakh per family per year",
                    "eligibility": "BPL families and identified vulnerable groups",
                    "benefits": ["Free treatment in empaneled hospitals", "Cashless treatment", "Pre and post hospitalization coverage"]
                },
                {
                    "name": "Janani Suraksha Yojana",
                    "description": "Safe motherhood intervention under NHM",
                    "eligibility": "Pregnant women from BPL families",
                    "benefits": ["Cash assistance for institutional delivery", "Free transport", "Free medical care"]
                },
                {
                    "name": "Mission Indradhanush",
                    "description": "Immunization program for children and pregnant women",
                    "eligibility": "Children under 2 years and pregnant women",
                    "benefits": ["Free vaccination", "Door-to-door service", "Complete immunization coverage"]
                }
            ]
        }
        
        return {
            "success": True,
            "data": health_schemes,
            "state": state or "All States"
        }
    
    def check_outbreak_alerts(self, region: str) -> Dict:
        """
        Check for active disease outbreak alerts in a region
        """
        # Mock data - replace with actual outbreak detection system
        alerts = []
        
        # Simulate outbreak detection logic
        surveillance = self.get_disease_surveillance_data(region)
        if surveillance["success"]:
            for disease in surveillance["data"]["diseases"]:
                if disease["trend"] == "increasing" and disease["cases"] > 40:
                    alerts.append({
                        "disease": disease["name"],
                        "severity": disease["severity"],
                        "cases": disease["cases"],
                        "message": f"{disease['name']} cases increasing in {region}. Take preventive measures.",
                        "recommendations": [
                            "Use mosquito repellent",
                            "Eliminate stagnant water",
                            "Seek medical attention for fever",
                            "Follow hygiene protocols"
                        ],
                        "timestamp": datetime.now().isoformat()
                    })
        
        return {
            "success": True,
            "region": region,
            "alerts": alerts,
            "alert_count": len(alerts)
        }

# Health data cache for better performance
class HealthDataCache:
    """
    Cache system for government health data to reduce API calls
    """
    
    def __init__(self):
        self.cache = {}
        self.cache_duration = timedelta(hours=6)  # Cache for 6 hours
    
    def get(self, key: str) -> Optional[Dict]:
        """Get cached data if not expired"""
        if key in self.cache:
            data, timestamp = self.cache[key]
            if datetime.now() - timestamp < self.cache_duration:
                return data
            else:
                del self.cache[key]
        return None
    
    def set(self, key: str, data: Dict) -> None:
        """Cache data with timestamp"""
        self.cache[key] = (data, datetime.now())

# Initialize instances
health_api = GovernmentHealthAPI()
health_cache = HealthDataCache()

def get_cached_vaccination_data(pincode: str, date: str = None) -> Dict:
    """Get vaccination data with caching"""
    cache_key = f"vaccination_{pincode}_{date or 'today'}"
    cached_data = health_cache.get(cache_key)
    
    if cached_data:
        return cached_data
    
    fresh_data = health_api.get_vaccination_centers(pincode, date)
    if fresh_data["success"]:
        health_cache.set(cache_key, fresh_data)
    
    return fresh_data

def get_cached_outbreak_data(region: str) -> Dict:
    """Get outbreak data with caching"""
    cache_key = f"outbreak_{region}"
    cached_data = health_cache.get(cache_key)
    
    if cached_data:
        return cached_data
    
    fresh_data = health_api.check_outbreak_alerts(region)
    if fresh_data["success"]:
        health_cache.set(cache_key, fresh_data)
    
    return fresh_data