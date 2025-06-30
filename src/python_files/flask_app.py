from flask import Flask, request
import subprocess
import sys
import json
import os

app = Flask(__name__)

@app.route('/python/question_code_exp', methods=['POST'])
@app.route('/question_code_exp', methods=['POST'])
def question_code_exp():
    data = request.get_json()
    print("[FLASK] Received data:", data)
    script_path = os.path.join(os.path.dirname(__file__), 'question_code_exp.py')
    print("[FLASK] Running subprocess:", sys.executable, script_path)
    process = subprocess.Popen(
        [sys.executable, script_path],
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )
    stdout, stderr = process.communicate(json.dumps(data))
    exit_code = process.returncode
    print("[FLASK] Subprocess exit code:", exit_code)
    print("[FLASK] STDOUT:", stdout)
    print("[FLASK] STDERR:", stderr)
    result = stdout.strip()
    # Interpret result: 0 = correct, 1 = incorrect
    if result == "0":
        result_meaning = "correct"
    elif result == "1":
        result_meaning = "incorrect"
    else:
        result_meaning = "unknown"
    # Return all debug info for now
    return json.dumps({
        "result": result,
        "result_meaning": result_meaning,
        "stderr": stderr.strip(),
        "exit_code": exit_code,
        "input": data
    })

@app.route('/python/eval_second_exp_acc', methods=['POST'])
@app.route('/eval_second_exp_acc', methods=['POST'])
def eval_second_exp_acc():
    # Dummy implementation for endpoint
    return json.dumps({"result": "1", "status": "ok", "message": "eval_second_exp_acc endpoint active"})

@app.route('/', methods=['GET'])
def index():
    return "Flask backend is running."

if __name__ == '__main__':
    app.run(port=5000)
