from fastapi import FastAPI, HTTPException, Body
import ollama
import os
import requests

from pydantic import BaseModel
from typing import List, Dist, Any, Optional

app = FastAPI(title="KI-Webanwendung API")

# Cors-Einstellungen, für die Anfragen vom Frontend
app.add_middleware(
	CORSMiddleware,
	allow_origins=["*"], # In Produktion einschränken
	allow_credentials=True,
	allow_methods=["*"],
	allow_headers=["*"],
)

#Ollama-Serveradresse (als Umgebungsvariable konfigurierbar)
OLLAMA_API = os.getenv("OLLAMA_API", "https://ollama:11434")
DEFAULT_MODEL = os.getenv("DEFAULT_MODEL", "mistral")

class Messages(BaseModel):
   role: str
   content: str

class ChatRequest(BaseModel):
   messages: List[Messages]
   model: Optional[str] = DEFAULT_MODEL
   stream: Optional[bool] = False

@app.get("/")
def read_root():
    return {"message": "KI-Webanwendung läuft!"}

@app.get("/models")@app.get("/models")
async def list_models():
    """Verfügbare Modelle von Ollama auflisten"""
    try:
        response = requests.get(f"{OLLAMA_API}/api/tags")
        if response.status_code == 200:
            models = response.json().get("models", [])
            return {"models": [model["name"] for model in models]}
        else:
            raise HTTPException(status_code=response.status_code, 
                               detail="Fehler beim Abrufen der Modelle")
    except Exception as e:
        raise HTTPException(status_code=500, 
                           detail=f"Verbindung zu Ollama fehlgeschlagen: {str(e)}")

@app.post("/chat")
async def chat(request: ChatRequest = Body(...)):
    """Chat-Anfrage an Ollama-Modell senden"""
    try:
        ollama_request = {
            "model": request.model,
            "messages": [{"role": msg.role, "content": msg.content} for msg in request.messages],
            "stream": request.stream
        }
        
        response = requests.post(
            f"{OLLAMA_API}/api/chat",
            json=ollama_request
        )
        
        if response.status_code == 200:
            return response.json()
        else:
            raise HTTPException(
                status_code=response.status_code,
                detail=f"Ollama-Fehler: {response.text}"
            )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Fehler bei der Kommunikation mit Ollama: {str(e)}"
        )
