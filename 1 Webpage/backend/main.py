import os
import joblib
import requests
from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd

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
def make_prediction():
    data = fetch_sheet_data()
    
    if not data:
        return {"error": "Not enough data for prediction"}
    
    try:
        # Use only the latest row for prediction
        latest_row = data[-1] if len(data[-1]) == 2 else None
        
        if not latest_row:
            return {"error": "Latest row data incomplete"}

        # Extract readings
        distance = float(latest_row[0])
        flowrate = float(latest_row[1])

        # Prepare features
        features = [[distance, flowrate]]
        feature_names = ["Distance", "FlowRate"]
        df_features = pd.DataFrame(features, columns=feature_names)

        # Make prediction
        prediction = model.predict(df_features)  # Returns list like [1] or [0]
        result = prediction[0]  # Get the single value

        # Map prediction to human-readable text
        if result == 1:
            prediction_text = "Flood Risk"
        else:
            prediction_text = "No Flood Risk"

        # Return both readings and prediction
        return {
            "Distance": distance,
            "FlowRate": flowrate,
            "Prediction": prediction_text
        }
    
    except Exception as e:
        return {"error": str(e)}


# Define a Pydantic model for the response
class PredictionResponse(BaseModel):
    Distance: float
    FlowRate: float
    Prediction: str


# Endpoint to fetch data and return prediction
@app.get("/predict", response_model=PredictionResponse)
def predict():
    prediction_data = make_prediction()
    
    if isinstance(prediction_data, dict) and "error" in prediction_data:
        # Return empty/default values on error
        return PredictionResponse(Distance=0.0, FlowRate=0.0, Prediction=prediction_data["error"])
    
    return PredictionResponse(
        Distance=prediction_data["Distance"],
        FlowRate=prediction_data["FlowRate"],
        Prediction=prediction_data["Prediction"]
    )


# Allow all origins, methods, and headers (for development only)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change this to your frontend URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
