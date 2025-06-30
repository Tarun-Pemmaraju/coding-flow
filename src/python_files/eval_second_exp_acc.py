from google.generativeai import configure, GenerativeModel
import sys

def evaluate_second_explanation_accuracy(question, first_code, first_explanation, second_code, second_explanation):
    print("[EVAL] Configuring Gemini API key...", file=sys.stderr)
    configure(api_key="AIzaSyDECepsSL7KcBMs0ENJyZ3VhMUb5Io_tHU")

    prompt = f"""Question: {{{question}}}
First Code: {{{first_code}}}
First Explanation: {{{first_explanation}}}
Second Code: {{{second_code}}}
Second Explanation: {{{second_explanation}}}
Objective:
Evaluate the provided First Code and Second Code and their explanation. If the Second Explanation correctly describes the changes in the logic of the code, return 1. Otherwise, return 0.
Note: The output should only be the number 1 or 0 without any additional text.
##OUTPUT FORMAT##:
1 or 0"""

    print("[EVAL] Prompt to Gemini:\n", prompt, file=sys.stderr)
    model = GenerativeModel("gemini-1.5-flash-latest")
    response = model.generate_content(prompt)
    print("[EVAL] Gemini raw response:", response, file=sys.stderr)

    reply = response.text.strip()
    print("[EVAL] Gemini reply (stripped):", reply, file=sys.stderr)

    if reply == "1":
        print("[EVAL] Explanation correct (1)", file=sys.stderr)
        return 1
    else:
        print("[EVAL] Explanation incorrect (0)", file=sys.stderr)
        return 0

if __name__ == "__main__":
    import json
    import os

    # If run as a script, accept JSON input via stdin or as arguments
    if len(sys.argv) > 4:
        print("[EVAL] Running with command-line arguments", file=sys.stderr)
        # Arguments: question, first_code, first_explanation, second_code, second_explanation
        question = sys.argv[1]
        first_code = sys.argv[2]
        first_explanation = sys.argv[3]
        second_code = sys.argv[4]
        second_explanation = sys.argv[5]
        print("[EVAL] Args:", question, first_code, first_explanation, second_code, second_explanation, file=sys.stderr)
        result = evaluate_second_explanation_accuracy(question, first_code, first_explanation, second_code, second_explanation)
        print(str(result))
        sys.exit(result)
    else:
        try:
            print("[EVAL] Reading JSON from stdin...", file=sys.stderr)
            data = json.load(sys.stdin)
            print("[EVAL] Input JSON:", data, file=sys.stderr)
            question = data.get("question", "")
            first_code = data.get("first_code", "")
            first_explanation = data.get("first_explanation", "")
            second_code = data.get("second_code", "")
            second_explanation = data.get("second_explanation", "")
            result = evaluate_second_explanation_accuracy(question, first_code, first_explanation, second_code, second_explanation)
            print(str(result))
            sys.exit(result)
        except Exception as e:
            print("[EVAL] Exception:", e, file=sys.stderr)
            print("0")
            sys.exit(0)
