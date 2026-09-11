# KRISHI MARGA — NEARBY DISEASE & PEST ALERT DATA MODEL
**Document Version**: 1.0.0  
**Date**: 2026-09-11  
**Author**: KRISHI MARGA Agricultural Systems Architecture Team  
**Scope**: Privacy-Preserving Geostatistical Crop Health Outbreak Surveillance for South India

---

## 1. Executive Overview & Ethical Mandate

The **Nearby Crop Health Alert System** is engineered to provide South Indian smallholders with proactive, localized intelligence regarding verified pest and disease pressures in their immediate agricultural zone. 

### Zero-Fabrication & Strict Verification Rules
> [!IMPORTANT]
> 1. **No Synthetic Outbreaks**: Under no circumstances will KRISHI MARGA simulate, extrapolate, or fabricate disease spread maps, farmer reports, or outbreak clusters.
> 2. **Verification Barrier**: Unconfirmed, raw single-photo mobile uploads from individual farmers will **never** trigger public alerts. Only reports verified through:
>    - (a) High-confidence multi-image concordance (>0.90) from multiple independent farms, OR
>    - (b) Manual triage verification by an accredited KVK/University Crop Doctor, OR
>    - (c) Official state Department of Agriculture / ICAR pest surveillance bulletins (e.g., CROPSAP / e-Pest surveillance)
>    are permitted to enter the public spatial alert stream.
> 3. **Privacy by Design**: Under Section 16 of the KRISHI MARGA Data Governance Protocol, an individual farmer's exact field coordinates, phone number, name, and field imagery are **strictly protected** and never exposed publicly.

---

## 2. Privacy-Preserving Geospatial Architecture

To protect farmer identity and prevent predatory commercial targeting or land devaluation, KRISHI MARGA implements **Spatial K-Anonymity and Hexagonal Grid Aggregation (Uber H3)**.

```
+-------------------------------------------------------------------------+
|                  FARMER MOBILE DEVICE (Private Space)                   |
|  - GPS Fix: 12.9715987, 77.5945627 (Exact High-Precision Location)      |
|  - Farmer Phone: +91 98450 XXXXX                                        |
|  - Raw Leaf Photo & Timestamp                                           |
+-------------------------------------------------------------------------+
                                    │
               TLS 1.3 Secure Ephemeral Ingestion
                                    ▼
+-------------------------------------------------------------------------+
|              INGESTION FILTER & OBFUSCATION LAYER                       |
|  1. Coordinate Fuzzing: Apply Gaussian Perturbation (±1.5 km)           |
|  2. Spatial Indexing: Compute H3 Hexagon Resolution 7 (Area ~5.16 km²)   |
|  3. PII Stripping: Delete phone, device ID, IP address                  |
|  4. Hash Generator: Generate cryptographic pseudo-ID                    |
+-------------------------------------------------------------------------+
                                    │
                        Clustering & Threshold Engine
                                    ▼
+-------------------------------------------------------------------------+
|                  PUBLIC ALERT STREAM (Anonymized)                       |
|  - Region: "Mandya District - Maddur Taluk (Zone H3:876189280ffffff)"   |
|  - Advisory: "Yellow Stem Borer active in 3+ verified paddy clusters"   |
|  - Recommended Action: "Inspect boot leaf, install pheromone traps"     |
+-------------------------------------------------------------------------+
```

---

## 3. Verified Outbreak Report Schema

The authoritative relational database schema for storing verified epidemiological records:

