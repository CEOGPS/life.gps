
import requests
import os

keys = {'OpenAI': '***', 'Groq': '***', 'Anthropic': '***', 'xAI': '***', 'Gemini': '***', 'Supabase_URL': 'https://mhvcdstgkyplhzjptgfr.supabase.co', 'Supabase_Key': 'eyJhbG...GJCs', 'ClickUp': 'pk_204...WE1E'}

results = {}

def test_openai():
    if not keys['OpenAI']: return "Missing Key"
    try:
        resp = requests.post("https://api.openai.com/v1/chat/completions", 
                             headers={"Authorization": f"Bearer {keys['OpenAI']}", "Content-Type": "application/json"},
                             json={"model": "gpt-4o-mini", "messages": [{ "role": "user", "content": "hi" }], "max_tokens": 1},
                             timeout=5)
        return "OK" if resp.status_code == 200 else f"Error {resp.status_code}: {resp.text}"
    except Exception as e: return str(e)

def test_groq():
    if not keys['Groq']: return "Missing Key"
    try:
        resp = requests.post("https://api.groq.com/openai/v1/chat/completions", 
                             headers={"Authorization": f"Bearer {keys['Groq']}", "Content-Type": "application/json"},
                             json={"model": "llama3-8b-8192", "messages": [{ "role": "user", "content": "hi" }], "max_tokens": 1},
                             timeout=5)
        return "OK" if resp.status_code == 200 else f"Error {resp.status_code}: {resp.text}"
    except Exception as e: return str(e)

def test_anthropic():
    if not keys['Anthropic']: return "Missing Key"
    try:
        resp = requests.post("https://api.anthropic.com/v1/messages", 
                             headers={"x-api-key": keys['Anthropic'], "anthropic-version": "2023-06-01", "Content-Type": "application/json"},
                             json={"model": "claude-3-haiku-20240307", "max_tokens": 1, "messages": [{ "role": "user", "content": "hi" }]},
                             timeout=5)
        return "OK" if resp.status_code == 200 else f"Error {resp.status_code}: {resp.text}"
    except Exception as e: return str(e)

def test_xai():
    if not keys['xAI']: return "Missing Key"
    try:
        resp = requests.post("https://api.x.ai/v1/chat/completions", 
                             headers={"Authorization": f"Bearer {keys['xAI']}", "Content-Type": "application/json"},
                             json={"model": "grok-beta", "messages": [{ "role": "user", "content": "hi" }], "max_tokens": 1},
                             timeout=5)
        return "OK" if resp.status_code == 200 else f"Error {resp.status_code}: {resp.text}"
    except Exception as e: return str(e)

def test_gemini():
    if not keys['Gemini']: return "Missing Key"
    try:
        # Simplified check: using the API key in the URL
        resp = requests.get(f"https://generativelanguage.googleapis.com/v1beta/models?key={keys['Gemini']}", timeout=5)
        return "OK" if resp.status_code == 200 else f"Error {resp.status_code}: {resp.text}"
    except Exception as e: return str(e)

def test_supabase():
    if not keys['Supabase_URL'] or not keys['Supabase_Key']: return "Missing Config"
    try:
        # Try to list tables in the 'user_data' table or just hit the root
        resp = requests.get(f"{keys['Supabase_URL']}/rest/v1/user_data?select=*", 
                            headers={"apikey": keys['Supabase_Key'], "Authorization": f"Bearer {keys['Supabase_Key']}"},
                            params={"limit": 1},
                            timeout=5)
        return "OK" if resp.status_code in [200, 401] else f"Error {resp.status_code}: {resp.text}"
    except Exception as e: return str(e)

def test_clickup():
    if not keys['ClickUp']: return "Missing Key"
    try:
        resp = requests.get("https://api.clickup.com/api/v2/team", 
                            headers={"Authorization": keys['ClickUp']},
                            timeout=5)
        return "OK" if resp.status_code == 200 else f"Error {resp.status_code}: {resp.text}"
    except Exception as e: return str(e)

results['OpenAI'] = test_openai()
results['Groq'] = test_groq()
results['Anthropic'] = test_anthropic()
results['xAI'] = test_xai()
results['Gemini'] = test_gemini()
results['Supabase'] = test_supabase()
results['ClickUp'] = test_clickup()

print(results)
