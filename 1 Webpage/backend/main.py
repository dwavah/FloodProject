import os
import joblib
import requests
from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Google Sheets API configuration
SPREADSHEET_ID = '1qyrlI0zxKX_Hn4E3DnCU29NEuMiwnKBoONk18kppfBQ'
API_KEY = 'AIzaSyDfQX-VToR_ylK405gBCCX5_u0wQeNBxnY'  # Replace with your actual API key
SHEET_RANGE = 'Sheet1!B:C'  # Fetch only columns B and C

# Model loading (Ensure the model file is accessible)
model_path = 'flood_v1.pkl'
model = joblib.load(model_path)

# Function to fetch the last two rows from Google Sheets
def fetch_sheet_data():
    url = f'https://sheets.googleapis.com/v4/spreadsheets/{SPREADSHEET_ID}/values/{SHEET_RANGE}?key={API_KEY}'
    response = requests.get(url)
    
    if response.status_code == 200:
        data = response.json().get('values', [])
        if len(data) >= 2:
            return data[-2:]  # Get the last two rows
        elif len(data) == 1:
            return [data[-1]]  # If there's only one row, return it
        else:
            return []
    else:
        return []

# Function to make a prediction using the loaded model
# Function to make a prediction using the loaded model
import pandas as pd

# Function to make a prediction using the loaded model
def make_prediction():
    data = fetch_sheet_data()
    
    if not data or len(data) < 2:
        return {"error": "Not enough data for prediction"}
    
    try:
        # Convert the last two rows of column B and C to floats
        features = [[float(row[0]), float(row[1])] for row in data if len(row) == 2]  
        
        if len(features) != 2:  # Ensure we have exactly two valid rows
            return {"error": "Insufficient valid data points"}
        
        # Convert to DataFrame with correct column names
        feature_names = ["Distance", "Flowrate"]  # Use the actual names from model training
        df_features = pd.DataFrame(features, columns=feature_names)

        # Make prediction using the trained model
        prediction = model.predict(df_features)  
        return prediction.tolist()
    
    except Exception as e:
        return {"error": str(e)}



# Define a Pydantic model for the response
class PredictionResponse(BaseModel):
    prediction: str

# Endpoint to fetch data and return prediction
@app.get("/predict", response_model=PredictionResponse)
def predict():
    prediction = make_prediction()
    
    if isinstance(prediction, dict) and "error" in prediction:
        return PredictionResponse(prediction=prediction["error"])
    
    return PredictionResponse(prediction=str(prediction))


# Allow all origins, methods, and headers (for development only)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change this to your frontend URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)