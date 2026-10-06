from fastapi import APIRouter
from app.core.config import settings
from app.services.onnx_service import onnx_service
from app.services.supabase_service import supabase_service

router = APIRouter()

@router.get("/health")
async def health_check():
    return {
        "status": "ok",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "gemini_configured": bool(settings.GEMINI_API_KEY or settings.GEMINI_API_KEY_BACKUP),
        "supabase_configured": supabase_service.is_available,
        "onnx_models_loaded": len(onnx_service.sessions),
        "onnx_crops": list(onnx_service.sessions.keys()),
    }
