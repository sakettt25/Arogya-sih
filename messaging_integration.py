# WhatsApp Business API and SMS Gateway Integration
# For chatbot communication via WhatsApp and SMS

import os
import json
import requests
from typing import Dict, List, Optional
from datetime import datetime
from twilio.rest import Client
from twilio.base.exceptions import TwilioException

class WhatsAppHandler:
    """
    WhatsApp Business API integration for chatbot communication
    """
    
    def __init__(self):
        self.access_token = os.getenv("WHATSAPP_ACCESS_TOKEN")
        self.phone_number_id = os.getenv("WHATSAPP_PHONE_NUMBER_ID")
        self.verify_token = os.getenv("WHATSAPP_VERIFY_TOKEN")
        self.base_url = f"https://graph.facebook.com/v17.0/{self.phone_number_id}/messages"
        
    def verify_webhook(self, verify_token: str, challenge: str) -> Optional[str]:
        """Verify WhatsApp webhook"""
        if verify_token == self.verify_token:
            return challenge
        return None
    
    def send_text_message(self, to_number: str, message: str) -> Dict:
        """Send text message via WhatsApp"""
        try:
            headers = {
                "Authorization": f"Bearer {self.access_token}",
                "Content-Type": "application/json"
            }
            
            payload = {
                "messaging_product": "whatsapp",
                "to": to_number,
                "type": "text",
                "text": {
                    "body": message
                }
            }
            
            response = requests.post(self.base_url, headers=headers, json=payload)
            response.raise_for_status()
            
            return {
                "success": True,
                "message_id": response.json().get("messages", [{}])[0].get("id"),
                "status": "sent"
            }
            
        except requests.exceptions.RequestException as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    def send_interactive_message(self, to_number: str, header: str, body: str, 
                                buttons: List[Dict]) -> Dict:
        """Send interactive message with buttons"""
        try:
            headers = {
                "Authorization": f"Bearer {self.access_token}",
                "Content-Type": "application/json"
            }
            
            interactive_buttons = []
            for i, button in enumerate(buttons[:3]):  # WhatsApp allows max 3 buttons
                interactive_buttons.append({
                    "type": "reply",
                    "reply": {
                        "id": f"btn_{i}",
                        "title": button["title"][:20]  # Max 20 chars
                    }
                })
            
            payload = {
                "messaging_product": "whatsapp",
                "to": to_number,
                "type": "interactive",
                "interactive": {
                    "type": "button",
                    "header": {
                        "type": "text",
                        "text": header
                    },
                    "body": {
                        "text": body
                    },
                    "action": {
                        "buttons": interactive_buttons
                    }
                }
            }
            
            response = requests.post(self.base_url, headers=headers, json=payload)
            response.raise_for_status()
            
            return {
                "success": True,
                "message_id": response.json().get("messages", [{}])[0].get("id"),
                "status": "sent"
            }
            
        except requests.exceptions.RequestException as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    def process_incoming_message(self, webhook_data: Dict) -> Optional[Dict]:
        """Process incoming WhatsApp message"""
        try:
            entry = webhook_data.get("entry", [])
            if not entry:
                return None
            
            changes = entry[0].get("changes", [])
            if not changes:
                return None
            
            value = changes[0].get("value", {})
            messages = value.get("messages", [])
            
            if not messages:
                return None
            
            message = messages[0]
            
            return {
                "message_id": message.get("id"),
                "from_number": message.get("from"),
                "timestamp": message.get("timestamp"),
                "type": message.get("type"),
                "text": message.get("text", {}).get("body", ""),
                "interactive": message.get("interactive", {}),
                "contact": value.get("contacts", [{}])[0]
            }
            
        except (KeyError, IndexError) as e:
            return None

class SMSHandler:
    """
    Twilio SMS integration for chatbot communication
    """
    
    def __init__(self):
        self.account_sid = os.getenv("TWILIO_ACCOUNT_SID")
        self.auth_token = os.getenv("TWILIO_AUTH_TOKEN")
        self.from_number = os.getenv("TWILIO_PHONE_NUMBER")
        self.client = Client(self.account_sid, self.auth_token)
    
    def send_sms(self, to_number: str, message: str) -> Dict:
        """Send SMS message"""
        try:
            # Split long messages into parts (160 char limit)
            message_parts = self.split_message(message, 160)
            message_ids = []
            
            for part in message_parts:
                sms = self.client.messages.create(
                    body=part,
                    from_=self.from_number,
                    to=to_number
                )
                message_ids.append(sms.sid)
            
            return {
                "success": True,
                "message_ids": message_ids,
                "parts_sent": len(message_parts),
                "status": "sent"
            }
            
        except TwilioException as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    def split_message(self, message: str, max_length: int = 160) -> List[str]:
        """Split long message into SMS-sized chunks"""
        if len(message) <= max_length:
            return [message]
        
        parts = []
        words = message.split()
        current_part = ""
        
        for word in words:
            if len(current_part + " " + word) <= max_length:
                current_part += " " + word if current_part else word
            else:
                if current_part:
                    parts.append(current_part)
                current_part = word
        
        if current_part:
            parts.append(current_part)
        
        # Add part numbers for multi-part messages
        if len(parts) > 1:
            numbered_parts = []
            for i, part in enumerate(parts, 1):
                numbered_parts.append(f"({i}/{len(parts)}) {part}")
            return numbered_parts
        
        return parts
    
    def process_incoming_sms(self, from_number: str, body: str, message_sid: str) -> Dict:
        """Process incoming SMS message"""
        return {
            "message_id": message_sid,
            "from_number": from_number,
            "message": body,
            "timestamp": datetime.now().isoformat(),
            "channel": "sms"
        }

