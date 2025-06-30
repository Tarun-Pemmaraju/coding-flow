from google.generativeai import configure, GenerativeModel
import sys

def evaluate_code_explanation(question, code, explanation):
    # Configure your Gemini API key
    configure(api_key="AIzaSyDECepsSL7KcBMs0ENJyZ3VhMUb5Io_tHU")

    prompt = f"""Question: {question}
Code: {code}
Explanation: {explanation}
Objective:
Evaluate the provided code and explanation. If the explanation correctly describes the logic of the code with at least 70% accuracy, return 0. Otherwise, return 1.
Only check is the provided code matched with explanation
Note: The output should only be the number 1 or 0 without any additional text.
##OUTPUT FORMAT##:
1 or 0"""

    model = GenerativeModel("gemini-1.5-flash-latest")
    response = model.generate_content(prompt)

    reply = response.text.strip()

    # 0 = correct, 1 = incorrect
    if reply == "0":
        return 0
    else:
        return 1

if __name__ == "__main__":
    import json
    import os

    # If run as a script, accept JSON input via stdin or as arguments
    if len(sys.argv) > 1:
        # Arguments: question, code, explanation
        question = sys.argv[1]
        code = sys.argv[2]
        explanation = sys.argv[3]
        result = evaluate_code_explanation(question, code, explanation)
        print(str(result))  # Always print 0 or 1 to stdout
        sys.exit(result)
    else:
        # Accept JSON from stdin (for web server integration)
        try:
            data = json.load(sys.stdin)
            question = data.get("question", "")
            code = data.get("code", "")
            explanation = data.get("explanation", "")
            result = evaluate_code_explanation(question, code, explanation)
            print(str(result))  # Always print 0 or 1 to stdout
            sys.exit(result)
        except Exception as e:
            print("1")  # Default to incorrect
            sys.exit(1)