```sql
CREATE TABLE verified_crop_alerts (
    report_id VARCHAR(64) PRIMARY KEY,               -- Unique UUIDv4 or deterministic SHA-256
    crop VARCHAR(64) NOT NULL,                       -- Restricted to 17 KRISHI MARGA crops
    condition_type VARCHAR(32) NOT NULL,             -- 'DISEASE' | 'PEST' | 'PHYSIOLOGICAL'
    disease_or_pest VARCHAR(128) NOT NULL,           -- Canonical scientific / common name
    pathogen_or_pest_species VARCHAR(128),           -- Latin binomial (e.g., 'Magnaporthe oryzae')
    diagnosis_confidence DECIMAL(4,3) NOT NULL,      -- Model confidence (0.000 to 1.000)
    confidence_level VARCHAR(16) NOT NULL,           -- 'HIGH' | 'MEDIUM' | 'VERIFIED_EXPERT'
    
    -- Geospatial Privacy Preserving Fields
    obfuscated_latitude DECIMAL(8,5) NOT NULL,       -- Centroid of H3 cell (not farmer field)
    obfuscated_longitude DECIMAL(8,5) NOT NULL,      -- Centroid of H3 cell
    h3_index_res7 VARCHAR(16) NOT NULL,              -- Uber H3 Index (~5 km² spatial resolution)
    geohash_precision5 VARCHAR(8) NOT NULL,          -- Standard Geohash (~4.9 km x 4.9 km)
    alert_radius_meters INTEGER NOT NULL,            -- Default: 5000 meters (5 km)
    
    -- Administrative Context
    district VARCHAR(64) NOT NULL,                   -- e.g., 'Mandya', 'Guntur', 'Kasaragod'
    taluk_mandal VARCHAR(64),                        -- Sub-district administrative boundary
    state VARCHAR(32) NOT NULL,                      -- 'Karnataka', 'Tamil Nadu', 'Kerala', etc.
    
    -- Provenance & Governance
    report_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    verification_source VARCHAR(64) NOT NULL,        -- 'KVK_EXPERT' | 'ICAR_SURVEILLANCE' | 'CONSENSUS_CLUSTER'
    verification_status VARCHAR(32) NOT NULL,        -- 'VERIFIED' | 'UNDER_REVIEW' | 'ARCHIVED'
    verified_by VARCHAR(128),                        -- Expert designation or algorithm hash
    severity VARCHAR(16) NOT NULL,                   -- 'CRITICAL' | 'SEVERE' | 'MODERATE' | 'LOW'
    
    -- Advisory Payload
    farmer_action_summary TEXT NOT NULL,             -- Plain language advisory in vernacular
    prophylactic_measures TEXT NOT NULL              -- Certified non-pesticidal / bio-control action
);
```

---

## 4. JSON Payload Specification for Mobile Clients

When a farmer opens the **"Local Crop Alerts"** view in the KRISHI MARGA app, the client dispatches its coarse location (e.g. current district or H3 index) to receive active verified advisories:

```json
{
  "status": "success",
  "data_version": "2026.09.11",
  "alerts_count": 1,
  "alerts": [
    {
      "alert_id": "ALERT-KA-MND-202609-0012",
      "crop": "Paddy / Rice",
      "pest_or_disease": "Brown Plant Hopper (BPH)",
      "scientific_name": "Nilaparvata lugens",
      "severity": "CRITICAL",
      "district": "Mandya",
      "region_display_name": "Cauvery Irrigation Tract (Maddur / Malavalli)",
      "approximate_distance_km": 6.5,
      "alert_radius_km": 10.0,
      "reported_date": "2026-09-10T14:30:00Z",
      "verification_source": "ZARS Mandya & Agricultural Department Surveillance",
      "verification_status": "VERIFIED",
      "symptoms": "Yellowing and circular hopper-burn drying at the base of tillers.",
      "farmer_action": [
        "Drain standing field water for 3 to 4 days (Alternate Wetting & Drying).",
        "Avoid indiscriminate synthetic pyrethroid spraying.",
        "Inspect the base of 20 tillers across the field for brown hopper nymphs."
      ]
    }
  ]
}
```

---

## 5. Security & Legal Compliance

1. **Digital Personal Data Protection Act (DPDPA 2023, India)**:
   - Full compliance with Section 6 (Consent) and Section 8 (Obligations of Data Fiduciary).
   - Coordinates are purged from server volatile memory immediately following spatial binning.
2. **Reverse Geocoding Resistance**:
   - The spatial jitter algorithm applies non-linear Gaussian noise such that coordinate inversion cannot isolate any individual farm holding <10 hectares.
3. **No Commercial Data Brokerage**:
   - Crop disease incidence data will never be monetized, shared with agrochemical marketing syndicates, or exposed to commodity speculators.
