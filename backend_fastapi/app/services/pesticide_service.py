import json
import logging
import re
from typing import Any, Dict, List, Optional, Tuple
import httpx
from app.core.config import settings

logger = logging.getLogger(__name__)

GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models"

def build_pesticide_prompt(crop_context: Optional[str], language_name: str) -> str:
    crop_clause = f"The farmer intends to use this on: {crop_context}. Only comment on suitability if the label lists crops." if crop_context else ""
    return f"""You are an agricultural input label reader for Indian farmers.
Read ONLY what is actually printed on the pesticide/agro-chemical label in the photographs.

STRICT RULES:
1. Do NOT invent a product name, active ingredient, manufacturer, registration status, dosage, or safety instruction. If something is not legible on the label, leave that field null or an empty array.
2. Do NOT state a dosage unless the number and unit are clearly printed on the label. Otherwise leave dosage_notice empty and the app will tell the farmer to read the printed label.
3. If the photo is blurry, cropped, glared, or is not an agro-chemical label, set identified = false and explain why in unidentified_reason.
4. Safety guidance must be taken from the label text (or standard pictograms shown on it). Never generalise from memory of a similar product.
5. Report banned status only if the label or the printed CIBRC registration clearly indicates it; otherwise set is_banned to false and cibrc_registered to whether a registration number is visible.

{crop_clause}
Write natural-language values in {language_name}. Keep JSON keys in English.

Return ONLY valid JSON:
{{
  "identified": true,
  "confidence": 0.0,
  "unidentified_reason": null,
  "product_name": null,
  "active_ingredient": null,
  "formulation": null,
  "category": null,
  "manufacturer": null,
  "cibrc_registered": false,
  "is_banned": false,
  "what_it_is": "",
  "general_use": "",
  "why_farmers_use_it": "",
  "target_pests": [],
  "suitable_crops": [],
  "safety_guidance": [],
  "dosage_notice": "",
  "user_message": "",
  "guidance": []
}}"""

class PesticideService:
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY or settings.GEMINI_API_KEY_BACKUP
        self.model_name = settings.GEMINI_MODEL_PRIMARY
        self.timeout_sec = 20.0

    def _clean_json_text(self, text: str) -> str:
        text = text.strip()
        text = re.sub(r"^```(?:json)?\s*", "", text, flags=re.IGNORECASE)
        text = re.sub(r"\s*```$", "", text)
        return text.strip()

    def _parse_and_validate_pesticide(self, raw_text: str) -> Optional[Dict[str, Any]]:
        try:
            cleaned = self._clean_json_text(raw_text)
            data = json.loads(cleaned)
            if not isinstance(data, dict):
                return None
            if "identified" not in data:
                return None
            try:
                conf = float(data.get("confidence", 0.0))
            except (ValueError, TypeError):
                conf = 0.0
            data["confidence"] = max(0.0, min(1.0, conf))
            return data
        except Exception as e:
            logger.warning(f"Error parsing Pesticide Gemini JSON: {e}")
            return None

    async def scan_label(
        self,
        images: List[Dict[str, Any]],
        language_name: str,
        crop_context: Optional[str] = None
    ) -> Tuple[Optional[Dict[str, Any]], Optional[str]]:
        if not self.api_key:
            logger.warning("No GEMINI_API_KEY configured for pesticide scan.")
            return None, None

        prompt = build_pesticide_prompt(crop_context, language_name)
        image_parts = [
            {"inlineData": {"mimeType": img.get("mimeType", "image/jpeg"), "data": img["data"]}}
            for img in images
        ]

        payload = {
            "contents": [
                {
                    "parts": [
                        {"text": prompt},
                        *image_parts
                    ]
                }
            ],
            "generationConfig": {
                "responseMimeType": "application/json",
                "temperature": 0.0,
                "seed": 42
            }
        }

        url = f"{GEMINI_BASE_URL}/{self.model_name}:generateContent"
        headers = {
            "Content-Type": "application/json",
            "x-goog-api-key": self.api_key,
        }

        async with httpx.AsyncClient() as client:
            try:
                resp = await client.post(url, json=payload, headers=headers, timeout=self.timeout_sec)
                if resp.status_code != 200:
                    logger.warning(f"Gemini pesticide scan failed with status {resp.status_code}")
                    return None, None
                res_json = resp.json()
                candidates = res_json.get("candidates", [])
                if candidates and candidates[0].get("content", {}).get("parts"):
                    raw_text = candidates[0]["content"]["parts"][0].get("text")
                    parsed = self._parse_and_validate_pesticide(raw_text)
                    if parsed:
                        return parsed, self.model_name
                return None, None
            except Exception as e:
                logger.warning(f"Pesticide label scan request failed: {e}")
                return None, None

pesticide_service = PesticideService()
