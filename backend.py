import os
from openai import OpenAI
from flask import Flask, request, jsonify

app = Flask(__name__)

client = OpenAI(
    api_key=os.environ.get("GEMINI_API_KEY"),
    base_url="https://generativelanguage.googleapis.com/v1beta/openai/"
)

@app.route("/analyze_screenshot", methods=["POST"])
def analyze_screenshot():
    """
    Accepts JSON with 'base64Screenshot' & 'goal'.
    Returns a numeric score (1-100) for how off-task the user is.
    """
    data = request.get_json(force=True)
    base64_screenshot = data.get("base64Screenshot", "")
    goal = data.get("goal", "")

    prompt = f"""
    You have a screenshot of the user's current activity. 
    Their stated mission objective is: '{goal}'.
    Determine how relevant this webpage is to their mission, 
    from 1 to 100, where 1 is perfectly on-track 
    and 100 is completely off-track.
    Return only that number.
    """.strip()

    try:
        response = client.chat.completions.create(
            model="gemini-2.0-flash",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {"type": "image_url", "image_url": {"url": base64_screenshot}},
                    ],
                }
            ],
            temperature=0.0,
            max_tokens=10
        )

        if response.choices and len(response.choices) > 0:
            result = response.choices[0].message.content.strip()
        else:
            return jsonify({"error": "No valid response from Gemini"}), 500

        return jsonify(result)

    except Exception as e:
        print(e)
        return jsonify({"error": str(e)}), 500

@app.route("/validate_reason", methods=["POST"])
def validate_reason():
    """
    Accepts JSON with 'base64Screenshot', 'goal', 'reason'.
    Returns 'pass' or 'fail' for whether the user's reason is valid.
    """
    data = request.get_json(force=True)
    base64_screenshot = data.get("base64Screenshot", "")
    goal = data.get("goal", "")
    reason = data.get("reason", "")

    prompt = f"""
    The user might be off-mission. 
    Their mission objective is '{goal}', but they gave this reason: '{reason}' 
    for using the current page. Evaluate how relevant it is. 
    Return "pass" if valid, or "fail" if not.
    """.strip()

    try:
        response = client.chat.completions.create(
            model="gemini-2.0-flash",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {"type": "image_url", "image_url": {"url": base64_screenshot}},
                    ],
                }
            ],
            temperature=0.0,
            max_tokens=10
        )

        if response.choices and len(response.choices) > 0:
            result = response.choices[0].message.content.strip()
        else:
            return jsonify({"error": "No valid response from Gemini"}), 500

        return jsonify(result)

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=8080)
