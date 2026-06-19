import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

# Determine backend root folder to locate the .env file
backend_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
dotenv_path = os.path.join(backend_root, ".env")
load_dotenv(dotenv_path)

class Settings(BaseSettings):
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "llama-3.1-8b-instant"
    GROQ_BASE_URL: str = ""
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""

    class Config:
        case_sensitive = True

settings = Settings()
