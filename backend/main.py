from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from langchain.agents import create_agent
from langchain_ollama import ChatOllama
from langchain.tools import tool
from langchain_community.tools import DuckDuckGoSearchRun
from langgraph.checkpoint.memory import InMemorySaver

app = FastAPI(title="LifeOS Agent API")

# CORS for your React app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Setup the agent
model = ChatOllama(model="qwen2.5-coder:latest", temperature=0.7)
search = DuckDuckGoSearchRun()

@tool
def word_count(text: str) -> int:
    """Count how many words are in a piece of text."""
    return len(text.split())

agent = create_agent(
    model=model,
    tools=[search, word_count],
    system_prompt="You are a helpful assistant. Use your tools when needed.",
    checkpointer=InMemorySaver(),
)

class ChatRequest(BaseModel):
    message: str
    thread_id: str = "default"

class ChatResponse(BaseModel):
    response: str
    thread_id: str

@app.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    try:
        config = {"configurable": {"thread_id": request.thread_id}}
        result = agent.invoke(
            {"messages": [{"role": "user", "content": request.message}]},
            config,
        )
        return ChatResponse(
            response=result["messages"][-1].content,
            thread_id=request.thread_id
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/health")
async def health():
    return {"status": "healthy", "model": "qwen2.5-coder"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)