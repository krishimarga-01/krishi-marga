from typing import List, Optional
from pydantic import BaseModel, Field
from app.schemas.common import LocationContext

class DiagnosisResultDetails(BaseModel):
    crop: str
    health_status: str  # "Healthy", "Diseased", "Uncertain"
    disease: str
    confidence: float
    confidence_level: str  # "High", "Medium", "Low"
    severity: str = "None"
    problem_type: str = "DISEASE"  # "HEALTHY", "DISEASE", "PEST", "NUTRIENT_DEFICIENCY", "UNKNOWN"
    symptoms: List[str] = Field(default_factory=list)
    recommendations: List[str] = Field(default_factory=list)
    prevention: List[str] = Field(default_factory=list)
    regional_advice: Optional[str] = ""
    user_message: Optional[str] = ""
    location_context: Optional[LocationContext] = None

class DiagnosisResponse(BaseModel):
    requestId: str
    success: bool = True
    timestamp: str
    crop_selected: str
    images_analyzed: int
    model_provider: str
    latency_ms: Optional[int] = None
    result: DiagnosisResultDetails
