# Real-time Health Alert and Outbreak Detection System
# Monitors health data and sends automated alerts for disease outbreaks

import os
import json
import asyncio
import sqlite3
from typing import Dict, List, Optional, Tuple
from datetime import datetime, timedelta
from dataclasses import dataclass
from enum import Enum
import threading
import time
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AlertSeverity(Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class AlertType(Enum):
    OUTBREAK = "outbreak"
    VACCINATION = "vaccination"
    WEATHER_HEALTH = "weather_health"
    EMERGENCY = "emergency"
    PREVENTIVE = "preventive"

@dataclass
class HealthAlert:
    id: str
    alert_type: AlertType
    severity: AlertSeverity
    region: str
    disease: str
    message: str
    recommendations: List[str]
    created_at: datetime
    expires_at: datetime
    affected_population: int
    sources: List[str]

class OutbreakDetectionEngine:
    """
    AI-powered outbreak detection using pattern analysis
    """
    
    def __init__(self):
        self.thresholds = {
            "dengue": {"cases_per_week": 30, "growth_rate": 0.3},
            "malaria": {"cases_per_week": 25, "growth_rate": 0.25},
            "covid-19": {"cases_per_week": 50, "growth_rate": 0.4},
            "typhoid": {"cases_per_week": 20, "growth_rate": 0.2},
            "cholera": {"cases_per_week": 15, "growth_rate": 0.35}
        }
    
    def analyze_disease_patterns(self, disease: str, region: str, 
                               case_data: List[Dict]) -> Dict:
        """
        Analyze disease patterns to detect potential outbreaks
        """
        if not case_data or len(case_data) < 7:
            return {"outbreak_risk": "insufficient_data"}
        
        # Calculate weekly case count
        recent_cases = sum(day["cases"] for day in case_data[-7:])
        previous_cases = sum(day["cases"] for day in case_data[-14:-7]) if len(case_data) >= 14 else 0
        
        # Calculate growth rate
        growth_rate = 0
        if previous_cases > 0:
            growth_rate = (recent_cases - previous_cases) / previous_cases
        
        # Get thresholds for disease
        thresholds = self.thresholds.get(disease.lower(), {
            "cases_per_week": 20, "growth_rate": 0.25
        })
        
        # Determine outbreak risk
        risk_level = "low"
        risk_factors = []
        
        if recent_cases >= thresholds["cases_per_week"]:
            risk_factors.append("high_case_count")
            risk_level = "medium"
        
        if growth_rate >= thresholds["growth_rate"]:
            risk_factors.append("rapid_growth")
            if risk_level == "medium":
                risk_level = "high"
            elif risk_level == "low":
                risk_level = "medium"
        
        # Check for seasonal patterns
        current_month = datetime.now().month
        if self.is_disease_seasonal(disease, current_month):
            risk_factors.append("seasonal_peak")
        
        # Critical level if multiple factors present
        if len(risk_factors) >= 2 and recent_cases >= thresholds["cases_per_week"] * 1.5:
            risk_level = "critical"
        
        return {
            "outbreak_risk": risk_level,
            "recent_cases": recent_cases,
            "growth_rate": growth_rate,
            "risk_factors": risk_factors,
            "recommendations": self.get_outbreak_recommendations(disease, risk_level)
        }
    
    def is_disease_seasonal(self, disease: str, month: int) -> bool:
        """Check if disease is in seasonal peak"""
        seasonal_diseases = {
            "dengue": [6, 7, 8, 9, 10],  # Monsoon months
            "malaria": [7, 8, 9, 10, 11],  # Post-monsoon
            "typhoid": [4, 5, 6, 7, 8],   # Summer and monsoon
            "cholera": [6, 7, 8, 9],      # Monsoon
            "influenza": [11, 12, 1, 2]   # Winter months
        }
        
        return month in seasonal_diseases.get(disease.lower(), [])
    
    def get_outbreak_recommendations(self, disease: str, risk_level: str) -> List[str]:
        """Get recommendations based on disease and risk level"""
        
        base_recommendations = {
            "dengue": [
                "Eliminate stagnant water sources",
                "Use mosquito repellent and nets",
                "Seek medical attention for high fever",
                "Maintain clean surroundings"
            ],
            "malaria": [
                "Use insecticide-treated bed nets",
                "Apply mosquito repellent",
                "Seek immediate treatment for fever",
                "Keep surroundings clean and dry"
            ],
            "covid-19": [
                "Wear masks in crowded places",
                "Maintain social distancing",
                "Get vaccinated if eligible",
                "Practice hand hygiene"
            ],
            "typhoid": [
                "Drink only safe, boiled water",
                "Eat properly cooked food",
                "Maintain hand hygiene",
                "Avoid street food"
            ],
            "cholera": [
                "Drink only safe, treated water",
                "Eat hot, freshly cooked food",
                "Maintain strict hygiene",
                "Seek immediate medical help for diarrhea"
            ]
        }
        
        recommendations = base_recommendations.get(disease.lower(), [
            "Follow general hygiene practices",
            "Seek medical attention if symptoms occur",
            "Stay informed about health updates"
        ])
        
        # Add risk-level specific recommendations
        if risk_level in ["high", "critical"]:
            recommendations.extend([
                "Avoid crowded places if possible",
                "Report any symptoms immediately",
                "Follow local health authority guidelines"
            ])
        
        return recommendations

class AlertDatabase:
    """
    Database manager for health alerts and user subscriptions
    """
    
    def __init__(self, db_path: str = "health_alerts.db"):
        self.db_path = db_path
        self.init_database()
    
    def init_database(self):
        """Initialize database with required tables"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Alerts table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS alerts (
                id TEXT PRIMARY KEY,
                alert_type TEXT NOT NULL,
                severity TEXT NOT NULL,
                region TEXT NOT NULL,
                disease TEXT NOT NULL,
                message TEXT NOT NULL,
                recommendations TEXT NOT NULL,
                created_at TIMESTAMP NOT NULL,
                expires_at TIMESTAMP NOT NULL,
                affected_population INTEGER,
                sources TEXT,
                status TEXT DEFAULT 'active'
            )
        """)
        
        # User subscriptions table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS subscriptions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                phone_number TEXT NOT NULL,
                region TEXT NOT NULL,
                alert_types TEXT NOT NULL,
                language TEXT DEFAULT 'english',
                preferred_channel TEXT DEFAULT 'sms',
                subscribed_at TIMESTAMP NOT NULL,
                active BOOLEAN DEFAULT 1
            )
        """)
        
        # Alert delivery log
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS alert_deliveries (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                alert_id TEXT NOT NULL,
                phone_number TEXT NOT NULL,
                channel TEXT NOT NULL,
                delivery_status TEXT NOT NULL,
                delivered_at TIMESTAMP NOT NULL,
                FOREIGN KEY (alert_id) REFERENCES alerts (id)
            )
        """)
        
        conn.commit()
        conn.close()
    
    def save_alert(self, alert: HealthAlert) -> bool:
        """Save alert to database"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute("""
                INSERT INTO alerts (
                    id, alert_type, severity, region, disease, message,
                    recommendations, created_at, expires_at, affected_population, sources
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                alert.id,
                alert.alert_type.value,
                alert.severity.value,
                alert.region,
                alert.disease,
                alert.message,
                json.dumps(alert.recommendations),
                alert.created_at.isoformat(),
                alert.expires_at.isoformat(),
                alert.affected_population,
                json.dumps(alert.sources)
            ))
            
            conn.commit()
            conn.close()
            return True
            
        except sqlite3.Error as e:
            logger.error(f"Error saving alert: {e}")
            return False
    
    def get_active_alerts(self, region: str = None) -> List[HealthAlert]:
        """Get active alerts for a region"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            query = """
                SELECT * FROM alerts 
                WHERE status = 'active' AND expires_at > ?
            """
            params = [datetime.now().isoformat()]
            
            if region:
                query += " AND region = ?"
                params.append(region)
            
            cursor.execute(query, params)
            rows = cursor.fetchall()
            conn.close()
            
            alerts = []
            for row in rows:
                alert = HealthAlert(
                    id=row[0],
                    alert_type=AlertType(row[1]),
                    severity=AlertSeverity(row[2]),
                    region=row[3],
                    disease=row[4],
                    message=row[5],
                    recommendations=json.loads(row[6]),
                    created_at=datetime.fromisoformat(row[7]),
                    expires_at=datetime.fromisoformat(row[8]),
                    affected_population=row[9],
                    sources=json.loads(row[10]) if row[10] else []
                )
                alerts.append(alert)
            
            return alerts
            
        except sqlite3.Error as e:
            logger.error(f"Error retrieving alerts: {e}")
            return []
    
    def subscribe_user(self, phone_number: str, region: str, alert_types: List[str],
                      language: str = "english", channel: str = "sms") -> bool:
        """Subscribe user to health alerts"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Check if user already subscribed
            cursor.execute("""
                SELECT id FROM subscriptions 
                WHERE phone_number = ? AND region = ? AND active = 1
            """, (phone_number, region))
            
            if cursor.fetchone():
                # Update existing subscription
                cursor.execute("""
                    UPDATE subscriptions 
                    SET alert_types = ?, language = ?, preferred_channel = ?
                    WHERE phone_number = ? AND region = ?
                """, (json.dumps(alert_types), language, channel, phone_number, region))
            else:
                # Create new subscription
                cursor.execute("""
                    INSERT INTO subscriptions (
                        phone_number, region, alert_types, language, 
                        preferred_channel, subscribed_at
                    ) VALUES (?, ?, ?, ?, ?, ?)
                """, (
                    phone_number, region, json.dumps(alert_types),
                    language, channel, datetime.now().isoformat()
                ))
            
            conn.commit()
            conn.close()
            return True
            
        except sqlite3.Error as e:
            logger.error(f"Error subscribing user: {e}")
            return False
    
    def get_subscribers(self, region: str, alert_type: str) -> List[Dict]:
        """Get subscribers for a region and alert type"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT phone_number, language, preferred_channel, alert_types
                FROM subscriptions 
                WHERE region = ? AND active = 1
            """, (region,))
            
            rows = cursor.fetchall()
            conn.close()
            
            subscribers = []
            for row in rows:
                alert_types = json.loads(row[3])
                if alert_type in alert_types:
                    subscribers.append({
                        "phone_number": row[0],
                        "language": row[1],
                        "preferred_channel": row[2],
                        "alert_types": alert_types
                    })
            
            return subscribers
            
        except sqlite3.Error as e:
            logger.error(f"Error retrieving subscribers: {e}")
            return []

