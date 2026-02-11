from flask import Flask, render_template, request, jsonify, session
from chatbot import get_response
import os

app = Flask(__name__)
app.secret_key = os.urandom(24)  # Required for session


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/chat", methods=["POST"])
def chat():
    data = request.get_json()
    user_message = data.get("message", "").strip()

    if not user_message:
        return jsonify({
            "reply": "Please type something 🙂",
            "follow_up": []
        })

    # 🔥 Get user context from session
    user_context = session.get("context")

    try:
        # 🔥 Expect 4 return values from chatbot
        result = get_response(user_message, user_context)

        # Safety handling
        if len(result) == 4:
            bot_reply, confidence, new_context, follow_up = result
        else:
            # If old version returns 3 values
            bot_reply, confidence, new_context = result
            follow_up = []

    except Exception as e:
        print("Chatbot Error:", e)
        return jsonify({
            "reply": "⚠ Something went wrong. Please try again.",
            "follow_up": []
        })

    # 🔥 Save updated context
    session["context"] = new_context

    if not bot_reply:
        bot_reply = "🤖 Sorry, I didn’t understand that."

    # 🔥 Always ensure follow_up is a list
    if not isinstance(follow_up, list):
        follow_up = []

    return jsonify({
        "reply": bot_reply,
        "follow_up": follow_up
    })


if __name__ == "__main__":
    # app.run(debug=True)
    port = int(os.environ.get("PORT", 10000))  # Render gives PORT
    app.run(host="0.0.0.0", port=port)
