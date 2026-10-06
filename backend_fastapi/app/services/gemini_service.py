import json
import logging
import re
import time
from typing import Any, Dict, List, Optional, Tuple
import httpx
from app.core.config import settings

logger = logging.getLogger(__name__)

GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models"

def build_disease_prompt(crop: str, image_count: int, language_name: str, language_code: str, symptoms: Optional[str] = None) -> str:
    symptom_clause = f"- Farmer Stated Symptoms: \"{symptoms}\"\n" if symptoms else ""
    return f"""Expert Plant Pathologist and Agronomist AI for Indian agriculture.
You are diagnosing a {crop.upper()} plant.
Analyze only the uploaded {crop} plant images.
Consider diseases, pests and visible nutrient-related symptoms relevant to {crop}.
Do not diagnose a disease belonging to another crop.

CASE CONTEXT:
- Selected Crop: "{crop}"
- Images Provided: {image_count}
{symptom_clause}- Target Response Language: {language_name} (Language Code: {language_code})

CRITICAL DIAGNOSIS RULES:
1. WRONG CROP PROTECTION (MANDATORY):
- Carefully verify if the uploaded plant image actually matches {crop}.
- If the image clearly depicts a DIFFERENT crop (for example, tomato when coffee was selected, or chilli when banana was selected, or non-plant objects):
  * Do NOT diagnose another crop's disease on {crop}!
  * Set: health_status = "Uncertain", disease = "Unknown", confidence = 0.20, problem_type = "UNKNOWN"
  * In user_message ({language_name}): State clearly: "The image does not appear to match the selected crop ({crop}). Please upload a clear {crop} plant image."

2. BLURRY / LOW-QUALITY / NON-PLANT / INSUFFICIENT EVIDENCE:
- If photos are blurry, too dark, out of focus, or lack clear symptoms:
  * Do NOT fabricate a diagnosis or pretend certainty.
  * Set: health_status = "Uncertain", disease = "Unknown", confidence = 0.25, problem_type = "UNKNOWN"
  * In user_message ({language_name}): Advise the farmer to take a closer, clearer photo in good daylight.

3. HEALTHY PLANTS:
- If the {crop} foliage and plant parts show normal green color, intact tissue, and no signs of pest or pathogen:
  * Set: health_status = "Healthy", disease = "None", confidence = 0.95, severity = "None", problem_type = "HEALTHY"
  * In recommendations and user_message ({language_name}): Provide maintenance care and fertilization advice for healthy {crop}.

4. PROBLEM IDENTIFICATION (DISEASE, PEST, OR NUTRIENT DEFICIENCY):
- Identify the problem accurately:
  * problem_type: MUST be one of ["DISEASE", "PEST", "NUTRIENT_DEFICIENCY", "HEALTHY", "UNKNOWN"]
  * disease: The specific disease, pest, or nutrient deficiency name in {language_name}
  * confidence: Realistic score between 0.50 and 0.98 based on visible evidence
  * severity: "Mild" | "Moderate" | "Severe" | "None"
  * symptoms: Array of observed visual symptoms in {language_name}
  * recommendations: Practical actionable agronomic steps in {language_name}
  * prevention: Practical prevention and cultural steps in {language_name}
  * regional_advice: Practical advice for South Indian farmers in {language_name}
  * user_message: Direct message to the farmer in {language_name}

5. PESTICIDE & CHEMICAL SAFETY (STRICT):
- Never invent a disease, pesticide brand, active ingredient, or unverified chemical dosage.
- If verified chemical dosage is unavailable, advise consulting the local agricultural extension officer or Krishi Vigyan Kendra (KVK).
- Prioritize integrated pest management (IPM), cultural sanitation, and approved biocontrol methods (Trichoderma, Pseudomonas, Neem).

MANDATORY OUTPUT REQUIREMENT:
Return ONLY valid JSON with keys in English and natural language values in {language_name}:
{{
  "crop": "{crop}",
  "health_status": "Healthy",
  "disease": "None",
  "confidence": 0.95,
  "severity": "None",
  "problem_type": "HEALTHY",
  "symptoms": ["..."],
  "recommendations": ["..."],
  "prevention": ["..."],
  "regional_advice": "...",
  "user_message": "..."
}}"""

class GeminiService:
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY or settings.GEMINI_API_KEY_BACKUP
        self.models = [
            (settings.GEMINI_MODEL_PRIMARY, 15.0),
            (settings.GEMINI_MODEL_FAILOVER_1, 15.0),
            (settings.GEMINI_MODEL_FAILOVER_2, 12.0),
        ]

    def _clean_json_text(self, text: str) -> str:
        text = text.strip()
        text = re.sub(r"^```(?:json)?\s*", "", text, flags=re.IGNORECASE)
        text = re.sub(r"\s*```$", "", text)
        return text.strip()

    def _parse_and_validate_diagnosis(self, raw_text: str) -> Optional[Dict[str, Any]]:
        try:
            cleaned = self._clean_json_text(raw_text)
            data = json.loads(cleaned)
            if not isinstance(data, dict):
                return None
            if not data.get("crop") or not data.get("health_status") or data.get("confidence") is None:
                return None
            try:
                conf = float(data.get("confidence", 0.0))
            except (ValueError, TypeError):
                conf = 0.0
            data["confidence"] = max(0.0, min(1.0, conf))
            return data
        except Exception as e:
            logger.warning(f"Error parsing Gemini JSON: {e}")
            return None

    async def _call_gemini_model(
        self, client: httpx.AsyncClient, model_name: str, payload: dict, timeout_sec: float
    ) -> Optional[str]:
        if not self.api_key:
            logger.warning("No GEMINI_API_KEY configured.")
            return None

        url = f"{GEMINI_BASE_URL}/{model_name}:generateContent"
        headers = {
            "Content-Type": "application/json",
            "x-goog-api-key": self.api_key,
        }

        try:
            resp = await client.post(url, json=payload, headers=headers, timeout=timeout_sec)
            if resp.status_code != 200:
                logger.warning(f"Gemini API returned status {resp.status_code}: {resp.text[:200]}")
                return None
            res_json = resp.json()
            candidates = res_json.get("candidates", [])
            if candidates and candidates[0].get("content", {}).get("parts"):
                return candidates[0]["content"]["parts"][0].get("text")
            return None
        except httpx.TimeoutException:
            logger.warning(f"Gemini model {model_name} timed out after {timeout_sec}s.")
            return None
        except Exception as e:
            logger.warning(f"Gemini call to {model_name} failed: {e}")
            return None

    async def diagnose_crop(
        self,
        crop: str,
        images: List[Dict[str, Any]],
        language_name: str,
        language_code: str,
        symptoms: Optional[str] = None
    ) -> Tuple[Optional[Dict[str, Any]], Optional[str]]:
        prompt = build_disease_prompt(crop, len(images), language_name, language_code, symptoms)
        
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

        async with httpx.AsyncClient() as client:
            for model_name, timeout_sec in self.models:
                logger.info(f"Attempting diagnosis with model: {model_name} (timeout={timeout_sec}s)")
                raw_text = await self._call_gemini_model(client, model_name, payload, timeout_sec)
                if raw_text:
                    parsed = self._parse_and_validate_diagnosis(raw_text)
                    if parsed:
                        logger.info(f"Diagnosis succeeded with model: {model_name}")
                        return parsed, model_name

        logger.error("All Gemini failover models exhausted or unusable.")
        return None, None

gemini_service = GeminiService()