class RealTimeAlertSystem:
    """
    Main alert system that monitors data and sends notifications
    """
    
    def __init__(self):
        self.outbreak_engine = OutbreakDetectionEngine()
        self.database = AlertDatabase()
        self.monitoring_active = False
        self.monitoring_thread = None
    
    def start_monitoring(self):
        """Start real-time monitoring"""
        if self.monitoring_active:
            return
        
        self.monitoring_active = True
        self.monitoring_thread = threading.Thread(target=self._monitoring_loop)
        self.monitoring_thread.daemon = True
        self.monitoring_thread.start()
        logger.info("Real-time monitoring started")
    
    def stop_monitoring(self):
        """Stop real-time monitoring"""
        self.monitoring_active = False
        if self.monitoring_thread:
            self.monitoring_thread.join()
        logger.info("Real-time monitoring stopped")
    
    def _monitoring_loop(self):
        """Main monitoring loop"""
        while self.monitoring_active:
            try:
                # Check for disease outbreaks
                self._check_disease_outbreaks()
                
                # Check vaccination reminders
                self._check_vaccination_reminders()
                
                # Check weather-related health alerts
                self._check_weather_health_alerts()
                
                # Wait before next check (every 30 minutes)
                time.sleep(1800)
                
            except Exception as e:
                logger.error(f"Error in monitoring loop: {e}")
                time.sleep(300)  # Wait 5 minutes before retry
    
    def _check_disease_outbreaks(self):
        """Check for disease outbreaks and create alerts"""
        regions = ["Delhi", "Mumbai", "Bangalore", "Chennai", "Kolkata"]  # Add more regions
        diseases = ["dengue", "malaria", "covid-19", "typhoid", "cholera"]
        
        for region in regions:
            for disease in diseases:
                # Get disease data (mock data for demonstration)
                case_data = self._get_mock_disease_data(disease, region)
                
                # Analyze patterns
                analysis = self.outbreak_engine.analyze_disease_patterns(
                    disease, region, case_data
                )
                
                # Create alert if outbreak detected
                if analysis["outbreak_risk"] in ["high", "critical"]:
                    self._create_outbreak_alert(disease, region, analysis)
    
    def _get_mock_disease_data(self, disease: str, region: str) -> List[Dict]:
        """Get mock disease data (replace with actual data source)"""
        import random
        
        # Generate 14 days of mock data
        data = []
        base_cases = {"dengue": 15, "malaria": 10, "covid-19": 25}
        base = base_cases.get(disease, 8)
        
        for i in range(14):
            # Simulate increasing trend for demonstration
            trend_factor = 1 + (i * 0.1) if i > 7 else 1
            cases = int(base * trend_factor * random.uniform(0.7, 1.3))
            data.append({
                "date": (datetime.now() - timedelta(days=13-i)).strftime("%Y-%m-%d"),
                "cases": cases
            })
        
        return data
    
    def _create_outbreak_alert(self, disease: str, region: str, analysis: Dict):
        """Create and send outbreak alert"""
        severity_map = {
            "high": AlertSeverity.HIGH,
            "critical": AlertSeverity.CRITICAL
        }
        
        alert = HealthAlert(
            id=f"outbreak_{disease}_{region}_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            alert_type=AlertType.OUTBREAK,
            severity=severity_map[analysis["outbreak_risk"]],
            region=region,
            disease=disease.title(),
            message=f"{disease.title()} outbreak detected in {region}. "
                   f"{analysis['recent_cases']} cases reported in the last week. "
                   f"Please follow safety guidelines.",
            recommendations=analysis["recommendations"],
            created_at=datetime.now(),
            expires_at=datetime.now() + timedelta(days=7),
            affected_population=analysis["recent_cases"] * 100,  # Estimate
            sources=["Regional Health Department", "Disease Surveillance System"]
        )
        
        # Save alert
        if self.database.save_alert(alert):
            # Send notifications
            self._send_alert_notifications(alert)
            logger.info(f"Outbreak alert created for {disease} in {region}")
    
    def _send_alert_notifications(self, alert: HealthAlert):
        """Send alert notifications to subscribers"""
        subscribers = self.database.get_subscribers(alert.region, alert.alert_type.value)
        
        for subscriber in subscribers:
            try:
                # Format message based on language
                message = self._format_alert_message(alert, subscriber["language"])
                
                # Send via preferred channel (implement actual sending)
                # messaging_hub.send_message(
                #     subscriber["phone_number"], 
                #     message, 
                #     subscriber["preferred_channel"]
                # )
                
                logger.info(f"Alert sent to {subscriber['phone_number']} via {subscriber['preferred_channel']}")
                
            except Exception as e:
                logger.error(f"Failed to send alert to {subscriber['phone_number']}: {e}")
    
    def _format_alert_message(self, alert: HealthAlert, language: str) -> str:
        """Format alert message based on language"""
        # Simple English formatting (add translation logic for other languages)
        severity_emoji = {
            AlertSeverity.LOW: "🟡",
            AlertSeverity.MEDIUM: "🟠", 
            AlertSeverity.HIGH: "🔴",
            AlertSeverity.CRITICAL: "🚨"
        }
        
        message = f"{severity_emoji[alert.severity]} HEALTH ALERT\n\n"
        message += f"Region: {alert.region}\n"
        message += f"Disease: {alert.disease}\n"
        message += f"Severity: {alert.severity.value.upper()}\n\n"
        message += f"{alert.message}\n\n"
        message += "Recommendations:\n"
        
        for i, rec in enumerate(alert.recommendations[:3], 1):  # Limit for SMS
            message += f"{i}. {rec}\n"
        
        message += "\nStay safe and follow health guidelines."
        
        return message
    
    def _check_vaccination_reminders(self):
        """Check and send vaccination reminders"""
        # TODO: Implement vaccination reminder logic
        pass
    
    def _check_weather_health_alerts(self):
        """Check weather-related health alerts"""
        # TODO: Implement weather health alert logic
        pass
    
    def create_manual_alert(self, alert_type: str, severity: str, region: str,
                          disease: str, message: str, recommendations: List[str]) -> str:
        """Create manual alert (for admin use)"""
        alert = HealthAlert(
            id=f"manual_{alert_type}_{region}_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            alert_type=AlertType(alert_type),
            severity=AlertSeverity(severity),
            region=region,
            disease=disease,
            message=message,
            recommendations=recommendations,
            created_at=datetime.now(),
            expires_at=datetime.now() + timedelta(days=3),
            affected_population=0,
            sources=["Manual Entry"]
        )
        
        if self.database.save_alert(alert):
            self._send_alert_notifications(alert)
            return alert.id
        
        return None

# Initialize alert system
alert_system = RealTimeAlertSystem()

def start_alert_monitoring():
    """Start the alert monitoring system"""
    alert_system.start_monitoring()

def stop_alert_monitoring():
    """Stop the alert monitoring system"""
    alert_system.stop_monitoring()

def create_emergency_alert(region: str, disease: str, message: str, 
                         recommendations: List[str]) -> str:
    """Create emergency health alert"""
    return alert_system.create_manual_alert(
        "outbreak", "critical", region, disease, message, recommendations
    )