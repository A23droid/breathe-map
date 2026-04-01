import json
import sys
import subprocess
from pathlib import Path

def test_inference():
    payload = {
        "trafficDensity": 50,
        "populationDensity": 50,
        "roadLength": 10,
        "temperature": 25,
        "humidity": 50,
        "timeOfDay": 12,
        "landUseType": "residential"
    }
    
    script_path = Path("d:/VS_Code/smart-cities/breathe-map/web/lib/ml/infer.py")
    
    process = subprocess.Popen(
        [sys.executable, str(script_path)],
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )
    
    stdout, stderr = process.communicate(input=json.dumps(payload))
    
    print(f"Status: {process.returncode}")
    print(f"Stdout: {stdout}")
    print(f"Stderr: {stderr}")

if __name__ == "__main__":
    test_inference()
