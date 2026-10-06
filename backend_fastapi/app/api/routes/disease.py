import datetime
import logging
import time
from typing import List, Optional
from fastapi import APIRouter, Form, UploadFile, File, BackgroundTasks, status
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.services.validation_service import validate_disease_request, validate_pesticide_request
from app.services.gemini_service import gemini_service
from app.services.onnx_service import onnx_service
from app.services.pesticide_service import pesticide_service
from app.services.supabase_service import supabase_service

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/detect-disease")
@router.post("/webhook/detect-disease")
async def detect_disease(
    background_tasks: BackgroundTasks,
    crop: Optional[str] = Form(None),
    language: Optional[str] = Form("en"),
    scan_type: Optional[str] = Form("disease"),
    symptoms: Optional[str] = Form(None),
    latitude: Optional[float] = Form(None),
    longitude: Optional[float] = Form(None),
    state: Optional[str] = Form("South India"),
    images: List[UploadFile] = File(...)
):
    start_time = time.time()

    # Route pesticide scans if sent to detect-disease endpoint
    if scan_type == "pesticide":
        v_pest = await validate_pesticide_request(images=images, language=language, crop=crop)
        if not v_pest.is_valid:
            return JSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content={
                    "success": False,
                    "scan_type": "pesticide",
                    "errorCode": v_pest.error_code,
                    "message": v_pest.error_message,
                    "requestId": v_pest.data.get("requestId")
                }
            )
        data = v_pest.data
        parsed, model_used = await pesticide_service.scan_label(
            images=data["images"],
            language_name=data["requestedLanguage"],
            crop_context=data.get("crop")
        )
        latency_ms = int((time.time() - start_time) * 1000)
        req_id = data["requestId"]

        if not parsed:
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

        resp = {
            "requestId": req_id,
            "success": True,
            "scan_type": "pesticide",
            "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "images_analyzed": data["imageCount"],
            "model_provider": model_used or "Gemini Vision",
            "latency_ms": latency_ms,
            "result": {
                "identified": bool(parsed.get("identified", True)),
                "confidence": float(parsed.get("confidence", 0.0)),
                "unidentified_reason": parsed.get("unidentified_reason"),
                "product_name": parsed.get("product_name"),
                "active_ingredient": parsed.get("active_ingredient"),
                "formulation": parsed.get("formulation"),
                "category": parsed.get("category"),
                "manufacturer": parsed.get("manufacturer"),
                "cibrc_registered": bool(parsed.get("cibrc_registered", False)),
                "is_banned": bool(parsed.get("is_banned", False)),
                "what_it_is": parsed.get("what_it_is", ""),
                "general_use": parsed.get("general_use", ""),
                "why_farmers_use_it": parsed.get("why_farmers_use_it", ""),
                "target_pests": arr(parsed.get("target_pests", [])),
                "suitable_crops": arr(parsed.get("suitable_crops", [])),
                "safety_guidance": arr(parsed.get("safety_guidance", [])),
                "dosage_notice": parsed.get("dosage_notice", ""),
                "user_message": parsed.get("user_message", ""),
                "guidance": arr(parsed.get("guidance", [])),
                "crop_context": data.get("crop")
            }
        }
        return JSONResponse(status_code=status.HTTP_200_OK, content=resp)

    # 1. Validate disease request
    v_res = await validate_disease_request(
        crop=crop,
        images=images,
        language=language,
        symptoms=symptoms,
        latitude=latitude,
        longitude=longitude,
        state=state
    )

    if not v_res.is_valid:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={
                "success": False,
                "errorCode": v_res.error_code,
                "message": v_res.error_message,
                "requestId": v_res.data.get("requestId")
            }
        )

    val_data = v_res.data
    req_id = val_data["requestId"]
    crop_selected = val_data["crop"]
    crop_canonical = val_data["cropCanonicalId"]

    # 2. Try Gemini 3-tier sequential model failover
    gemini_data, model_used = await gemini_service.diagnose_crop(
        crop=crop_selected,
        images=val_data["images"],
        language_name=val_data["requestedLanguage"],
        language_code=val_data["language"],
        symptoms=val_data["symptoms"]
    )

    final_data = gemini_data
    provider = model_used

    # 3. Offline ONNX Fallback if Gemini fails or is unconfigured
    if not final_data and settings.ENABLE_LOCAL_ONNX_FALLBACK:
        if onnx_service.is_crop_supported(crop_canonical):
            logger.info(f"Using offline ONNX inference for {crop_canonical}")
            first_raw_bytes = val_data["images"][0]["raw_bytes"]
            onnx_result = onnx_service.infer(crop_canonical, first_raw_bytes)
            if onnx_result:
                final_data = onnx_result
                provider = onnx_result["model_name"]

    latency_ms = int((time.time() - start_time) * 1000)

    # 4. Controlled error if both online and offline models failed
    if not final_data:
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "success": False,
                "errorCode": "DIAGNOSIS_FAILED",
                "message": "Online diagnosis could not be completed.",
                "requestId": req_id
            }
        )

    # 5. Format envelope matching n8n Node 6
    conf_num = float(final_data.get("confidence", 0.0))
    health_status = final_data.get("health_status", "Uncertain")
    confidence_level = "High"

    if conf_num < 0.50:
        confidence_level = "Low"
        health_status = "Uncertain"
    elif conf_num < 0.75:
        confidence_level = "Medium"

    problem_type = final_data.get("problem_type") or (
        "HEALTHY" if health_status == "Healthy" else
        ("UNKNOWN" if health_status == "Uncertain" else "DISEASE")
    )

    as_array = lambda v: [x for x in v if isinstance(x, str) and x.strip()] if isinstance(v, list) else ([str(v)] if v else [])

    result_details = {
        "crop": final_data.get("crop") or crop_selected,
        "health_status": health_status,
        "disease": final_data.get("disease") or ("None" if health_status == "Healthy" else "Unknown"),
        "confidence": conf_num,
        "confidence_level": confidence_level,
        "severity": final_data.get("severity", "None"),
        "problem_type": problem_type,
        "symptoms": as_array(final_data.get("symptoms", [])),
        "recommendations": as_array(final_data.get("recommendations", [])),
        "prevention": as_array(final_data.get("prevention", [])),
        "regional_advice": final_data.get("regional_advice", ""),
        "user_message": final_data.get("user_message", ""),
        "location_context": {
            "state": val_data.get("state") or "South India",
            "latitude": val_data.get("latitude"),
            "longitude": val_data.get("longitude")
        }
    }

    response_payload = {
        "requestId": req_id,
        "success": True,
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "crop_selected": crop_selected,
        "images_analyzed": val_data["imageCount"],
        "model_provider": provider or "Gemini Vision",
        "latency_ms": latency_ms,
        "result": result_details
    }

    # Background Supabase Logging (non-blocking)
    if supabase_service.is_available:
        background_tasks.add_task(
            supabase_service.log_scan,
            request_id=req_id,
            scan_type="disease",
            result=result_details,
            image_urls=[],
            metadata={"crop": crop_selected, "provider": provider}
        )

    return JSONResponse(status_code=status.HTTP_200_OK, content=response_payload)
