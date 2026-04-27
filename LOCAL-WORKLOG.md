# Local Worklog: SLSU Satellite Campus Qualifier Checker

## 2026-04-27

- Created this folder as a separate SLSU Satellite Campus qualifier checker.
- Replaced the public page wording with satellite campus qualifier instructions.
- Updated the checker result to show Application Number, Satellite Campus, Course, and Date.
- Replaced the lookup API with a single satellite qualifier secure data source: `api/satellite_qualifiers.secure.json`.
- Added `scripts/generate-satellite-secure-data.ps1` for future CSV uploads.
- Added `satellite_qualifiers.csv` as a sample/template file.
- Verified the API returns found, ready, and not-found responses using a sample encrypted dataset.
- Added fallback lookup for Main Campus DPWAS and Main Campus first-choice qualifier records.

