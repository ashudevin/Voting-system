from fastapi import FastAPI, File, UploadFile, Depends, HTTPException, status, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from typing import List, Optional
import cv2
import pickle
import numpy as np
import os
import csv
import time
import base64
from datetime import datetime
from pydantic import BaseModel
import shutil
import uuid
from sklearn.neighbors import KNeighborsClassifier
from pymongo import MongoClient
from bson.binary import Binary

# Configuration variables
# Adjust these values to fine-tune the face recognition system
FACE_MATCH_THRESHOLD = 3000  # Lower = stricter matching (fewer false positives)
MAX_DISTANCE_THRESHOLD = 20000  # For initial verification
FACE_WIDTH = 100
FACE_HEIGHT = 100

app = FastAPI(title="Smart Election System API")

# CORS middleware to allow frontend to access backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create necessary directories if they don't exist
os.makedirs("data", exist_ok=True)
os.makedirs("temp", exist_ok=True)

# MongoDB Connection
MONGO_URI = "mongodb://localhost:27017/"
client = MongoClient(MONGO_URI)
db = client["smart_election_system"]
voters_collection = db["voters"]
votes_collection = db["votes"]
faces_collection = db["faces"]

# Create indexes for faster queries
voters_collection.create_index("aadhar_number", unique=True)
votes_collection.create_index("aadhar_number", unique=True)

# Initialize face detector
face_detector = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

# Improved face preprocessing function
def preprocess_face(face_img):
    """
    Preprocess face for better recognition:
    1. Resize to higher resolution (100x100 instead of 50x50)
    2. Convert to grayscale for better feature extraction
    3. Apply histogram equalization for lighting normalization
    4. Apply Gaussian blur to reduce noise
    """
    # Resize to higher resolution
    resized = cv2.resize(face_img, (FACE_WIDTH, FACE_HEIGHT))
    
    # Convert to grayscale if image is color
    if len(resized.shape) == 3:
        gray = cv2.cvtColor(resized, cv2.COLOR_BGR2GRAY)
    else:
        gray = resized
        
    # Apply histogram equalization for lighting normalization
    equalized = cv2.equalizeHist(gray)
    
    # Apply slight Gaussian blur to reduce noise
    blurred = cv2.GaussianBlur(equalized, (5, 5), 0)
    
    # Flatten for KNN
    return blurred.flatten()

# Path to CSV file (kept for backward compatibility)
CSV_FILE = "Votes.csv"

# CSV column names
COL_NAMES = ['NAME', 'VOTE', 'DATE', 'TIME']

# Models for request/response
class VoterRegister(BaseModel):
    aadhar_number: str

class Voter(BaseModel):
    aadhar_number: str
    registered: bool
    has_voted: bool

class Vote(BaseModel):
    aadhar_number: str
    party: str

class Party(BaseModel):
    name: str
    votes: int

# Function to handle data migration from files to MongoDB
def migrate_data_to_mongodb():
    """
    Migrates data from pickle files to MongoDB if needed
    """
    # Check if we have file-based data to migrate
    if os.path.exists('data/names.pkl') and os.path.exists('data/faces_data.pkl'):
        # Check if we already have data in MongoDB
        if voters_collection.count_documents({}) == 0:
            print("Migrating data from files to MongoDB...")
            
            with open('data/names.pkl', 'rb') as f:
                names = pickle.load(f)
            
            with open('data/faces_data.pkl', 'rb') as f:
                faces_data = pickle.load(f)
            
            # Check if we have data to migrate
            if len(names) > 0:
                # Backup before migration
                backup_time = datetime.now().strftime("%Y%m%d_%H%M%S")
                os.makedirs('data/backup', exist_ok=True)
                shutil.copy('data/names.pkl', f'data/backup/names_{backup_time}.pkl')
                shutil.copy('data/faces_data.pkl', f'data/backup/faces_data_{backup_time}.pkl')
                
                # Migrate data
                for i, aadhar_number in enumerate(names):
                    # Get face data for this voter
                    if len(faces_data.shape) > 1 and i < len(faces_data):
                        face_vector = faces_data[i].tolist()
                    else:
                        face_vector = faces_data.tolist()
                    
                    # Check if voter already exists in MongoDB
                    if voters_collection.count_documents({"aadhar_number": aadhar_number}) == 0:
                        # Register in MongoDB
                        voters_collection.insert_one({
                            "aadhar_number": aadhar_number,
                            "registration_date": datetime.now()
                        })
                        
                        # Store face vector
                        faces_collection.insert_one({
                            "aadhar_number": aadhar_number,
                            "face_vector": face_vector,
                            "feature_count": len(face_vector)
                        })
                
                # Migrate votes from CSV file
                if os.path.exists(CSV_FILE):
                    with open(CSV_FILE, "r") as csvfile:
                        reader = csv.reader(csvfile)
                        next(reader)  # Skip header
                        for row in reader:
                            if len(row) >= 4:
                                aadhar_number = row[0]
                                party = row[1]
                                date = row[2]
                                timestamp = row[3]
                                
                                # Store vote in MongoDB
                                if votes_collection.count_documents({"aadhar_number": aadhar_number}) == 0:
                                    votes_collection.insert_one({
                                        "aadhar_number": aadhar_number,
                                        "party": party,
                                        "date": date,
                                        "time": timestamp,
                                        "timestamp": datetime.now()
                                    })
                
                print("Migration completed successfully!")

