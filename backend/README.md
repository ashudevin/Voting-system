# Smart Election System - Backend

This is the FastAPI backend for the Smart Election System that handles voter registration, face recognition, and vote management.

## Local Development

1. Create a virtual environment:
```
python -m venv .venv
```

2. Activate the virtual environment:
- Windows: `.venv\Scripts\activate`
- MacOS/Linux: `source .venv/bin/activate`

3. Install dependencies:
```
pip install -r requirements.txt
```

4. Create a `.env` file with MongoDB details:
```
MONGO_URI=mongodb://localhost:27017/
MONGO_DB_NAME=smart_election_system
```

5. Run the server:
```
python -m uvicorn app.main:app --reload
```

## Deploying to Render

1. Create a new Web Service on Render dashboard

2. Connect your GitHub repository

3. Configure the service with these settings:
   - **Name**: smart-election-backend (or your preferred name)
   - **Environment**: Python
   - **Root Directory**: `backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT`

4. Add the following environment variables:
   - `MONGO_URI`: Your MongoDB connection string (e.g., MongoDB Atlas URL)
   - `MONGO_DB_NAME`: Your database name (e.g., `smart_election_system`)

5. Deploy the service

## Important Notes

- The backend requires MongoDB to store voters, faces, and votes
- Make sure to set up a MongoDB database (local for development or MongoDB Atlas for production)
- Remove `pywin32` from requirements.txt before deploying to Render (it's Windows-specific) 