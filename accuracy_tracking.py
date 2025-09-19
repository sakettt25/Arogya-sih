# Chatbot Accuracy Tracking and Analytics System
# Monitors response quality and measures the 80% accuracy target

import sqlite3
import json
import uuid
from typing import Dict, List, Optional, Tuple
from datetime import datetime, timedelta
from dataclasses import dataclass, asdict
from enum import Enum
import statistics
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class FeedbackType(Enum):
    THUMBS_UP = "thumbs_up"
    THUMBS_DOWN = "thumbs_down"
    HELPFUL = "helpful"
    NOT_HELPFUL = "not_helpful"
    ACCURATE = "accurate"
    INACCURATE = "inaccurate"

class QueryCategory(Enum):
    SYMPTOMS = "symptoms"
    VACCINATION = "vaccination"
    PREVENTION = "prevention"
    EMERGENCY = "emergency"
    MEDICATION = "medication"
    GENERAL_HEALTH = "general_health"
    NUTRITION = "nutrition"
    DISEASE_INFO = "disease_info"
    OTHER = "other"

@dataclass
class ChatbotInteraction:
    id: str
    user_id: str
    user_query: str
    bot_response: str
    language: str
    channel: str  # web, whatsapp, sms
    query_category: QueryCategory
    timestamp: datetime
    response_time_ms: int
    user_feedback: Optional[FeedbackType] = None
    expert_rating: Optional[int] = None  # 1-5 scale
    follow_up_questions: int = 0
    user_satisfaction: Optional[int] = None  # 1-5 scale

@dataclass
class AccuracyMetrics:
    overall_accuracy: float
    user_feedback_accuracy: float
    expert_review_accuracy: float
    language_accuracies: Dict[str, float]
    category_accuracies: Dict[str, float]
    channel_accuracies: Dict[str, float]
    total_interactions: int
    feedback_count: int
    expert_reviews: int

