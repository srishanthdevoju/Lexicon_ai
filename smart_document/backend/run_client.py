import httpx
import json

def test_json_analyze():
    url = "http://127.0.0.1:8000/analyze"
    headers = {"Content-Type": "application/json"}
    payload = {
        "input_type": "text",
        "content": (
            "This Mutual Non-Disclosure Agreement ('Agreement') is entered into by and between "
            "Company X, Inc. and Company Y, LLC on June 17, 2026. The parties wish to explore a business "
            "relationship and share proprietary secrets. Company Y agrees to indemnify Company X for any "
            "leaks of secret code, whereas Company X has no indemnity obligations under this contract. "
            "All disputes shall be governed by Delaware law."
        )
    }
    
    print(f"Sending analysis request to running FastAPI server at {url}...")
    try:
        response = httpx.post(url, headers=headers, json=payload, timeout=30.0)
        if response.status_code == 200:
            print("\nAnalysis Result (Success 200):\n")
            print(json.dumps(response.json(), indent=2))
        else:
            print(f"\nRequest failed with status code: {response.status_code}")
            print(response.text)
    except Exception as e:
        print(f"\nConnection failed. Please ensure the FastAPI server is running. Error: {str(e)}")

if __name__ == "__main__":
    test_json_analyze()
