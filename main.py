import joblib
from pathlib import Path
from fastapi import FastAPI
import pandas as pd
from pydantic import BaseModel, Field
from typing import Literal
from fastapi.middleware.cors import CORSMiddleware
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestRegressor
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

MODEL_PATH = Path(__file__).with_name("mental_health_model.pkl")
DATA_PATH = Path(__file__).with_name("Student Social Media And Mental Health Impact.csv")
NUMERIC_COLUMNS = [
    "Age",
    "Avg_Daily_Usage_Hours",
    "Daily_Unlocks",
    "Study_Hours",
    "Physical_Activity_Hours",
    "Sleep_Hours_Per_Night",
]
CATEGORICAL_COLUMNS = [
    "Gender",
    "Grouped_Countries",
    "Academic_Level",
    "Most_Used_Platform",
    "Purpose_Of_Use",
    "Stress_Level",
]
FEATURE_COLUMNS = NUMERIC_COLUMNS + CATEGORICAL_COLUMNS


def train_model():
    df = pd.read_csv(DATA_PATH)
    df = df.rename(columns={"Country": "Grouped_Countries"})

    X = df[FEATURE_COLUMNS]
    y = df["Mental_Health_Score"]

    numeric_transformer = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="median")),
            ("scaler", StandardScaler()),
        ]
    )
    categorical_transformer = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="most_frequent")),
            ("encoder", OneHotEncoder(handle_unknown="ignore")),
        ]
    )
    preprocessor = ColumnTransformer(
        transformers=[
            ("num", numeric_transformer, NUMERIC_COLUMNS),
            ("cat", categorical_transformer, CATEGORICAL_COLUMNS),
        ]
    )
    pipeline = Pipeline(
        steps=[
            ("preprocessor", preprocessor),
            ("regressor", RandomForestRegressor(n_estimators=250, random_state=42)),
        ]
    )
    pipeline.fit(X, y)
    joblib.dump(pipeline, MODEL_PATH)
    return pipeline


model = train_model()

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# A FIRST PYDANTIC MODEL  FOR INPUT DATA
class StudentData(BaseModel):
        Age: int = Field(... , ge=10 , le=100)
        Gender: Literal['Male', 'Female', 'Other']
        Grouped_Countries: Literal['India', 'Canada', 'Germany', 'France', 'Mexico', 'Turkey', 'Other']
        Academic_Level: Literal['High School', 'Undergraduate', 'Graduate']
        Most_Used_Platform: Literal['Facebook', 'LinkedIn', 'Instagram', 'Snapchat', 'Twitter','YouTube', 'TikTok', 'LINE', 'KakaoTalk', 'VKontakte', 'WhatsApp','WeChat']
        Purpose_Of_Use: Literal['Networking', 'Education', 'Entertainment', 'News']
        Avg_Daily_Usage_Hours: float = Field(... , ge =0 , le=24)
        Daily_Unlocks: int = Field(... , ge = 0)
        Study_Hours: float = Field(... , ge= 0 , le =24)
        Physical_Activity_Hours: float = Field(... , ge=0 , le=24)
        Sleep_Hours_Per_Night: float = Field(... , ge=0 , le=24)
        Stress_Level: Literal['Low', 'Medium', 'High', 'Very High']


        # Describe what we need to send back

class PredictionResponse(BaseModel):
     predicted_mental_health_score: float
     predicted_mental_health_percent: float


@app.get('/')
def greet():
    return {'message': 'Hello! Welcome to the Mental Health Prediction API.'}

@app.post('/predict' , response_model=PredictionResponse)
def predict(data: StudentData):
    input_row = pd.DataFrame([{
        "Age": data.Age,
        "Gender": data.Gender,
        "Grouped_Countries": data.Grouped_Countries,
        "Academic_Level": data.Academic_Level,
        "Most_Used_Platform": data.Most_Used_Platform,
        "Purpose_Of_Use": data.Purpose_Of_Use,
        "Avg_Daily_Usage_Hours": data.Avg_Daily_Usage_Hours,
        "Daily_Unlocks": data.Daily_Unlocks,
        "Study_Hours": data.Study_Hours,
        "Physical_Activity_Hours": data.Physical_Activity_Hours,
        "Sleep_Hours_Per_Night": data.Sleep_Hours_Per_Night,
        "Stress_Level": data.Stress_Level,
    }])

    prediction = float(model.predict(input_row)[0])
    normalized = ((prediction - 3.6) / (9.4 - 3.6)) * 100
    normalized = min(100.0, max(0.0, normalized))
    return PredictionResponse(
        predicted_mental_health_score=round(prediction, 2),
        predicted_mental_health_percent=round(normalized, 2),
    )
    

