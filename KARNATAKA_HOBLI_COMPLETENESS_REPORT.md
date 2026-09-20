# Karnataka Hobli Completeness & Verification Report

**Status**: `PARTIAL / NOT PROVABLE FROM SOURCE`  
**Date**: 2026-09-12  
**Source**: Karnataka Agriculture Department Official CUG Directory  

---

## 1. Executive Summary & Verification Findings

> [!IMPORTANT]
> **Honest Verification Principle**:
> The provided Karnataka Agriculture Department CUG directory does **NOT** contain an explicit, exhaustive list of all 750+ administrative Hoblis in Karnataka.
> In total, only **8 lines** across the entire 6,328-line source file contain the explicit word "Hobli".
> In accordance with strict instructions:
> - **We DO NOT guess Hoblis from RSK village names.**
> - **When Hobli cannot be established directly from the text, `hobli = null`.**
> - **We DO NOT falsely claim 'all Karnataka hoblis' are present.**

---

## 2. Category Analysis

### Category A: Hoblis Explicitly Present in Source (7 Records)
The following records explicitly mention "Hobli" in their official place of office:
1. **Shanthigrama Hobli** (Hassan Taluk, Hassan District) — Line 2958
2. **Salagame Hobli** (Hassan Taluk, Hassan District) — Line 2962
3. **Kattaya Hobli** (Hassan Taluk, Hassan District) — Line 2970
4. **Dudda Hobli** (Hassan Taluk, Hassan District) — Line 2974
5. **Kasaba Hobli** (Hassan Taluk, Hassan District) — Line 2978
6. **Balele Hobli** (Ponnampet Taluk, Kodagu District) — Line 4292
7. **Ponnampet Hobli** (Ponnampet Taluk, Kodagu District) — Line 4296
8. **Srimangala Hobli** (Ponnampet Taluk, Kodagu District) — Line 4300

### Category B: RSK Locations Present, But Hobli Not Explicitly Stated (250 Centers)
Most field centers in the directory are identified by their **RSK Name** or **Village Circle Name** rather than the administrative Hobli name.
For example:
- `RSK Kaladagi` (Bagalkote Taluk) — Kaladagi is a known rural center where the RSK is situated, but the document does not use the word "Hobli".
- `RSK Kaup` (Udupi Taluk) — Kaup is listed directly as the RSK station without the hobli qualifier.
- `RSK Varuna` (Mysuru Taluk) — Listed as `RSK, VARUNA - 570010`.
- `RSK Bannur` (T. Narasipura Taluk) — Listed as `RSK, BANNUR - 571101`.
- `RSK Sompura` (Nelamangala Taluk) — Listed as `Agriculture Officer Sompura`.

Under our strict data integrity policy, all of these have `hobli = null` in the database.

### Category C: Administrative Hoblis That Cannot Be Confirmed From Source
Karnataka has over 750 revenue Hoblis across its 240 Taluks. Because the source directory is an internal **CUG Mobile Directory of Agriculture Department Officers** rather than a Revenue Department Hobli Gazetteer, hundreds of revenue hoblis that do not host a dedicated RSK building or whose officers are listed under the Taluk ADA office are not explicitly named in this source.

---

## 3. Impact on User Experience & UI Handling

To ensure an intuitive, transparent experience for farmers:
1. **Adaptive Drilldown**:
   - In the mobile app's hierarchical filter: **District → Taluk → RSK / Office**.
   - If a selected RSK has an explicit Hobli (e.g. Shanthigrama, Balele), a **Hobli badge** is displayed.
   - If Hobli is `null`, the UI displays the verified **RSK Village / Center Name** cleanly without showing empty placeholders or "Unknown Hobli".
2. **Instant Cross-Field Search**:
   - Farmers can search directly by village name, RSK name, Taluk, District, or Pincode.
