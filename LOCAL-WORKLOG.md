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

## 2026-04-28

- Merged the Main Campus Qualifier, DPWAS Eligible, and Satellite Campus checker flows into one tabbed interface.
- Added mode-aware API lookup using `mode=main`, `mode=dpwas`, and `mode=satellite`.
- Made checker headings, button text, result rendering, and Information & Reminders content update according to the active top tab.
- Matched Main Campus and DPWAS result states from the original checker pages, including qualified, not-on-list, DPWAS eligible, and first-release qualifier states.
- Expanded the dynamic Information & Reminders tabs with Main Campus, DPWAS, and Satellite-specific content.
- Updated the Satellite Campus Important Reminders tab to match the Admission Committee text, including the nested requirements list.

