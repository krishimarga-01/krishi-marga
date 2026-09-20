import rskDataRaw from './karnataka_rsk.json';

export interface RSKOfficer {
  designation: string;
  officer_name: string | null;
  phone: string | null;
  source_sl_no: string;
  source_line: number;
}

export interface RSKLocation {
  id: string;
  state: string;
  district: string;
  taluk: string;
  hobli: string | null;
  office_type: 'RSK' | 'DEPARTMENT_OFFICE';
  name: string;
  place: string;
  pincode: string | null;
  phones: string[];
  officers: RSKOfficer[];
  verification_status: string;
  source_lines: number[];
  officer_count: number;
}

export interface RSKDatabase {
  version: string;
  generated_at: string;
  state: string;
  total_locations: number;
  total_officer_records: number;
  districts_count: number;
  locations: RSKLocation[];
}

export const karnatakaRSKData = rskDataRaw as unknown as RSKDatabase;
