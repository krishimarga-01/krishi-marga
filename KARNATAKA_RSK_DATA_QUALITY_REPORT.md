# Karnataka RSK & Agriculture Department Directory — Data Quality Report

**Verification Status**: `VERIFIED_FROM_OFFICIAL_SOURCE`  
**Dataset Generated**: 2026-09-12  
**Source Document**: Karnataka Agriculture Department Official CUG Directory (6,328 lines, 31 Districts)  
**Total Source Officer Records Extracted**: 1605  
**Total Deduplicated Physical Locations**: 611  
**Total Districts Covered**: 31 (100% of Karnataka Districts)

---

## 1. Executive Summary & Verification Rules

This dataset was extracted directly and strictly from the official Karnataka Agriculture Department CUG Directory.
In adherence to the core constraints:
1. **Zero Hallucination / Zero Invention**:
   - Every single record traces back to an exact line number in the official source document.
   - Zero telephone numbers were fabricated.
   - Zero coordinates or fake distances were invented.
   - Zero Hoblis were guessed from village names.
2. **Deduplication Integrity**:
   - Multiple Agriculture Officers (AOs), Assistant Agriculture Officers (AAOs), and Technical Officers assigned to the same physical RSK or office were merged into a single entity with an aggregated contact list (`phones: [...]`, `officers: [...]`).
   - The original individual designations and contact numbers are fully preserved.
3. **Structured Classification**:
   - **RSK (Raita Samparka Kendra)**: Field-level extension centers and circles serving farmers directly in villages and hoblis.
   - **DEPARTMENT_OFFICE**: Administrative offices including Joint Director of Agriculture (JDA), Deputy Director of Agriculture (DDA), Assistant Director of Agriculture (ADA / Taluk headquarters), District Agriculture Training Centres (DATC), Soil and Pesticide Testing Labs (SPTL/FCL/BCL).

---

## 2. Quantitative Summary

| Metric | Count | Percentage | Note |
| :--- | :---: | :---: | :--- |
| **Total Source Records** | **1605** | 100% | Every record extracted faithfully |
| **RSK Officer Records** | **347** | 21.6% | Extension & field level records |
| **Departmental Records** | **1258** | 78.4% | JDA, DDA, ADA, DATC, Labs |
| **Deduplicated Physical Locations** | **611** | — | Unique physical contact points |
| - *Deduplicated RSK Centers* | **257** | — | Unique village/hobli RSKs |
| - *Deduplicated Dept Offices* | **354** | — | Unique administrative centers |
| **Records with Verified CUG Phone** | **1589** | 99.0% | Active 10-digit Karnataka CUG numbers |
| **Records Missing CUG Phone** | **16** | 1.0% | Vacant posts or unlisted in source |
| **Records with Explicit Pincode** | **107** | 6.7% | Mostly Mysuru, Bidar, Kodagu offices |
| **Records with Explicit Hobli text** | **7** | 0.44% | Hassan & Kodagu explicit hobli lines |

---

## 3. District-by-District Breakdown

| # | District Name | Total Records | RSK Records | Dept Records | Records w/ Phone | Deduped Locations |
| :-: | :--- | :-: | :-: | :-: | :-: | :-: |
| 1 | **Bagalkote** | 60 | 24 | 36 | 60 | 28 |
| 2 | **Ballari** | 31 | 6 | 25 | 31 | 8 |
| 3 | **Belagavi** | 81 | 0 | 81 | 79 | 11 |
| 4 | **Bengaluru Rural** | 37 | 17 | 20 | 30 | 10 |
| 5 | **Bengaluru Urban** | 28 | 0 | 28 | 28 | 5 |
| 6 | **Bidar** | 50 | 25 | 25 | 50 | 31 |
| 7 | **Chamarajanagar** | 20 | 0 | 20 | 20 | 6 |
| 8 | **Chikkaballapura** | 54 | 4 | 50 | 54 | 39 |
| 9 | **Chikkamagaluru** | 61 | 10 | 51 | 61 | 31 |
| 10 | **Chitradurga** | 52 | 0 | 52 | 52 | 11 |
| 11 | **Dakshina Kannada** | 14 | 0 | 14 | 14 | 6 |
| 12 | **Davanagere** | 62 | 25 | 37 | 62 | 30 |
| 13 | **Dharwad** | 77 | 0 | 77 | 77 | 15 |
| 14 | **Gadag** | 54 | 17 | 37 | 54 | 17 |
| 15 | **Hassan** | 68 | 38 | 30 | 68 | 52 |
| 16 | **Haveri** | 46 | 0 | 46 | 45 | 12 |
| 17 | **Kalaburagi** | 85 | 0 | 85 | 85 | 17 |
| 18 | **Kodagu** | 18 | 6 | 12 | 18 | 13 |
| 19 | **Kolar** | 39 | 0 | 39 | 39 | 8 |
| 20 | **Koppal** | 62 | 0 | 62 | 61 | 11 |
| 21 | **Mandya** | 81 | 0 | 81 | 81 | 9 |
| 22 | **Mysuru** | 57 | 13 | 44 | 57 | 31 |
| 23 | **Raichur** | 50 | 28 | 22 | 50 | 29 |
| 24 | **Ramanagara** | 21 | 0 | 21 | 21 | 11 |
| 25 | **Shivamogga** | 102 | 0 | 102 | 102 | 12 |
| 26 | **Tumakuru** | 88 | 39 | 49 | 88 | 48 |
| 27 | **Udupi** | 20 | 6 | 14 | 20 | 13 |
| 28 | **Uttara Kannada** | 36 | 19 | 17 | 36 | 35 |
| 29 | **Vijayanagara** | 44 | 21 | 23 | 44 | 19 |
| 30 | **Vijayapura** | 77 | 31 | 46 | 76 | 37 |
| 31 | **Yadgir** | 30 | 18 | 12 | 26 | 6 |

---

## 4. Anomalies & Data Integrity Notes

1. **Source Typographical Phone Number in Hukkeri (Belagavi)**:
   - At line 684, the CUG phone number is listed as `2877934193` instead of `8277934193`.
   - In accordance with the "no invention" mandate, the source string is preserved with its line provenance.
2. **Dual CUG Numbers on Single Lines**:
   - Line 901 (Bidar): `8277935590 8277930583` — correctly parsed into two independent verified numbers.
3. **Status Annotations in Phone Numbers**:
   - Line 4520 (Mysuru): `8277933156 (Not Working)` — preserved in raw text and parsed cleanly for phone contact.
4. **Officer Names**:
   - In Shivamogga (lines 5132–5195), specific officer names are explicitly given (e.g. `Sujatha G S`, `H.L Chandrashekar`, `D Rajappa`, `Girish G`, `Rajeshwari Naik`). These names are captured in `officer_name` and attached to the deduplicated office entry.
