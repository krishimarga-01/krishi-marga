from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.routes import health, disease, pesticide

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Krishi Marga Parallel FastAPI Backend reproducing n8n AI inference workflows."
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from fastapi import Request
from fastapi.responses import JSONResponse

@app.middleware("http")
async def ping_middleware(request: Request, call_next):
    if request.method == "POST" and request.url.path in [
        "/webhook/detect-disease",
        "/detect-disease",
        "/webhook/scan-pesticide",
        "/scan-pesticide",
    ]:
        content_type = request.headers.get("content-type", "")
        if "application/json" in content_type:
            try:
                body = await request.json()
                if body.get("ping") is True:
                    return JSONResponse(
                        status_code=200,
                        content={"status": "ok", "ping": "pong", "server": "FastAPI"}
                    )
            except Exception:
                pass
    return await call_next(request)

app.include_router(health.router, tags=["Health"])
app.include_router(disease.router, tags=["Crop Disease Diagnosis"])
app.include_router(pesticide.router, tags=["Pesticide Label Scan"])

@app.get("/")
async def root():
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running",
        "endpoints": {
            "health": "/health",
            "detect_disease": "/webhook/detect-disease",
            "scan_pesticide": "/webhook/scan-pesticide"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG)
