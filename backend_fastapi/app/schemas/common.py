from typing import Optional
from pydantic import BaseModel, Field

class LocationContext(BaseModel):
    state: Optional[str] = "South India"
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class ErrorResponse(BaseModel):
    success: bool = False
    errorCode: str
    message: str
    requestId: Optional[str] = None
