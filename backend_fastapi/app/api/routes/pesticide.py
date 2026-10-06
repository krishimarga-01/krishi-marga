import datetime
import logging
import time
from typing import List, Optional
from fastapi import APIRouter, Form, UploadFile, File, BackgroundTasks, status
from fastapi.responses import JSONResponse
from app.services.validation_service import validate_pesticide_request
from app.services.pesticide_service import pesticide_service
from app.services.supabase_service import supabase_service

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/scan-pesticide")
@router.post("/webhook/scan-pesticide")
async def scan_pesticide(
    background_tasks: BackgroundTasks,
    crop: Optional[str] = Form(None),
    language: Optional[str] = Form("en"),
    scan_type: Optional[str] = Form("pesticide"),
    images: List[UploadFile] = File(...)
):
    start_time = time.time()

    # 1. Validate pesticide request
    v_res = await validate_pesticide_request(images=images, language=language, crop=crop)
    if not v_res.is_valid:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={
                "success": False,
                "scan_type": "pesticide",
                "errorCode": v_res.error_code,
                "message": v_res.error_message,
                "requestId": v_res.data.get("requestId")
            }
        )

    val_data = v_res.data
    req_id = val_data["requestId"]

    # 2. Call Gemini label vision
    parsed_data, model_used = await pesticide_service.scan_label(
        images=val_data["images"],
        language_name=val_data["requestedLanguage"],
        crop_context=val_data.get("crop")
    )

    latency_ms = int((time.time() - start_time) * 1000)

    # 3. Controlled failure if model failed
    if not parsed_data:
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "requestId": req_id,
                "success": False,
                "scan_type": "pesticide",
                "errorCode": "LABEL_SCAN_FAILED",
                "message": "The pesticide label could not be analysed. Please retake the photo in good light."
            }
        )

    arr = lambda v: [x for x in v if isinstance(x, str) and x.strip()] if isinstance(v, list) else []

    result_details = {
        "identified": bool(parsed_data.get("identified", True)),
        "confidence": float(parsed_data.get("confidence", 0.0)),
        "unidentified_reason": parsed_data.get("unidentified_reason"),
        "product_name": parsed_data.get("product_name"),
        "active_ingredient": parsed_data.get("active_ingredient"),
        "formulation": parsed_data.get("formulation"),
        "category": parsed_data.get("category"),
        "manufacturer": parsed_data.get("manufacturer"),
        "cibrc_registered": bool(parsed_data.get("cibrc_registered", False)),
        "is_banned": bool(parsed_data.get("is_banned", False)),
        "what_it_is": parsed_data.get("what_it_is", ""),
        "general_use": parsed_data.get("general_use", ""),
        "why_farmers_use_it": parsed_data.get("why_farmers_use_it", ""),
        "target_pests": arr(parsed_data.get("target_pests", [])),
        "suitable_crops": arr(parsed_data.get("suitable_crops", [])),
        "safety_guidance": arr(parsed_data.get("safety_guidance", [])),
        "dosage_notice": parsed_data.get("dosage_notice", ""),
        "user_message": parsed_data.get("user_message", ""),
        "guidance": arr(parsed_data.get("guidance", [])),
        "crop_context": val_data.get("crop")
    }

    response_payload = {
        "requestId": req_id,
        "success": True,
        "scan_type": "pesticide",
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "images_analyzed": val_data["imageCount"],
        "model_provider": model_used or "Gemini Vision",
        "latency_ms": latency_ms,
        "result": result_details
    }

    # Background Supabase Logging (non-blocking)
    if supabase_service.is_available:
        background_tasks.add_task(
            supabase_service.log_scan,
            request_id=req_id,
            scan_type="pesticide",
            result=result_details,
            image_urls=[],
            metadata={"crop_context": val_data.get("crop"), "provider": model_used}
        )

    return JSONResponse(status_code=status.HTTP_200_OK, content=response_payload)