# Get all face vectors from MongoDB for training the KNN model
def get_face_data():
    face_vectors = []
    aadhar_numbers = []
    
    cursor = faces_collection.find({})
    for doc in cursor:
        face_vectors.append(doc["face_vector"])
        aadhar_numbers.append(doc["aadhar_number"])
    
    if len(face_vectors) > 0:
        return np.array(face_vectors), aadhar_numbers
    else:
        return None, []

# Check if a voter has already voted
def check_if_voted(aadhar_number: str) -> bool:
    # First check MongoDB
    if votes_collection.count_documents({"aadhar_number": aadhar_number}) > 0:
        return True
    
    # Fall back to CSV for backward compatibility
    if os.path.exists(CSV_FILE):
        with open(CSV_FILE, "r") as csvfile:
            reader = csv.reader(csvfile)
            next(reader)  # Skip header
            for row in reader:
                if len(row) > 0 and row[0] == aadhar_number:
                    return True
    
    return False

# Add this function after get_face_data()
def check_face_already_voted(face_vector, current_aadhar=None):
    """
    Check if this face has already voted with a different Aadhar number
    Returns tuple (has_voted_with_different_aadhar, aadhar_used)
    """
    # Get all faces that have already voted
    voted_aadhar_numbers = []
    cursor = votes_collection.find({})
    for vote in cursor:
        voted_aadhar_numbers.append(vote["aadhar_number"])
    
    if not voted_aadhar_numbers:
        return False, None
    
    # Get face vectors for voters who have already voted
    voted_faces = []
    voted_aadhars = []
    
    cursor = faces_collection.find({"aadhar_number": {"$in": voted_aadhar_numbers}})
    for doc in cursor:
        # Skip the current Aadhar if provided (to avoid matching with self)
        if current_aadhar and doc["aadhar_number"] == current_aadhar:
            continue
            
        voted_faces.append(doc["face_vector"])
        voted_aadhars.append(doc["aadhar_number"])
    
    if not voted_faces:
        return False, None
    
    # Convert to numpy arrays for distance calculation
    voted_faces_array = np.array(voted_faces)
    face_vector_array = np.array(face_vector).reshape(1, -1)
    
    # Find minimum Euclidean distance manually for more control
    min_distance = float('inf')
    min_index = -1
    
    for i, voted_face in enumerate(voted_faces):
        # Calculate Euclidean distance
        distance = np.sqrt(np.sum((np.array(voted_face) - face_vector) ** 2))
        
        if distance < min_distance:
            min_distance = distance
            min_index = i
    
    # Use the threshold from configuration
    # For facial recognition, lower distances indicate higher similarity
    print(f"DEBUG: Minimum face distance: {min_distance}, Aadhar: {voted_aadhars[min_index] if min_index >= 0 else 'none'}, Threshold: {FACE_MATCH_THRESHOLD}")
    
    if min_distance < FACE_MATCH_THRESHOLD and min_index >= 0:
        closest_aadhar = voted_aadhars[min_index]
        return True, closest_aadhar
    
    return False, None

# Endpoints
@app.get("/")
def read_root():
    return {"message": "Welcome to the Smart Election API"}

