# Mental_health_Score

# 🧠 Mental Health Score Prediction System

An AI-powered web application that predicts a user's mental health score based on lifestyle and behavioural factors. The system leverages Machine Learning to provide personalised insights and recommendations through an intuitive web interface.

---

## 📌 Overview

Mental health is influenced by several daily lifestyle factors such as sleep quality, stress levels, physical activity, and screen time. This project aims to analyse these factors using a Machine Learning model and generate an easy-to-understand mental health report.

The project was developed from scratch, including data preprocessing, model training, API development, frontend integration, and deployment.

---

## ✨ Features

* 🧠 Predicts Mental Health Score using Machine Learning
* 😴 Analyses Sleep Quality
* ⚡ Evaluates Stress Level
* 🏃 Measures Physical Activity
* 📱 Reviews Screen Time
* 📊 Generates an easy-to-understand mental health report
* ⚡ FastAPI-powered REST API
* 🌐 Fully deployed web application
* 📱 Responsive and user-friendly interface

---

## 🚀 Live Demo

**Website:**
https://mental-health-score-1-hzsu.onrender.com

---

## 🖼️ Project Architecture

```text
                User
                  │
                  ▼
        Frontend Web Interface
                  │
                  ▼
          FastAPI REST API
                  │
                  ▼
      Machine Learning Model
                  │
                  ▼
      Mental Health Prediction
                  │
                  ▼
      Detailed Health Report
```

---

## 🛠️ Tech Stack

### Machine Learning

* Python
* Scikit-learn
* Pandas
* NumPy
* Joblib

### Backend

* FastAPI
* Pydantic
* Uvicorn

### Frontend

* HTML
* CSS
* JavaScript

### Deployment

* Render

---

## 📂 Project Structure

```text
Mental-Health-Score/
│
├── backend/
│   ├── main.py
│   ├── mental_health_model.pkl
│   ├── requirements.txt
│   └── ...
│
├── frontend/
│   ├── index.html
│   ├── style.css
│   ├── script.js
│   └── assets/
│
├── dataset/
│   └── mental_health_dataset.csv
│
├── notebooks/
│   └── model_training.ipynb
│
├── README.md
└── LICENSE
```

*(Modify the structure above if your repository differs.)*

---

## ⚙️ How It Works

1. User enters lifestyle information.
2. Frontend validates the inputs.
3. Data is sent to the FastAPI backend.
4. Backend preprocesses the data.
5. The trained Machine Learning model predicts the mental health score.
6. The prediction is returned to the frontend.
7. The application generates a detailed health report with personalized insights.

---

## 📊 Machine Learning Workflow

* Data Collection
* Data Cleaning
* Feature Engineering
* Model Training
* Model Evaluation
* Model Serialization using Joblib
* API Integration
* Deployment

---

## 📈 Prediction Parameters

The model considers several lifestyle-related factors, including:

* Age
* Gender
* Sleep Duration
* Stress Level
* Screen Time
* Physical Activity
* Work/Study Hours
* Mood Indicators
* Lifestyle Habits

*(Update this list to match your dataset exactly.)*

---

## 💻 Running the Project Locally

### Clone the repository

```bash
git clone https://github.com/your-username/your-repository.git

cd your-repository
```

### Install dependencies

```bash
pip install -r requirements.txt
```

### Start the FastAPI server

```bash
uvicorn main:app --reload
```

Open:

```
http://127.0.0.1:8000
```

Swagger Documentation:

```
http://127.0.0.1:8000/docs
```

---

## 📊 Future Improvements

* User Authentication
* Dashboard with historical predictions
* Explainable AI (SHAP/LIME)
* Visualization of lifestyle trends
* Personalized recommendations using Generative AI
* Mobile application
* Database integration
* Advanced model optimization

---

## 🎯 Learning Outcomes

This project provided practical experience in:

* End-to-end Machine Learning development
* Data preprocessing
* Feature engineering
* Model training and evaluation
* FastAPI development
* REST API integration
* Frontend–Backend communication
* AI application deployment
* Production-ready project structure

---

## 👨‍💻 Author

**Harsh Patel**

AI & Machine Learning Enthusiast | B.Tech Computer Science Engineering

If you found this project interesting, consider giving the repository a ⭐ and feel free to share your feedback or suggestions.

---

## 📄 License

This project is licensed under the MIT License.
