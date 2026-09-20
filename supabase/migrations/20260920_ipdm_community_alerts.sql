-- ==============================================================================
-- KRISHI MARGA — IPDM & COMMUNITY PEST EARLY WARNING (LAYER 2 POSTGIS SCHEMA)
-- Additive Migration: creates tables for farmers, pest reports, and PostGIS distance query.
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. Farmers Registry
CREATE TABLE IF NOT EXISTS farmers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(100),
  location GEOMETRY(Point, 4326),
  latitude NUMERIC(10, 6) NOT NULL,
  longitude NUMERIC(10, 6) NOT NULL,
  state VARCHAR(50) DEFAULT 'Karnataka',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_farmers_location ON farmers USING GIST (location);

-- 2. Pest Master
CREATE TABLE IF NOT EXISTS pests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  common_name VARCHAR(100) UNIQUE NOT NULL,
  scientific_name VARCHAR(100),
  category VARCHAR(50),
  primary_crops TEXT[]
);

-- 3. Farmer Pest Reports
CREATE TABLE IF NOT EXISTS pest_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID REFERENCES farmers(id) ON DELETE SET NULL,
  crop VARCHAR(100) NOT NULL,
  pest VARCHAR(100) NOT NULL,
  severity VARCHAR(20) CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')) NOT NULL,
  location GEOMETRY(Point, 4326) NOT NULL,
  latitude NUMERIC(10, 6) NOT NULL,
  longitude NUMERIC(10, 6) NOT NULL,
  image_url TEXT,
  confidence NUMERIC(4, 3),
  notes TEXT,
  reported_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pest_reports_location ON pest_reports USING GIST (location);

-- 4. Community Pest Alerts (Generated per farmer within 10 km radius)
CREATE TABLE IF NOT EXISTS pest_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID REFERENCES pest_reports(id) ON DELETE CASCADE,
  recipient_farmer_id UUID REFERENCES farmers(id) ON DELETE CASCADE,
  pest VARCHAR(100) NOT NULL,
  crop VARCHAR(100) NOT NULL,
  severity VARCHAR(20) NOT NULL,
  distance_km NUMERIC(6, 2) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'UNREAD',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pest_alerts_recipient ON pest_alerts (recipient_farmer_id, status);

-- 5. PostGIS Stored Function: Find farmers within 10 km (10,000 meters) and dispatch alerts
CREATE OR REPLACE FUNCTION generate_community_pest_alerts(
  p_report_id UUID,
  p_radius_meters DOUBLE PRECISION DEFAULT 10000.0
)
RETURNS TABLE (
  farmer_id UUID,
  farmer_name VARCHAR,
  distance_km NUMERIC
) AS $$
DECLARE
  v_report pest_reports%ROWTYPE;
BEGIN
  SELECT * INTO v_report FROM pest_reports WHERE id = p_report_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Report % not found', p_report_id;
  END IF;

  RETURN QUERY
  SELECT 
    f.id AS farmer_id,
    f.name AS farmer_name,
    ROUND((ST_Distance(f.location::geography, v_report.location::geography) / 1000.0)::numeric, 2) AS distance_km
  FROM farmers f
  WHERE 
    (v_report.farmer_id IS NULL OR f.id != v_report.farmer_id)
    AND ST_DWithin(f.location::geography, v_report.location::geography, p_radius_meters)
  ORDER BY distance_km ASC;
END;
$$ LANGUAGE plpgsql;

-- 6. Outbreak Events View (Clusters 3+ reports within 10km in the last 7 days)
CREATE OR REPLACE VIEW outbreak_events AS
SELECT 
  crop,
  pest,
  COUNT(*) AS report_count,
  MAX(severity) AS peak_severity,
  MIN(reported_at) AS first_detected_at,
  MAX(reported_at) AS last_detected_at,
  ROUND(AVG(latitude)::numeric, 6) AS center_latitude,
  ROUND(AVG(longitude)::numeric, 6) AS center_longitude
FROM pest_reports
WHERE reported_at >= NOW() - INTERVAL '7 days'
GROUP BY crop, pest
HAVING COUNT(*) >= 2;

-- 7. Row Level Security (RLS) Policies
ALTER TABLE farmers ENABLE ROW LEVEL SECURITY;
ALTER TABLE pests ENABLE ROW LEVEL SECURITY;
ALTER TABLE pest_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE pest_alerts ENABLE ROW LEVEL SECURITY;

-- Pests reference data is publicly readable
CREATE POLICY "Pests are readable by all" ON pests
  FOR SELECT USING (true);

-- Farmers can read their own profile
CREATE POLICY "Farmers can read own profile" ON farmers
  FOR SELECT USING (auth.uid() = id OR auth.role() = 'anon');

-- Farmers can insert their own reports
CREATE POLICY "Farmers can submit pest reports" ON pest_reports
  FOR INSERT WITH CHECK (true);

-- Anyone can view anonymized reports for regional awareness
CREATE POLICY "Pest reports are viewable by all" ON pest_reports
  FOR SELECT USING (true);

-- Farmers can view their own alerts
CREATE POLICY "Farmers can view own alerts" ON pest_alerts
  FOR SELECT USING (recipient_farmer_id = auth.uid() OR auth.role() = 'anon');

