import logging
from typing import Any, Dict, List, Optional
from app.core.config import settings

logger = logging.getLogger(__name__)

class SupabaseService:
    def __init__(self):
        self.is_available = False
        self.client = None
        self._init_client()

    def _init_client(self):
        if settings.SUPABASE_URL and settings.SUPABASE_KEY:
            try:
                from supabase import create_client, Client
                self.client: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
                self.is_available = True
                logger.info("Supabase client successfully initialized.")
            except Exception as e:
                logger.warning(f"Failed to initialize Supabase client: {e}")
                self.is_available = False
        else:
            logger.info("Supabase credentials not configured. Running in cloudless / local-only persistence mode.")

    async def upload_image(self, request_id: str, image_bytes: bytes, filename: str, mime_type: str = "image/jpeg") -> Optional[str]:
        if not self.is_available or not self.client:
            return None

        storage_path = f"{request_id}/{filename}"
        try:
            res = self.client.storage.from_(settings.SUPABASE_STORAGE_BUCKET).upload(
                path=storage_path,
                file=image_bytes,
                file_options={"content-type": mime_type}
            )
            # Retrieve public URL
            public_url = self.client.storage.from_(settings.SUPABASE_STORAGE_BUCKET).get_public_url(storage_path)
            return public_url
        except Exception as e:
            logger.warning(f"Failed to upload image {filename} to Supabase: {e}")
            return None

    async def log_scan(
        self,
        request_id: str,
        scan_type: str,
        result: Dict[str, Any],
        image_urls: List[str],
        metadata: Optional[Dict[str, Any]] = None
    ) -> bool:
        if not self.is_available or not self.client:
            return False

        payload = {
            "request_id": request_id,
            "scan_type": scan_type,
            "result": result,
            "image_urls": image_urls,
            "metadata": metadata or {},
        }

        try:
            self.client.table(settings.SUPABASE_TABLE_NAME).insert(payload).execute()
            logger.info(f"Logged scan {request_id} ({scan_type}) to Supabase.")
            return True
        except Exception as e:
            logger.warning(f"Failed to log scan {request_id} to Supabase table {settings.SUPABASE_TABLE_NAME}: {e}")
            return False

supabase_service = SupabaseService()
