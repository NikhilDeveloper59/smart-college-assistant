import json
import random
import re
import numpy as np
from datetime import datetime
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity

# 🔹 Load semantic model
embedding_model = SentenceTransformer("all-MiniLM-L6-v2")

# 🔹 Load intents
with open("intents.json", "r", encoding="utf-8") as f:
    intents = json.load(f)

CONFIDENCE_THRESHOLD = 0.55


# 🔹 Clean function
def clean(text):
    return re.sub(r"[^a-zA-Z ]", "", text.lower()).strip()

# Time Greeting Function
def get_time_greeting():
    hour = datetime.now().hour

    if 5 <= hour < 12:
        return "🌅 Good Morning"
    elif 12 <= hour < 17:
        return "☀️ Good Afternoon"
    elif 17 <= hour < 21:
        return "🌇 Good Evening"
    else:
        return "🌙 Welcome"


# 🔹 Get intent by tag
def get_intent_by_tag(tag):
    for intent in intents["intents"]:
        if intent["tag"] == tag:
            return intent
    return None


# 🔹 Get menu suggestions automatically
def get_menu_suggestions(limit=4):
    suggestions = []
    for intent in intents["intents"]:
        if intent.get("show_in_menu"):
            suggestions.append(intent.get("menu_label", intent["tag"]))
    return suggestions[:limit]


# 🔹 Prepare patterns once (IMPORTANT)
patterns = []
tags = []

for intent in intents["intents"]:
    for pattern in intent["patterns"]:
        patterns.append(pattern)
        tags.append(intent["tag"])

pattern_embeddings = embedding_model.encode(patterns)


# 🔹 Main chatbot response function
def get_response(user_input, context):

    user_input_clean = clean(user_input)

    if not user_input_clean:
        return "Please enter something 😊", 0.0, context, []

    # 🔥 Simple fallback
    simple_responses = {
        "hi": "Hello 👋 How can I help you?",
        "hello": "Hello 👋 How can I help you?",
        "hey": "Hey 😊 How can I assist you?",
        "how are you": "I'm doing great 😊 Thanks for asking!",
        "what is your name": "I am your AI Assistant 🤖",
        "who are you": "I am your AI Assistant 🤖"
    }

    if user_input_clean in simple_responses:
        follow_up = get_menu_suggestions()
        return simple_responses[user_input_clean], 1.0, context, follow_up

    # 🔥 Semantic Matching
    user_embedding = embedding_model.encode([user_input_clean])
    similarities = cosine_similarity(user_embedding, pattern_embeddings)

    best_index = np.argmax(similarities)
    confidence = float(similarities[0][best_index])
    tag = tags[best_index]

    print("User:", user_input_clean)
    print("Predicted:", tag)
    print("Confidence:", confidence)

    if confidence < CONFIDENCE_THRESHOLD:
        return "Sorry 😔 I didn't understand. Please try again.", confidence, context, []

    intent = get_intent_by_tag(tag)

    if not intent:
        return "Sorry, something went wrong.", confidence, context, []

    # 🔹 Context filter
    if "context_filter" in intent:
        if context != intent["context_filter"]:
            return "Please follow the previous step 😊", confidence, context, []

    # 🔹 Set context
    if "set_context" in intent:
        context = intent["set_context"]

    reply = random.choice(intent["responses"])

    # 🔹 Greeting menu text
    if tag == "greeting":
        time_greet = get_time_greeting()

        reply = f"{time_greet} 👋\n\n{reply}\n\n✨ I'm here to guide you with admissions, placements, projects and more."

        follow_up = intent.get("follow_up", [])

    # 🔥 Smart Follow-up Suggestions Logic

    # 1️⃣ If intent has manual follow_up in JSON → use that
    follow_up = intent.get("follow_up", [])

    # 2️⃣ If no manual follow-up but show_in_menu → show related features
    if not follow_up and intent.get("show_in_menu"):
        follow_up = get_menu_suggestions()

    return reply, confidence, context, follow_up
