from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from pathlib import Path
import os
import logging
import uuid
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel
import json

# Firebase imports (will be enabled when service account is provided)
try:
    import firebase_admin
    from firebase_admin import credentials, firestore, storage
    FIREBASE_ENABLED = False  # Will be set to True when service account is configured
except ImportError:
    FIREBASE_ENABLED = False
    print("Firebase Admin SDK not available")

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Create the main app
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Models
class RoomCreate(BaseModel):
    code: Optional[str] = None

class Room(BaseModel):
    code: str
    created_at: datetime
    created_by: str
    users: List[str]
    files: List[dict]
    active: bool

class FileUpload(BaseModel):
    room_code: str
    file_name: str
    file_size: int
    file_type: str

class Message(BaseModel):
    room_code: str
    text: str
    sender: str

# Firebase initialization (placeholder)
firebase_app = None
db = None
storage_bucket = None

def initialize_firebase():
    """Initialize Firebase with service account credentials"""
    global firebase_app, db, storage_bucket, FIREBASE_ENABLED
    
    try:
        # Check if service account file exists
        service_account_path = ROOT_DIR / 'firebase-service-account.json'
        if not service_account_path.exists():
            print("Firebase service account not found. Please add firebase-service-account.json to backend directory.")
            return False
            
        # Initialize Firebase Admin
        cred = credentials.Certificate(str(service_account_path))
        firebase_app = firebase_admin.initialize_app(cred, {
            'storageBucket': 'sharenear-6cb50.firebasestorage.app'
        })
        
        db = firestore.client()
        storage_bucket = storage.bucket()
        FIREBASE_ENABLED = True
        print("Firebase initialized successfully")
        return True
        
    except Exception as e:
        print(f"Failed to initialize Firebase: {e}")
        FIREBASE_ENABLED = False
        return False

# Try to initialize Firebase on startup
initialize_firebase()

# Routes
@api_router.get("/")
async def root():
    return {
        "message": "ShareNear API",
        "firebase_enabled": FIREBASE_ENABLED,
        "version": "1.0.0"
    }

@api_router.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "firebase_enabled": FIREBASE_ENABLED,
        "timestamp": datetime.now().isoformat()
    }

@api_router.post("/rooms")
async def create_room(room_data: RoomCreate):
    """Create a new room"""
    if not FIREBASE_ENABLED:
        raise HTTPException(status_code=503, detail="Firebase not configured")
    
    try:
        # Generate room code if not provided
        code = room_data.code or str(uuid.uuid4())[:6].upper()
        
        room = {
            'code': code,
            'created_at': datetime.now(),
            'created_by': 'anonymous',
            'users': ['anonymous'],
            'files': [],
            'active': True
        }
        
        # Save to Firestore
        doc_ref = db.collection('rooms').document(code)
        doc_ref.set(room)
        
        return {"code": code, "message": "Room created successfully"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create room: {str(e)}")

@api_router.get("/rooms/{room_code}")
async def get_room(room_code: str):
    """Get room details"""
    if not FIREBASE_ENABLED:
        raise HTTPException(status_code=503, detail="Firebase not configured")
    
    try:
        doc_ref = db.collection('rooms').document(room_code)
        doc = doc_ref.get()
        
        if doc.exists:
            return doc.to_dict()
        else:
            raise HTTPException(status_code=404, detail="Room not found")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get room: {str(e)}")

@api_router.post("/rooms/{room_code}/files")
async def upload_file_metadata(room_code: str, file_data: FileUpload):
    """Save file metadata to room"""
    if not FIREBASE_ENABLED:
        raise HTTPException(status_code=503, detail="Firebase not configured")
    
    try:
        # Get room document
        room_ref = db.collection('rooms').document(room_code)
        room_doc = room_ref.get()
        
        if not room_doc.exists:
            raise HTTPException(status_code=404, detail="Room not found")
        
        # Add file to room's file list
        room_data = room_doc.to_dict()
        files = room_data.get('files', [])
        
        new_file = {
            'id': str(uuid.uuid4()),
            'name': file_data.file_name,
            'size': file_data.file_size,
            'type': file_data.file_type,
            'uploaded_at': datetime.now(),
            'uploaded_by': 'anonymous'
        }
        
        files.append(new_file)
        room_ref.update({'files': files})
        
        return {"message": "File metadata saved", "file_id": new_file['id']}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file metadata: {str(e)}")

@api_router.post("/rooms/{room_code}/messages")
async def send_message(room_code: str, message: Message):
    """Send a message to room chat"""
    if not FIREBASE_ENABLED:
        raise HTTPException(status_code=503, detail="Firebase not configured")
    
    try:
        # Add message to room's messages subcollection
        message_data = {
            'text': message.text,
            'sender': message.sender,
            'timestamp': datetime.now()
        }
        
        db.collection('rooms').document(room_code).collection('messages').add(message_data)
        
        return {"message": "Message sent successfully"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send message: {str(e)}")

@api_router.get("/rooms/{room_code}/messages")
async def get_messages(room_code: str, limit: int = 50):
    """Get messages from room chat"""
    if not FIREBASE_ENABLED:
        raise HTTPException(status_code=503, detail="Firebase not configured")
    
    try:
        messages_ref = db.collection('rooms').document(room_code).collection('messages')
        query = messages_ref.order_by('timestamp').limit(limit)
        messages = query.stream()
        
        result = []
        for msg in messages:
            msg_data = msg.to_dict()
            msg_data['id'] = msg.id
            result.append(msg_data)
        
        return {"messages": result}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get messages: {str(e)}")

@api_router.post("/test-firebase")
async def test_firebase_connection():
    """Test Firebase connection"""
    if not FIREBASE_ENABLED:
        return {"status": "Firebase not configured"}
    
    try:
        # Test Firestore connection
        test_doc_ref = db.collection('test').document('connection')
        test_doc_ref.set({
            'timestamp': datetime.now(),
            'test': True
        })
        
        # Test Storage connection (just check if bucket exists)
        bucket_name = storage_bucket.name
        
        return {
            "status": "Firebase connection successful",
            "firestore": "connected",
            "storage_bucket": bucket_name
        }
        
    except Exception as e:
        return {
            "status": "Firebase connection failed",
            "error": str(e)
        }

# WebRTC signaling endpoints
@api_router.post("/rooms/{room_code}/signal")
async def webrtc_signal(room_code: str, signal_data: dict):
    """Handle WebRTC signaling"""
    if not FIREBASE_ENABLED:
        raise HTTPException(status_code=503, detail="Firebase not configured")
    
    try:
        # Store signaling data in Firestore for real-time updates
        signal_ref = db.collection('rooms').document(room_code).collection('signals')
        signal_ref.add({
            **signal_data,
            'timestamp': datetime.now()
        })
        
        return {"message": "Signal sent"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send signal: {str(e)}")

# Include the router in the main app
app.include_router(api_router)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Startup event
@app.on_event("startup")
async def startup_event():
    logger.info("ShareNear API starting up...")
    if FIREBASE_ENABLED:
        logger.info("Firebase is enabled and configured")
    else:
        logger.warning("Firebase is not configured. Please add firebase-service-account.json")

# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    logger.info("ShareNear API shutting down...")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)