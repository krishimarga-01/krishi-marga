import pytest
from app.services.crop_catalog import match_crop, resolve_language
from app.services.validation_service import generate_request_id

def test_crop_matching():
    # Canonical crops
    assert match_crop("tomato") == "tomato"
    assert match_crop("paddy") == "paddy"
    assert match_crop("cotton") == "cotton"
    
    # Aliases
    assert match_crop("rice") == "paddy"
    assert match_crop("corn") == "maize"
    assert match_crop("chili") == "chilli"
    assert match_crop("sweet potato") == "sweet_potato"
    
    # Unsupported
    assert match_crop("dragonfruit") is None
    assert match_crop("") is None

def test_language_resolution():
    assert resolve_language("en") == ("en", "English")
    assert resolve_language("kn") == ("kn", "Kannada")
    assert resolve_language("ta") == ("ta", "Tamil")
    assert resolve_language("te") == ("te", "Telugu")
    assert resolve_language("ml") == ("ml", "Malayalam")
    assert resolve_language("hi") == ("hi", "Hindi")
    assert resolve_language("unknown") == ("en", "English")

def test_request_id_format():
    req_id = generate_request_id("KRISHI")
    assert req_id.startswith("KRISHI-")
    parts = req_id.split("-")
    assert len(parts) == 3
    assert len(parts[1]) == 8  # YYYYMMDD
