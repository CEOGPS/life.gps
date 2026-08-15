from dotenv import load_dotenv
import os
load_dotenv()
keys = ['GROQ_API_KEY','OPENAI_API_KEY','ANTHROPIC_API_KEY','XAI_API_KEY','OPENROUTER_API_KEY','GROK_API_KEY']
for k in keys:
    print(f'{k}: {"SET" if os.getenv(k) else "MISSING"}')
print('CWD:', os.getcwd())
print('.env exists:', os.path.exists('.env'))
