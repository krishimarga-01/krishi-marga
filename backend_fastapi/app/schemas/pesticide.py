from typing import List, Optional
from pydantic import BaseModel, Field

class PesticideResultDetails(BaseModel):
    identified: bool
    confidence: float = 0.0
    unidentified_reason: Optional[str] = None
    product_name: Optional[str] = None
    active_ingredient: Optional[str] = None
    formulation: Optional[str] = None
    category: Optional[str] = None
    manufacturer: Optional[str] = None
    cibrc_registered: bool = False
    is_banned: bool = False
    what_it_is: str = ""
    general_use: str = ""
    why_farmers_use_it: str = ""
    target_pests: List[str] = Field(default_factory=list)
    suitable_crops: List[str] = Field(default_factory=list)
    safety_guidance: List[str] = Field(default_factory=list)
    dosage_notice: str = ""
    user_message: str = ""
    guidance: List[str] = Field(default_factory=list)
    crop_context: Optional[str] = None

class PesticideResponse(BaseModel):
    requestId: str
    success: bool = True
    scan_type: str = "pesticide"
    timestamp: str
    images_analyzed: int
    model_provider: str
    latency_ms: Optional[int] = None
    result: PesticideResultDetails

class PesticideErrorResponse(BaseModel):
    success: bool = False
    scan_type: str = "pesticide"
    errorCode: str
    message: str
    requestId: Optional[str] = None