@app.post("/register", response_model=Voter)
async def register_voter(aadhar_number: str = Form(...), file: UploadFile = File(...)):
    """
    Register a voter by capturing their face data and associating it with their Aadhar number
    """
    # Validate Aadhar number
    if not aadhar_number.isdigit() or len(aadhar_number) != 12:
        raise HTTPException(status_code=400, detail="Aadhar number must be exactly 12 digits")
    
    # Check if this Aadhar is already registered in MongoDB
    existing_voter = voters_collection.find_one({"aadhar_number": aadhar_number})
    if existing_voter:
        return {"aadhar_number": aadhar_number, "registered": True, "has_voted": check_if_voted(aadhar_number)}
    
    # Save uploaded image temporarily
    temp_file_path = f"temp/{uuid.uuid4()}.jpg"
    with open(temp_file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Read the image
    img = cv2.imread(temp_file_path)
    if img is None:
        os.remove(temp_file_path)
        raise HTTPException(status_code=400, detail="Invalid image file")
    
    # Convert to grayscale for face detection
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    faces = face_detector.detectMultiScale(gray, 1.3, 5)
    
    if len(faces) == 0:
        os.remove(temp_file_path)
        raise HTTPException(status_code=400, detail="No face detected in the image")
    
    if len(faces) > 1:
        os.remove(temp_file_path)
        raise HTTPException(status_code=400, detail="Multiple faces detected in the image")
    
    # Process the face
    x, y, w, h = faces[0]
    face_img = img[y:y+h, x:x+w]
    processed_face = preprocess_face(face_img)
    
    # Save original image as base64 for storage
    _, buffer = cv2.imencode('.jpg', face_img)
    face_image_base64 = base64.b64encode(buffer).decode('utf-8')
    
    # Store voter data in MongoDB
    voters_collection.insert_one({
        "aadhar_number": aadhar_number,
        "face_image": face_image_base64,
        "registration_date": datetime.now()
    })
    
    # Store face vector for recognition
    faces_collection.insert_one({
        "aadhar_number": aadhar_number,
        "face_vector": processed_face.tolist(),
        "feature_count": len(processed_face)
    })
    
    # Clean up temp file
    os.remove(temp_file_path)
    
    return {"aadhar_number": aadhar_number, "registered": True, "has_voted": False}

@app.post("/verify", response_model=Voter)
async def verify_voter(file: UploadFile = File(...)):
    """
    Verify a voter by comparing their face with registered faces
    """
    # Get face data from MongoDB
    faces_data, names = get_face_data()
    
    # Check if we have registered voters
    if len(names) == 0 or faces_data is None:
        raise HTTPException(status_code=400, detail="No registered voters found")
    
    # Determine appropriate number of neighbors (min of 3 or number of samples)
    n_samples = len(names)
    n_neighbors = min(3, n_samples)
    
    # Train KNN model with appropriate number of neighbors
    # Use distance weighting to improve accuracy
    knn = KNeighborsClassifier(
        n_neighbors=n_neighbors,
        weights='distance',  # Weight by distance for better accuracy
        algorithm='auto',
        metric='euclidean'
    )
    knn.fit(faces_data, names)
    
    # Save uploaded image temporarily
    temp_file_path = f"temp/{uuid.uuid4()}.jpg"
    with open(temp_file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Read the image
    img = cv2.imread(temp_file_path)
    if img is None:
        os.remove(temp_file_path)
        raise HTTPException(status_code=400, detail="Invalid image file")
    
    # Convert to grayscale for face detection
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    faces = face_detector.detectMultiScale(gray, 1.3, 5)
    
    if len(faces) == 0:
        os.remove(temp_file_path)
        raise HTTPException(status_code=400, detail="No face detected in the image")
    
    if len(faces) > 1:
        os.remove(temp_file_path)
        raise HTTPException(status_code=400, detail="Multiple faces detected in the image")
    
    # Process the face and predict
    x, y, w, h = faces[0]
    face_img = img[y:y+h, x:x+w]
    processed_face = preprocess_face(face_img)
    
    # Get distances and labels for verification
    distances, indices = knn.kneighbors(processed_face.reshape(1, -1))
    
    # Print distance for debugging
    print(f"DEBUG: Verification distance: {distances[0][0]}, Threshold: {MAX_DISTANCE_THRESHOLD}")
    
    # Set a distance threshold for acceptable face matches
    # This helps prevent incorrect identifications
    if distances[0][0] > MAX_DISTANCE_THRESHOLD:
        os.remove(temp_file_path)
        raise HTTPException(status_code=400, detail="No matching voter found. Please register first.")
    
    # Predict the Aadhar number
    predicted_aadhar = knn.predict(processed_face.reshape(1, -1))[0]
    
    # Check if this face has already voted with a different Aadhar number
    face_voted, voted_aadhar = check_face_already_voted(processed_face, predicted_aadhar)
    if face_voted:
        os.remove(temp_file_path)
        raise HTTPException(
            status_code=400, 
            detail=f"This face has already voted with Aadhar number {voted_aadhar}. Duplicate voting is not allowed."
        )
    
    # Clean up temp file
    os.remove(temp_file_path)
    
    # Check if the voter has already voted
    has_voted = check_if_voted(predicted_aadhar)
    
    return {"aadhar_number": predicted_aadhar, "registered": True, "has_voted": has_voted}

@app.post("/vote", response_model=dict)
async def cast_vote(vote: Vote):
    """
    Cast a vote for a specific party
    """
    aadhar_number = vote.aadhar_number
    party = vote.party
    
    # Validate Aadhar number
    if not aadhar_number.isdigit() or len(aadhar_number) != 12:
        raise HTTPException(status_code=400, detail="Aadhar number must be exactly 12 digits")
    
    # Check if the voter exists in MongoDB
    voter = voters_collection.find_one({"aadhar_number": aadhar_number})
    if not voter:
        raise HTTPException(status_code=404, detail=f"Voter with Aadhar {aadhar_number} not registered")
    
    # Check if voter has already voted in MongoDB
    if votes_collection.count_documents({"aadhar_number": aadhar_number}) > 0:
        raise HTTPException(status_code=400, detail="You have already voted")
    
    # Record the vote
    ts = time.time()
    date = datetime.fromtimestamp(ts).strftime("%d-%m-%Y")
    timestamp = datetime.fromtimestamp(ts).strftime("%H:%M-%S")
    
    # Store vote in MongoDB
    votes_collection.insert_one({
        "aadhar_number": aadhar_number,
        "party": party,
        "date": date,
        "time": timestamp,
        "timestamp": datetime.now()
    })
    
    # Also write to CSV for backward compatibility
    with open(CSV_FILE, "a", newline="") as csvfile:
        writer = csv.writer(csvfile)
        writer.writerow([aadhar_number, party, date, timestamp])
    
    return {"message": "Vote successfully recorded", "aadhar_number": aadhar_number, "party": party}

@app.get("/results", response_model=List[Party])
async def get_results():
    """
    Get the current election results
    """
    # Count votes from MongoDB
    party_votes = {}
    
    cursor = votes_collection.find({})
    for vote in cursor:
        party = vote["party"]
        if party in party_votes:
            party_votes[party] += 1
        else:
            party_votes[party] = 1
    
    # Also count from CSV for backward compatibility
    if os.path.exists(CSV_FILE):
        with open(CSV_FILE, "r") as csvfile:
            reader = csv.reader(csvfile)
            next(reader)  # Skip header
            for row in reader:
                if len(row) >= 2:
                    party = row[1]
                    # Only count if not already in MongoDB (to avoid double counting)
                    aadhar = row[0]
                    if votes_collection.count_documents({"aadhar_number": aadhar}) == 0:
                        if party in party_votes:
                            party_votes[party] += 1
                        else:
                            party_votes[party] = 1
    
    # Format results
    results = [{"name": party, "votes": votes} for party, votes in party_votes.items()]
    return results

@app.get("/voters", response_model=List[str])
async def get_registered_voters():
    """
    Get list of registered voters (Aadhar numbers)
    """
    aadhar_numbers = []
    
    # Get voters from MongoDB
    cursor = voters_collection.find({})
    for voter in cursor:
        aadhar_numbers.append(voter["aadhar_number"])
    
    # Remove duplicates and sort
    unique_names = sorted(list(set(aadhar_numbers)))
    return unique_names

@app.delete("/voters/{aadhar_number}")
async def delete_voter(aadhar_number: str):
    """
    Delete a voter and their vote (if any) from the system
    """
    # Validate Aadhar number
    if not aadhar_number.isdigit() or len(aadhar_number) != 12:
        raise HTTPException(status_code=400, detail="Aadhar number must be exactly 12 digits")
    
    # Check if voter exists
    voter = voters_collection.find_one({"aadhar_number": aadhar_number})
    if not voter:
        raise HTTPException(status_code=404, detail=f"Voter with Aadhar {aadhar_number} not found")
    
    # Delete voter from MongoDB
    voters_collection.delete_one({"aadhar_number": aadhar_number})
    
    # Delete face data
    faces_collection.delete_one({"aadhar_number": aadhar_number})
    
    # Delete vote if it exists
    vote_deleted = False
    vote_result = votes_collection.delete_one({"aadhar_number": aadhar_number})
    if vote_result.deleted_count > 0:
        vote_deleted = True
    
    # Also remove from CSV for backward compatibility
    if os.path.exists(CSV_FILE):
        # Read all rows and filter out the voter
        with open(CSV_FILE, "r") as csvfile:
            reader = csv.reader(csvfile)
            rows = list(reader)
            header = rows[0]
            filtered_rows = [row for row in rows[1:] if len(row) > 0 and row[0] != aadhar_number]
        
        # Write back without the voter
        with open(CSV_FILE, "w", newline="") as csvfile:
            writer = csv.writer(csvfile)
            writer.writerow(header)
            writer.writerows(filtered_rows)
    
    return {
        "message": f"Voter {aadhar_number} successfully deleted",
        "vote_deleted": vote_deleted
    }

@app.delete("/votes/{aadhar_number}")
async def delete_vote(aadhar_number: str):
    """
    Delete a specific vote without removing the voter
    """
    # Validate Aadhar number
    if not aadhar_number.isdigit() or len(aadhar_number) != 12:
        raise HTTPException(status_code=400, detail="Aadhar number must be exactly 12 digits")
    
    # Check if voter exists
    voter = voters_collection.find_one({"aadhar_number": aadhar_number})
    if not voter:
        raise HTTPException(status_code=404, detail=f"Voter with Aadhar {aadhar_number} not found")
    
    # Delete vote if it exists
    vote_result = votes_collection.delete_one({"aadhar_number": aadhar_number})
    if vote_result.deleted_count == 0:
        raise HTTPException(status_code=404, detail=f"No vote found for Aadhar {aadhar_number}")
    
    # Also remove from CSV for backward compatibility
    if os.path.exists(CSV_FILE):
        # Read all rows and filter out the vote
        with open(CSV_FILE, "r") as csvfile:
            reader = csv.reader(csvfile)
            rows = list(reader)
            header = rows[0]
            filtered_rows = [row for row in rows[1:] if len(row) > 0 and row[0] != aadhar_number]
        
        # Write back without the vote
        with open(CSV_FILE, "w", newline="") as csvfile:
            writer = csv.writer(csvfile)
            writer.writerow(header)
            writer.writerows(filtered_rows)
    
    return {"message": f"Vote for {aadhar_number} successfully deleted"}

@app.delete("/reset/votes")
async def reset_all_votes():
    """
    Reset all votes (delete all votes without removing voters)
    """
    # Delete all votes from MongoDB
    result = votes_collection.delete_many({})
    deleted_count = result.deleted_count
    
    # Also reset CSV file for backward compatibility
    if os.path.exists(CSV_FILE):
        with open(CSV_FILE, "w", newline="") as csvfile:
            writer = csv.writer(csvfile)
            writer.writerow(COL_NAMES)
    
    return {"message": f"All votes reset successfully. {deleted_count} votes deleted."}

@app.delete("/reset/system")
async def reset_entire_system():
    """
    Reset the entire system (delete all voters, faces, and votes)
    """
    # Delete all data from MongoDB
    voters_result = voters_collection.delete_many({})
    faces_result = faces_collection.delete_many({})
    votes_result = votes_collection.delete_many({})
    
    # Get deletion counts
    voters_deleted = voters_result.deleted_count
    faces_deleted = faces_result.deleted_count
    votes_deleted = votes_result.deleted_count
    
    # Reset CSV file for backward compatibility
    if os.path.exists(CSV_FILE):
        with open(CSV_FILE, "w", newline="") as csvfile:
            writer = csv.writer(csvfile)
            writer.writerow(COL_NAMES)
    
    # Reset pickle files for backward compatibility
    if os.path.exists('data/names.pkl'):
        with open('data/names.pkl', 'wb') as f:
            pickle.dump([], f)
    
    if os.path.exists('data/faces_data.pkl'):
        with open('data/faces_data.pkl', 'wb') as f:
            pickle.dump(np.array([]), f)
    
    return {
        "message": "System reset successfully",
        "voters_deleted": voters_deleted,
        "faces_deleted": faces_deleted,
        "votes_deleted": votes_deleted
    }

# Startup event to migrate data if needed
@app.on_event("startup")
async def startup_event():
    # Check if CSV file exists, if not create it
    if not os.path.exists(CSV_FILE):
        with open(CSV_FILE, "w", newline="") as csvfile:
            writer = csv.writer(csvfile)
            writer.writerow(COL_NAMES)
    
    # Migrate data from files to MongoDB if needed
    migrate_data_to_mongodb()

# Mount the temp directory for serving images
app.mount("/temp", StaticFiles(directory="temp"), name="temp")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 