class AccuracyTracker:
    """
    Tracks chatbot accuracy and performance metrics
    """
    
    def __init__(self, db_path: str = "chatbot_analytics.db"):
        self.db_path = db_path
        self.init_database()
    
    def init_database(self):
        """Initialize database with tracking tables"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Interactions table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS interactions (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                user_query TEXT NOT NULL,
                bot_response TEXT NOT NULL,
                language TEXT NOT NULL,
                channel TEXT NOT NULL,
                query_category TEXT NOT NULL,
                timestamp TIMESTAMP NOT NULL,
                response_time_ms INTEGER NOT NULL,
                user_feedback TEXT,
                expert_rating INTEGER,
                follow_up_questions INTEGER DEFAULT 0,
                user_satisfaction INTEGER
            )
        """)
        
        # Daily metrics table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS daily_metrics (
                date DATE PRIMARY KEY,
                total_interactions INTEGER,
                accuracy_rate REAL,
                avg_response_time REAL,
                user_satisfaction_avg REAL,
                top_categories TEXT,
                languages_used TEXT
            )
        """)
        
        # Expert reviews table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS expert_reviews (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                interaction_id TEXT NOT NULL,
                expert_id TEXT NOT NULL,
                accuracy_rating INTEGER NOT NULL,
                completeness_rating INTEGER NOT NULL,
                safety_rating INTEGER NOT NULL,
                review_notes TEXT,
                reviewed_at TIMESTAMP NOT NULL,
                FOREIGN KEY (interaction_id) REFERENCES interactions (id)
            )
        """)
        
        # User sessions table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS user_sessions (
                session_id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                start_time TIMESTAMP NOT NULL,
                end_time TIMESTAMP,
                total_queries INTEGER DEFAULT 0,
                resolved_queries INTEGER DEFAULT 0,
                satisfaction_rating INTEGER,
                language TEXT,
                channel TEXT
            )
        """)
        
        conn.commit()
        conn.close()
    
    def log_interaction(self, interaction: ChatbotInteraction) -> bool:
        """Log a chatbot interaction"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute("""
                INSERT INTO interactions (
                    id, user_id, user_query, bot_response, language, channel,
                    query_category, timestamp, response_time_ms, user_feedback,
                    expert_rating, follow_up_questions, user_satisfaction
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                interaction.id,
                interaction.user_id,
                interaction.user_query,
                interaction.bot_response,
                interaction.language,
                interaction.channel,
                interaction.query_category.value,
                interaction.timestamp.isoformat(),
                interaction.response_time_ms,
                interaction.user_feedback.value if interaction.user_feedback else None,
                interaction.expert_rating,
                interaction.follow_up_questions,
                interaction.user_satisfaction
            ))
            
            conn.commit()
            conn.close()
            return True
            
        except sqlite3.Error as e:
            logger.error(f"Error logging interaction: {e}")
            return False
    
    def update_user_feedback(self, interaction_id: str, feedback: FeedbackType, 
                           satisfaction: Optional[int] = None) -> bool:
        """Update user feedback for an interaction"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute("""
                UPDATE interactions 
                SET user_feedback = ?, user_satisfaction = ?
                WHERE id = ?
            """, (feedback.value, satisfaction, interaction_id))
            
            conn.commit()
            conn.close()
            return True
            
        except sqlite3.Error as e:
            logger.error(f"Error updating feedback: {e}")
            return False
    
    def add_expert_review(self, interaction_id: str, expert_id: str,
                         accuracy_rating: int, completeness_rating: int,
                         safety_rating: int, notes: str = "") -> bool:
        """Add expert review for an interaction"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Add expert review
            cursor.execute("""
                INSERT INTO expert_reviews (
                    interaction_id, expert_id, accuracy_rating,
                    completeness_rating, safety_rating, review_notes, reviewed_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                interaction_id, expert_id, accuracy_rating,
                completeness_rating, safety_rating, notes,
                datetime.now().isoformat()
            ))
            
            # Update interaction with expert rating (average of all ratings)
            overall_rating = int((accuracy_rating + completeness_rating + safety_rating) / 3)
            cursor.execute("""
                UPDATE interactions 
                SET expert_rating = ?
                WHERE id = ?
            """, (overall_rating, interaction_id))
            
            conn.commit()
            conn.close()
            return True
            
        except sqlite3.Error as e:
            logger.error(f"Error adding expert review: {e}")
            return False
    
    def calculate_accuracy_metrics(self, days_back: int = 30) -> AccuracyMetrics:
        """Calculate accuracy metrics for the specified period"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Date range
            end_date = datetime.now()
            start_date = end_date - timedelta(days=days_back)
            
            # Get all interactions in the period
            cursor.execute("""
                SELECT * FROM interactions 
                WHERE timestamp >= ? AND timestamp <= ?
            """, (start_date.isoformat(), end_date.isoformat()))
            
            interactions = cursor.fetchall()
            total_interactions = len(interactions)
            
            if total_interactions == 0:
                return AccuracyMetrics(
                    overall_accuracy=0.0, user_feedback_accuracy=0.0,
                    expert_review_accuracy=0.0, language_accuracies={},
                    category_accuracies={}, channel_accuracies={},
                    total_interactions=0, feedback_count=0, expert_reviews=0
                )
            
            # Calculate user feedback accuracy
            positive_feedback = sum(1 for row in interactions 
                                  if row[9] in ['thumbs_up', 'helpful', 'accurate'])
            total_feedback = sum(1 for row in interactions if row[9] is not None)
            user_feedback_accuracy = positive_feedback / total_feedback if total_feedback > 0 else 0.0
            
            # Calculate expert review accuracy
            expert_ratings = [row[10] for row in interactions if row[10] is not None]
            expert_reviews_count = len(expert_ratings)
            expert_review_accuracy = sum(1 for rating in expert_ratings if rating >= 4) / expert_reviews_count if expert_reviews_count > 0 else 0.0
            
            # Calculate language-wise accuracy
            language_accuracies = {}
            languages = set(row[4] for row in interactions)
            for lang in languages:
                lang_interactions = [row for row in interactions if row[4] == lang]
                lang_positive = sum(1 for row in lang_interactions 
                                  if row[9] in ['thumbs_up', 'helpful', 'accurate'])
                lang_feedback = sum(1 for row in lang_interactions if row[9] is not None)
                language_accuracies[lang] = lang_positive / lang_feedback if lang_feedback > 0 else 0.0
            
            # Calculate category-wise accuracy
            category_accuracies = {}
            categories = set(row[6] for row in interactions)
            for category in categories:
                cat_interactions = [row for row in interactions if row[6] == category]
                cat_positive = sum(1 for row in cat_interactions 
                                 if row[9] in ['thumbs_up', 'helpful', 'accurate'])
                cat_feedback = sum(1 for row in cat_interactions if row[9] is not None)
                category_accuracies[category] = cat_positive / cat_feedback if cat_feedback > 0 else 0.0
            
            # Calculate channel-wise accuracy
            channel_accuracies = {}
            channels = set(row[5] for row in interactions)
            for channel in channels:
                ch_interactions = [row for row in interactions if row[5] == channel]
                ch_positive = sum(1 for row in ch_interactions 
                                if row[9] in ['thumbs_up', 'helpful', 'accurate'])
                ch_feedback = sum(1 for row in ch_interactions if row[9] is not None)
                channel_accuracies[channel] = ch_positive / ch_feedback if ch_feedback > 0 else 0.0
            
            # Overall accuracy (weighted average of user feedback and expert reviews)
            overall_accuracy = 0.0
            if total_feedback > 0 and expert_reviews_count > 0:
                overall_accuracy = (user_feedback_accuracy * 0.6 + expert_review_accuracy * 0.4)
            elif total_feedback > 0:
                overall_accuracy = user_feedback_accuracy
            elif expert_reviews_count > 0:
                overall_accuracy = expert_review_accuracy
            
            conn.close()
            
            return AccuracyMetrics(
                overall_accuracy=overall_accuracy,
                user_feedback_accuracy=user_feedback_accuracy,
                expert_review_accuracy=expert_review_accuracy,
                language_accuracies=language_accuracies,
                category_accuracies=category_accuracies,
                channel_accuracies=channel_accuracies,
                total_interactions=total_interactions,
                feedback_count=total_feedback,
                expert_reviews=expert_reviews_count
            )
            
        except sqlite3.Error as e:
            logger.error(f"Error calculating accuracy metrics: {e}")
            return AccuracyMetrics(
                overall_accuracy=0.0, user_feedback_accuracy=0.0,
                expert_review_accuracy=0.0, language_accuracies={},
                category_accuracies={}, channel_accuracies={},
                total_interactions=0, feedback_count=0, expert_reviews=0
            )
    
    def get_performance_trends(self, days_back: int = 30) -> Dict:
        """Get performance trends over time"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            end_date = datetime.now()
            start_date = end_date - timedelta(days=days_back)
            
            # Daily interaction counts
            cursor.execute("""
                SELECT DATE(timestamp) as day, COUNT(*) as count
                FROM interactions 
                WHERE timestamp >= ? AND timestamp <= ?
                GROUP BY DATE(timestamp)
                ORDER BY day
            """, (start_date.isoformat(), end_date.isoformat()))
            
            daily_counts = {row[0]: row[1] for row in cursor.fetchall()}
            
            # Daily accuracy rates
            cursor.execute("""
                SELECT DATE(timestamp) as day, 
                       AVG(CASE WHEN user_feedback IN ('thumbs_up', 'helpful', 'accurate') THEN 1.0 ELSE 0.0 END) as accuracy
                FROM interactions 
                WHERE timestamp >= ? AND timestamp <= ? AND user_feedback IS NOT NULL
                GROUP BY DATE(timestamp)
                ORDER BY day
            """, (start_date.isoformat(), end_date.isoformat()))
            
            daily_accuracy = {row[0]: row[1] for row in cursor.fetchall()}
            
            # Response time trends
            cursor.execute("""
                SELECT DATE(timestamp) as day, AVG(response_time_ms) as avg_time
                FROM interactions 
                WHERE timestamp >= ? AND timestamp <= ?
                GROUP BY DATE(timestamp)
                ORDER BY day
            """, (start_date.isoformat(), end_date.isoformat()))
            
            daily_response_times = {row[0]: row[1] for row in cursor.fetchall()}
            
            conn.close()
            
            return {
                "daily_interactions": daily_counts,
                "daily_accuracy": daily_accuracy,
                "daily_response_times": daily_response_times
            }
            
        except sqlite3.Error as e:
            logger.error(f"Error getting performance trends: {e}")
            return {}
    
    def get_top_queries_and_issues(self, limit: int = 10) -> Dict:
        """Get top queries and common issues"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Top queries by category
            cursor.execute("""
                SELECT query_category, COUNT(*) as count
                FROM interactions 
                WHERE timestamp >= date('now', '-30 days')
                GROUP BY query_category
                ORDER BY count DESC
                LIMIT ?
            """, (limit,))
            
            top_categories = [{"category": row[0], "count": row[1]} for row in cursor.fetchall()]
            
            # Queries with negative feedback
            cursor.execute("""
                SELECT user_query, bot_response, user_feedback, language
                FROM interactions 
                WHERE user_feedback IN ('thumbs_down', 'not_helpful', 'inaccurate')
                  AND timestamp >= date('now', '-7 days')
                ORDER BY timestamp DESC
                LIMIT ?
            """, (limit,))
            
            problem_queries = [{
                "query": row[0],
                "response": row[1],
                "feedback": row[2],
                "language": row[3]
            } for row in cursor.fetchall()]
            
            # Common follow-up patterns
            cursor.execute("""
                SELECT user_query, COUNT(*) as frequency
                FROM interactions 
                WHERE follow_up_questions > 0 
                  AND timestamp >= date('now', '-30 days')
                GROUP BY user_query
                ORDER BY frequency DESC
                LIMIT ?
            """, (limit,))
            
            followup_patterns = [{"query": row[0], "frequency": row[1]} for row in cursor.fetchall()]
            
            conn.close()
            
            return {
                "top_categories": top_categories,
                "problem_queries": problem_queries,
                "followup_patterns": followup_patterns
            }
            
        except sqlite3.Error as e:
            logger.error(f"Error getting top queries: {e}")
            return {}
    
    def update_daily_metrics(self):
        """Update daily metrics summary"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            today = datetime.now().date()
            
            # Calculate today's metrics
            cursor.execute("""
                SELECT COUNT(*) as total,
                       AVG(CASE WHEN user_feedback IN ('thumbs_up', 'helpful', 'accurate') THEN 1.0 ELSE 0.0 END) as accuracy,
                       AVG(response_time_ms) as avg_time,
                       AVG(user_satisfaction) as satisfaction
                FROM interactions 
                WHERE DATE(timestamp) = ?
            """, (today.isoformat(),))
            
            metrics = cursor.fetchone()
            
            if metrics[0] > 0:  # If there are interactions today
                cursor.execute("""
                    INSERT OR REPLACE INTO daily_metrics (
                        date, total_interactions, accuracy_rate, 
                        avg_response_time, user_satisfaction_avg
                    ) VALUES (?, ?, ?, ?, ?)
                """, (today.isoformat(), metrics[0], metrics[1] or 0.0, 
                     metrics[2] or 0.0, metrics[3] or 0.0))
                
                conn.commit()
            
            conn.close()
            
        except sqlite3.Error as e:
            logger.error(f"Error updating daily metrics: {e}")

# Helper functions for categorizing queries
def categorize_query(query: str) -> QueryCategory:
    """Automatically categorize user query"""
    query_lower = query.lower()
    
    symptom_keywords = ['symptom', 'fever', 'pain', 'cough', 'headache', 'nausea', 'vomiting']
    vaccination_keywords = ['vaccine', 'vaccination', 'immunization', 'shot', 'dose']
    prevention_keywords = ['prevent', 'avoid', 'protection', 'precaution', 'safety']
    emergency_keywords = ['emergency', 'urgent', 'serious', 'immediate', 'help']
    medication_keywords = ['medicine', 'drug', 'tablet', 'dosage', 'prescription']
    nutrition_keywords = ['diet', 'food', 'nutrition', 'eat', 'vitamin', 'mineral']
    
    if any(keyword in query_lower for keyword in symptom_keywords):
        return QueryCategory.SYMPTOMS
    elif any(keyword in query_lower for keyword in vaccination_keywords):
        return QueryCategory.VACCINATION
    elif any(keyword in query_lower for keyword in prevention_keywords):
        return QueryCategory.PREVENTION
    elif any(keyword in query_lower for keyword in emergency_keywords):
        return QueryCategory.EMERGENCY
    elif any(keyword in query_lower for keyword in medication_keywords):
        return QueryCategory.MEDICATION
    elif any(keyword in query_lower for keyword in nutrition_keywords):
        return QueryCategory.NUTRITION
    else:
        return QueryCategory.GENERAL_HEALTH

# Initialize tracker
accuracy_tracker = AccuracyTracker()

def log_chatbot_interaction(user_id: str, user_query: str, bot_response: str,
                          language: str, channel: str, response_time_ms: int) -> str:
    """Log a new chatbot interaction and return interaction ID"""
    
    interaction_id = str(uuid.uuid4())
    category = categorize_query(user_query)
    
    interaction = ChatbotInteraction(
        id=interaction_id,
        user_id=user_id,
        user_query=user_query,
        bot_response=bot_response,
        language=language,
        channel=channel,
        query_category=category,
        timestamp=datetime.now(),
        response_time_ms=response_time_ms
    )
    
    accuracy_tracker.log_interaction(interaction)
    return interaction_id

def record_user_feedback(interaction_id: str, feedback_type: str, satisfaction: int = None):
    """Record user feedback for an interaction"""
    feedback = FeedbackType(feedback_type)
    accuracy_tracker.update_user_feedback(interaction_id, feedback, satisfaction)

def get_current_accuracy() -> float:
    """Get current overall accuracy rate"""
    metrics = accuracy_tracker.calculate_accuracy_metrics(days_back=30)
    return metrics.overall_accuracy

def check_accuracy_threshold() -> Dict:
    """Check if accuracy meets the 80% target"""
    metrics = accuracy_tracker.calculate_accuracy_metrics(days_back=30)
    
    return {
        "meets_target": metrics.overall_accuracy >= 0.8,
        "current_accuracy": metrics.overall_accuracy,
        "target": 0.8,
        "feedback_count": metrics.feedback_count,
        "total_interactions": metrics.total_interactions
    }