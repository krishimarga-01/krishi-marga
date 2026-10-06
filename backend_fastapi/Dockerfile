# ==============================================================================
# KRISHI MARGA — FASTAPI BACKEND PRODUCTION DOCKERFILE
#
# Recommended Build Command (run from repository root):
#   docker build -t krishi-marga-backend -f backend_fastapi/Dockerfile .
#
# Run Command:
#   docker run -p 8000:8000 --env-file backend_fastapi/.env krishi-marga-backend
# ==============================================================================
FROM python:3.11-slim

# Prevent Python from writing .pyc and enable unbuffered output
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app \
    ONNX_MODELS_DIR=/app/models/onnx

WORKDIR /app

# Install system dependencies for Pillow/ONNX and healthcheck
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY backend_fastapi/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source code
COPY backend_fastapi/app/ ./app/

# Copy ONNX models for offline edge fallback
COPY models/ ./models/

# Expose standard port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Production startup using Uvicorn with standard workers
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2", "--timeout-keep-alive", "65"]