class ChatbotCommunicationHub:
    """
    Central hub for managing chatbot communication across channels
    """
    
    def __init__(self):
        self.whatsapp = WhatsAppHandler()
        self.sms = SMSHandler()
        self.user_preferences = {}  # Store user communication preferences
    
    def send_message(self, user_id: str, message: str, channel: str = "auto", 
                    interactive_options: List[Dict] = None) -> Dict:
        """Send message via preferred channel"""
        
        # Determine channel if auto
        if channel == "auto":
            channel = self.get_user_preferred_channel(user_id)
        
        if channel == "whatsapp":
            if interactive_options:
                return self.whatsapp.send_interactive_message(
                    user_id, "GramAarogya Health Assistant", message, interactive_options
                )
            else:
                return self.whatsapp.send_text_message(user_id, message)
        
        elif channel == "sms":
            return self.sms.send_sms(user_id, message)
        
        else:
            return {
                "success": False,
                "error": f"Unsupported channel: {channel}"
            }
    
    def broadcast_health_alert(self, region: str, message: str, 
                              alert_type: str = "outbreak") -> Dict:
        """Broadcast health alert to all subscribed users in a region"""
        
        # TODO: Get subscribed users from database
        subscribed_users = self.get_subscribed_users(region, alert_type)
        
        results = {
            "total_users": len(subscribed_users),
            "successful_sends": 0,
            "failed_sends": 0,
            "details": []
        }
        
        for user in subscribed_users:
            user_id = user["phone_number"]
            preferred_channel = user.get("preferred_channel", "sms")
            
            # Format alert message
            alert_message = f"🚨 HEALTH ALERT - {region.upper()}\n\n{message}\n\n" + \
                          f"Stay safe and follow health guidelines.\n" + \
                          f"Reply STOP to unsubscribe from alerts."
            
            send_result = self.send_message(user_id, alert_message, preferred_channel)
            
            if send_result["success"]:
                results["successful_sends"] += 1
            else:
                results["failed_sends"] += 1
            
            results["details"].append({
                "user_id": user_id,
                "channel": preferred_channel,
                "status": "sent" if send_result["success"] else "failed",
                "error": send_result.get("error")
            })
        
        return results
    
    def get_user_preferred_channel(self, user_id: str) -> str:
        """Get user's preferred communication channel"""
        # TODO: Implement database lookup
        return self.user_preferences.get(user_id, "sms")
    
    def set_user_preferred_channel(self, user_id: str, channel: str) -> None:
        """Set user's preferred communication channel"""
        self.user_preferences[user_id] = channel
        # TODO: Save to database
    
    def get_subscribed_users(self, region: str, alert_type: str) -> List[Dict]:
        """Get users subscribed to alerts in a region"""
        # TODO: Implement database query
        # Mock data for demonstration
        return [
            {
                "phone_number": "+91XXXXXXXXXX",
                "preferred_channel": "whatsapp",
                "language": "hindi",
                "region": region,
                "alert_types": ["outbreak", "vaccination"]
            }
        ]
    
    def handle_user_response(self, user_id: str, message: str, channel: str) -> str:
        """Handle user responses and commands"""
        message_lower = message.lower().strip()
        
        # Handle unsubscribe requests
        if message_lower in ["stop", "unsubscribe", "बंद करो", "रोको"]:
            # TODO: Remove user from subscription database
            return "You have been unsubscribed from health alerts. Reply START to resubscribe."
        
        # Handle resubscribe requests
        elif message_lower in ["start", "subscribe", "शुरू करो", "सब्सक्राइब"]:
            # TODO: Add user to subscription database
            return "Welcome back! You will now receive important health alerts. Reply STOP to unsubscribe."
        
        # Handle language preference
        elif message_lower.startswith("lang"):
            # Extract language from message
            return "Language preference updated. You will receive messages in your preferred language."
        
        # Default: treat as health query
        else:
            return None  # Will be handled by main chatbot logic

# Initialize communication hub
communication_hub = ChatbotCommunicationHub()

def send_outbreak_notification(region: str, disease: str, severity: str, 
                             recommendations: List[str]) -> Dict:
    """Send outbreak notification to all subscribed users"""
    
    message = f"Disease: {disease}\nSeverity: {severity}\n\n"
    message += "Recommendations:\n"
    for rec in recommendations:
        message += f"• {rec}\n"
    
    return communication_hub.broadcast_health_alert(region, message, "outbreak")

def send_vaccination_reminder(user_id: str, vaccine_name: str, 
                            due_date: str, channel: str = "auto") -> Dict:
    """Send vaccination reminder to specific user"""
    
    message = f"🩹 Vaccination Reminder\n\n" + \
              f"Vaccine: {vaccine_name}\n" + \
              f"Due Date: {due_date}\n\n" + \
              f"Please visit your nearest vaccination center. " + \
              f"Reply with your pincode to find nearby centers."
    
    return communication_hub.send_message(user_id, message, channel)