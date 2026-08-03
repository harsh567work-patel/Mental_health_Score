from main import StudentData, predict


def make_payload(**overrides):
    payload = {
        "Age": 25,
        "Gender": "Male",
        "Grouped_Countries": "India",
        "Academic_Level": "Undergraduate",
        "Most_Used_Platform": "Instagram",
        "Purpose_Of_Use": "Entertainment",
        "Avg_Daily_Usage_Hours": 4.0,
        "Daily_Unlocks": 20,
        "Study_Hours": 6.0,
        "Physical_Activity_Hours": 1.0,
        "Sleep_Hours_Per_Night": 7.0,
        "Stress_Level": "Medium",
    }
    payload.update(overrides)
    return StudentData(**payload)


base = predict(make_payload())
stressed = predict(make_payload(Stress_Level="High", Study_Hours=16.0, Physical_Activity_Hours=0.0, Sleep_Hours_Per_Night=4.0, Avg_Daily_Usage_Hours=20.0, Daily_Unlocks=200))
print(base.predicted_mental_health_score)
print(stressed.predicted_mental_health_score)
