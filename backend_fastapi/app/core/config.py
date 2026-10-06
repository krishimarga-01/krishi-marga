import os
from pathlib import Path
from typing import List, Optional
from pydantic_settings import BaseSettings

# Resolve base directories
BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
PROJECT_ROOT = BACKEND_DIR.parent
DEFAULT_ONNX_DIR = PROJECT_ROOT / "models" / "onnx"

class Settings(BaseSettings):
    APP_NAME: str = "Krishi Marga AI Backend"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    # CORS
    CORS_ORIGINS: List[str] = ["*"]
    
    # Gemini AI configuration (matching n8n sequential 3-tier failover)
    GEMINI_API_KEY: Optional[str] = None
    GEMINI_API_KEY_BACKUP: Optional[str] = None
    GEMINI_MODEL_PRIMARY: str = "gemini-2.5-flash"  # standard fast model (or gemini-3.5-flash-lite)
    GEMINI_MODEL_FAILOVER_1: str = "gemini-2.5-flash"  # or gemini-3.6-flash
    GEMINI_MODEL_FAILOVER_2: str = "gemini-2.5-pro"  # or gemini-3.1-pro-preview
    
    # Supabase (optional, non-blocking fallback if unconfigured)
    SUPABASE_URL: Optional[str] = None
    SUPABASE_KEY: Optional[str] = None
    SUPABASE_STORAGE_BUCKET: str = "crop-scans"
    SUPABASE_TABLE_NAME: str = "scan_history"
    
    # ONNX configuration
    ONNX_MODELS_DIR: str = str(DEFAULT_ONNX_DIR)
    ENABLE_LOCAL_ONNX_FALLBACK: bool = True

    model_config = {
        "env_file": str(BACKEND_DIR / ".env"),
        "env_file_encoding": "utf-8",
        "extra": "ignore"
    }

settings = Settings()
